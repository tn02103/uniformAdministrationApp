"use server";

import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { sha256Hex } from "@/dal/auth/helper.tokens";
import { ResetPasswordSchema, ResetPasswordType } from "@/zod/auth";

class ResetTokenError extends Error {
    constructor(public readonly code: "tokenInvalid" | "tokenExpired") {
        super(code);
    }
}

export const executePasswordReset = async (data: ResetPasswordType) => {
    const parsed = ResetPasswordSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "validation" as const };

    const { token, newPassword } = parsed.data;
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

            // Mark the token as used first so concurrent requests with the same
            // token are blocked by the usedAt check inside this same transaction.
            await client.passwordResetToken.update({
                where: { id: resetRecord.id },
                data: { usedAt: new Date() },
            });

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
