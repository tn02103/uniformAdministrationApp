"use server";

import bcrypt from "bcrypt";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { prisma } from "@/lib/db";
import { sha256Hex } from "@/dal/auth/helper.tokens";
import { ResetPasswordSchema, ResetPasswordType } from "@/zod/auth";
import { headers } from "next/headers";
import { getIPAddress } from "@/dal/auth/helper";
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

export const executePasswordReset = async (data: ResetPasswordType) => {
    const parsed = ResetPasswordSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "validation" as const };

    const { token, newPassword } = parsed.data;

    // IP rate limiting — protects against brute-forcing tokens via the server action
    try {
        await ipLimiter.consume(getIPAddress(await headers()), 1);
    } catch {
        return { success: false, error: "tooManyRequests" as const };
    }

    // Pre-validate for a fast early exit before the expensive bcrypt + transaction
    const validation = await validatePasswordResetToken(token);
    if (!validation.valid) {
        return {
            success: false,
            error: (validation.reason === "expired" ? "tokenExpired" : "tokenInvalid") as const,
        };
    }

    const tokenHash = sha256Hex(token);

    // Hash the password before opening the transaction to avoid holding a DB
    // connection during the CPU-intensive bcrypt operation.
    const passwordHash = await bcrypt.hash(newPassword, 12);

    try {
        await prisma.$transaction(async (client) => {
            const resetRecord = await client.passwordResetToken.findFirst({
                where: { tokenHash },
            });

            if (!resetRecord) throw new ResetTokenError("tokenInvalid");
            if (resetRecord.endOfLive < new Date()) throw new ResetTokenError("tokenExpired");
            if (resetRecord.usedAt !== null) throw new ResetTokenError("tokenInvalid");

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
            return { success: false, error: e.code };
        }
        throw e;
    }

    return { success: true };
};
