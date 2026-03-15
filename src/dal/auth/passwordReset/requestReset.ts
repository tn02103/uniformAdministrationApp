"use server";

import crypto from "crypto";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { setTimeout } from "timers/promises";
import { prisma } from "@/lib/db";
import { sha256Hex } from "@/dal/auth/helper.tokens";
import { sendPasswordResetEmail } from "@/lib/email/passwordResetEmail";
import { ForgotPasswordSchema, ForgotPasswordType } from "@/zod/auth";
import { headers } from "next/headers";
import dayjs from "dayjs";

const ipLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60 * 60, // 1 hour
});

export const requestPasswordReset = async (data: ForgotPasswordType) => {
    const parsed = ForgotPasswordSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "validation" as const };

    const { organisationId, email } = parsed.data;
    const ipAddress = (await headers()).get("x-forwarded-for") ?? "unknown";

    // IP rate limiting — check before doing any DB work
    const ipLimit = await ipLimiter.get(ipAddress);
    if (ipLimit && ipLimit.remainingPoints <= 0) {
        return { success: false, error: "tooManyRequests" as const };
    }
    await ipLimiter.consume(ipAddress, 1).catch(() => {});

    // Random delay to prevent timing-based user enumeration: both the
    // "user found" and "user not found" code paths are obscured behind the
    // same noise floor, making it impossible to distinguish them by latency.
    await setTimeout(200 + Math.floor(Math.random() * 200));

    // Look up user — always return success to prevent user enumeration
    const user = await prisma.user.findFirst({
        where: { email, organisationId, recDelete: null, active: true },
    });

    if (!user) {
        return { success: true };
    }

    // Delete previous unused reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
    });

    // Generate a cryptographically random token, store only the hash
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = sha256Hex(rawToken);

    await prisma.passwordResetToken.create({
        data: {
            tokenHash,
            userId: user.id,
            organisationId,
            endOfLive: dayjs().add(1, "hour").toDate(),
            ipAddress,
        },
    });

    const baseUrl = (process.env.APPLICATION_URL ?? "").replace(/\/$/, "");
    const resetLink = `${baseUrl}/de/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail(user, resetLink);

    return { success: true };
};
