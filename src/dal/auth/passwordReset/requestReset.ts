"use server";

import crypto from "crypto";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { setTimeout } from "timers/promises";
import { prisma } from "@/lib/db";
import { sha256Hex } from "@/dal/auth/helper.tokens";
import { sendPasswordResetEmail } from "@/lib/email/passwordResetEmail";
import { ForgotPasswordSchema, ForgotPasswordType } from "@/zod/auth";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { getIPAddress, logSecurityAuditEntry } from "@/dal/auth/helper";
import { LogDebugLevel } from "@/dal/auth/LogDebugLeve.enum";
import { getCurrentLocale } from "@/lib/locales/config";
import dayjs from "dayjs";

const ipLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60 * 60, // 1 hour
});

export const requestPasswordReset = async (data: ForgotPasswordType) => {
    const parsed = ForgotPasswordSchema.safeParse(data);
    if (!parsed.success) {
        console.warn("requestPasswordReset: received invalid data", parsed.error.issues);
        return { success: false };
    }

    const { organisationId, email } = parsed.data;
    const locale = getCurrentLocale();
    const headerList = await headers();
    const ipAddress = getIPAddress(headerList);
    const agent = userAgent({ headers: headerList });

    // IP rate limiting — atomic consume to prevent race between get+consume
    try {
        await ipLimiter.consume(ipAddress, 1);
    } catch {
        console.warn("requestPasswordReset: rate limit exceeded", { ipAddress });
        return { success: false, error: "tooManyRequests" as const };
    }

    // Random delay to prevent timing-based user enumeration: both the
    // "user found" and "user not found" code paths are obscured behind the
    // same noise floor, making it impossible to distinguish them by latency.
    await setTimeout(200 + Math.floor(Math.random() * 200));

    // Look up user — always return success to prevent user enumeration
    const user = await prisma.user.findFirst({
        where: { email, organisationId, recDelete: null, active: true },
    });

    if (!user) {
        await logSecurityAuditEntry({
            action: "PASSWORD_RESET_REQUEST",
            success: false,
            debugLevel: LogDebugLevel.WARNING,
            ipAddress,
            userAgent: agent,
            organisationId,
            details: `Password reset requested for unknown email: ${email}`,
        });
        return { success: true };
    }

    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = sha256Hex(rawToken);

    const baseUrl = (process.env.APPLICATION_URL ?? "").replace(/\/$/, "");
    const resolvedLocale = (await locale) ?? "de";
    const resetLink = `${baseUrl}/${resolvedLocale}/reset-password?token=${rawToken}`;

    // Transaction: if email delivery fails the token creation is rolled back,
    // so the user is not left with an unreachable token in the DB.
    try {
        await prisma.$transaction(async (client) => {
            // Delete previous unused reset tokens for this user
            await client.passwordResetToken.deleteMany({
                where: { userId: user.id, usedAt: null },
            });

            // Store only the hash — raw token is only ever in the email link
            await client.passwordResetToken.create({
                data: {
                    tokenHash,
                    userId: user.id,
                    organisationId,
                    endOfLive: dayjs().add(1, "hour").toDate(),
                    ipAddress,
                },
            });

        });

        try {
            await sendPasswordResetEmail(user, resetLink);
        } catch (e) {
            console.error("requestPasswordReset: failed to send email", e);
            await prisma.passwordResetToken.delete({
                where: { tokenHash },
            });
            return { success: false };
        }

        await logSecurityAuditEntry({
            action: "PASSWORD_RESET_REQUEST",
            success: true,
            debugLevel: LogDebugLevel.SUCCESS,
            ipAddress,
            userAgent: agent,
            userId: user.id,
            organisationId,
            details: "Password reset email sent successfully",
        });
    } catch (e) {
        console.error("requestPasswordReset: failed to create token or send email", e);
        await logSecurityAuditEntry({
            action: "PASSWORD_RESET_REQUEST",
            success: false,
            debugLevel: LogDebugLevel.CRITICAL,
            ipAddress,
            userAgent: agent,
            userId: user.id,
            organisationId,
            details: "Failed to create password reset token or send email",
        });
    }

    return { success: true };
};
