"use server";

import { getIPAddress, logSecurityAuditEntry } from "@/dal/auth/helper";
import { sha256Hex } from "@/dal/auth/helper.tokens";
import { LogDebugLevel } from "@/dal/auth/LogDebugLeve.enum";
import { prisma } from "@/lib/db";
import { sendPasswordChangedEmail } from "@/lib/email/passwordChangedEmail";
import { ResetPasswordDALSchema, ResetPasswordDALType } from "@/zod/auth";
import bcrypt from "bcrypt";
import dayjs from "@/lib/dayjs";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { validatePasswordResetToken } from "./validateResetToken";

const ipLimiter = new RateLimiterMemory({
    points: 10,
    duration: 15 * 60, // 15 minutes
});

class ResetTokenError extends Error {
    constructor(public readonly code: "tokenInvalid" | "tokenExpired") {
        super(code);
    }
}

export const executePasswordReset = async (data: ResetPasswordDALType) => {
    const headerList = await headers();
    const ipAddress = getIPAddress(headerList);
    const agent = userAgent({ headers: headerList });

    // IP rate limiting — protects against brute-forcing tokens via the server action
    try {
        await ipLimiter.consume(ipAddress, 1);
    } catch {
        console.warn("executePasswordReset: rate limit exceeded", { ipAddress });
        return { success: false, error: "tooManyRequests" };
    }

    const parsed = ResetPasswordDALSchema.safeParse(data);
    if (!parsed.success) {
        await logSecurityAuditEntry({
            action: "PASSWORD_RESET_EXECUTE",
            success: false,
            debugLevel: LogDebugLevel.WARNING,
            ipAddress,
            userAgent: agent,
            details: "Password reset attempted with invalid schema",
        });
        return { success: false, error: "validation" };
    }

    const { token, newPassword } = parsed.data;
    const logContext = { ipAddress, userAgent: agent };

    // Pre-validate for a fast early exit before the expensive bcrypt + transaction
    const validation = await validatePasswordResetToken(token, logContext);
    if (!validation.valid) {
        return { success: false, error: "tokenInvalid" };
    }

    const tokenHash = sha256Hex(token);

    // Hash the password before opening the transaction to avoid holding a DB
    // connection during the CPU-intensive bcrypt operation.
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Capture context from within the transaction for richer log entries
    let logUserId: string | undefined;
    let logOrganisationId: string | undefined;
    let logEndOfLive: Date | undefined;
    let replayAttack = false;

    try {
        await prisma.$transaction(async (client) => {
            const resetRecord = await client.passwordResetToken.findFirst({
                where: { tokenHash },
            });

            if (!resetRecord) throw new ResetTokenError("tokenInvalid");

            logUserId = resetRecord.userId;
            logOrganisationId = resetRecord.organisationId;
            logEndOfLive = resetRecord.endOfLive;

            if (resetRecord.endOfLive < new Date()) throw new ResetTokenError("tokenExpired");
            if (resetRecord.usedAt !== null) {
                replayAttack = true;
                throw new ResetTokenError("tokenInvalid");
            }

            // Atomically mark as used — concurrent requests with the same token
            // get count === 0 and are rejected even inside the same transaction.
            const updated = await client.passwordResetToken.updateMany({
                where: { id: resetRecord.id, usedAt: null },
                data: { usedAt: new Date() },
            });
            if (updated.count !== 1) throw new ResetTokenError("tokenInvalid");

            await client.user.update({
                where: { id: resetRecord.userId },
                data: { password: passwordHash },
            });

            // Revoke all active refresh tokens for this user
            await client.refreshToken.updateMany({
                where: { userId: resetRecord.userId, status: "active" },
                data: { status: "revoked" },
            });

            // Invalidate all valid sessions for this user
            await client.session.updateMany({
                where: { device: { userId: resetRecord.userId }, valid: true },
                data: { valid: false },
            });
        });
    } catch (e) {
        if (e instanceof ResetTokenError) {
            if (replayAttack) {
                await logSecurityAuditEntry({
                    action: "PASSWORD_RESET_EXECUTE",
                    success: false,
                    debugLevel: LogDebugLevel.CRITICAL,
                    ipAddress,
                    userAgent: agent,
                    userId: logUserId,
                    organisationId: logOrganisationId,
                    details: "Password reset possible replay attack detected: token already used",
                });
            } else if (e.code === "tokenExpired") {
                const secondsExpired = logEndOfLive ? dayjs().diff(dayjs(logEndOfLive), "second") : -1;
                await logSecurityAuditEntry({
                    action: "PASSWORD_RESET_EXECUTE",
                    success: false,
                    debugLevel: LogDebugLevel.INFO,
                    ipAddress,
                    userAgent: agent,
                    userId: logUserId,
                    organisationId: logOrganisationId,
                    details: `Password reset token expired in transaction (${secondsExpired}s ago)`,
                });
            } else {
                await logSecurityAuditEntry({
                    action: "PASSWORD_RESET_EXECUTE",
                    success: false,
                    debugLevel: LogDebugLevel.WARNING,
                    ipAddress,
                    userAgent: agent,
                    userId: logUserId,
                    organisationId: logOrganisationId,
                    details: "Password reset failed: token invalid or concurrent attempt detected",
                });
            }
            return { success: false, error: "tokenInvalid" };
        }
        await logSecurityAuditEntry({
            action: "PASSWORD_RESET_EXECUTE",
            success: false,
            debugLevel: LogDebugLevel.WARNING,
            ipAddress,
            userAgent: agent,
            userId: logUserId,
            organisationId: logOrganisationId,
            details: "Unexpected error during password reset transaction",
        });
        throw e;
    }

    await logSecurityAuditEntry({
        action: "PASSWORD_RESET_EXECUTE",
        success: true,
        debugLevel: LogDebugLevel.SUCCESS,
        ipAddress,
        userAgent: agent,
        userId: logUserId,
        organisationId: logOrganisationId,
        details: "Password reset successful: password updated, tokens revoked, sessions invalidated",
    });

    if (logUserId) {
        void sendPasswordChangedEmail(logUserId, "reset").catch((e) =>
            console.error("executePasswordReset: failed to send password changed notification", e)
        );
    }

    return { success: true };
};
