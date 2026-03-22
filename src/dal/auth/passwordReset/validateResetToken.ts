"use server";

import { prisma } from "@/lib/db";
import { sha256Hex } from "@/dal/auth/helper.tokens";
import { logSecurityAuditEntry, type UserAgent } from "@/dal/auth/helper";
import { LogDebugLevel } from "@/dal/auth/LogDebugLeve.enum";
import dayjs from "@/lib/dayjs";

export type ValidateResetTokenResult = { valid: true } | { valid: false };

export type ValidateTokenLogContext = {
    ipAddress: string;
    userAgent: UserAgent;
};

export const validatePasswordResetToken = async (
    token: string,
    logContext?: ValidateTokenLogContext
): Promise<ValidateResetTokenResult> => {
    const tokenHash = sha256Hex(token);

    const record = await prisma.passwordResetToken.findFirst({
        where: { tokenHash },
    });

    if (!record || record.usedAt !== null) {
        if (logContext) {
            await logSecurityAuditEntry({
                action: "PASSWORD_RESET_VALIDATE",
                success: false,
                debugLevel: LogDebugLevel.WARNING,
                ipAddress: logContext.ipAddress,
                userAgent: logContext.userAgent,
                details: record?.usedAt !== null
                    ? "Password reset token already used"
                    : "Password reset token not found",
            });
        }
        return { valid: false };
    }

    if (record.endOfLive < new Date()) {
        const secondsExpired = dayjs().diff(dayjs(record.endOfLive), "second");
        if (logContext) {
            await logSecurityAuditEntry({
                action: "PASSWORD_RESET_VALIDATE",
                success: false,
                debugLevel: LogDebugLevel.INFO,
                ipAddress: logContext.ipAddress,
                userAgent: logContext.userAgent,
                userId: record.userId,
                organisationId: record.organisationId,
                details: `Password reset token expired (${secondsExpired}s ago)`,
            });
        }
        return { valid: false };
    }

    return { valid: true };
};
