"use server";

import { prisma } from "@/lib/db";
import { sha256Hex } from "@/dal/auth/helper.tokens";

export type ValidateResetTokenResult =
    | { valid: true }
    | { valid: false; reason: "invalid" | "expired" };

export const validatePasswordResetToken = async (
    token: string
): Promise<ValidateResetTokenResult> => {
    const tokenHash = sha256Hex(token);

    const record = await prisma.passwordResetToken.findFirst({
        where: { tokenHash },
    });

    if (!record || record.usedAt !== null) {
        return { valid: false, reason: "invalid" };
    }
    if (record.endOfLive < new Date()) {
        return { valid: false, reason: "expired" };
    }
    return { valid: true };
};
