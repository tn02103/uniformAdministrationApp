import { prisma } from "@/lib/db";
import { sendPasswordChangedEmail } from "@/lib/email/passwordChangedEmail";
import { hash } from "bcrypt";
import { userAgent } from "next/server";
import { logSecurityAuditEntry } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";

const SALT_ROUNDS = 12;

/**
 * Shared post-authorisation steps for password change flows.
 * NOT exported from index.ts — internal helper only.
 *
 * - Hashes `newPassword` with bcrypt (12 rounds)
 * - DB transaction: updates password + clears changePasswordOnLogin flag,
 *   invalidates other sessions, deletes other refresh tokens
 * - Writes a security audit log entry
 * - Sends a password-changed notification email (fire-and-forget)
 *
 * @param userId - The user whose password is being changed
 * @param newPassword - The plaintext new password to hash and store
 * @param currentSessionId - The caller's current session ID (kept alive); pass undefined to invalidate all sessions
 * @param auditAction - The audit log action string (e.g. "CHANGE_PASSWORD", "FORCED_CHANGE_PASSWORD")
 * @param ipAddress - The caller's IP address for audit logging
 * @param agent - The caller's user-agent for audit logging
 */
export const applyPasswordChange = async (
    userId: string,
    newPassword: string,
    currentSessionId: string | undefined,
    auditAction: "CHANGE_PASSWORD" | "FORCED_CHANGE_PASSWORD",
    ipAddress: string,
    agent: ReturnType<typeof userAgent>,
): Promise<void> => {
    const hashedNewPassword = await hash(newPassword, SALT_ROUNDS);

    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: userId },
            data: {
                password: hashedNewPassword,
                changePasswordOnLogin: false,
            },
        });

        await tx.session.updateMany({
            where: {
                device: { userId },
                valid: true,
                ...(currentSessionId ? { NOT: { id: currentSessionId } } : {}),
            },
            data: { valid: false },
        });

        await tx.refreshToken.deleteMany({
            where: {
                userId,
                ...(currentSessionId ? { NOT: { sessionId: currentSessionId } } : {}),
            },
        });
    });

    await logSecurityAuditEntry({
        action: auditAction,
        debugLevel: LogDebugLevel.SUCCESS,
        userId,
        success: true,
        ipAddress,
        userAgent: agent,
        details: "Password changed successfully",
    });

    void sendPasswordChangedEmail(userId, "change").catch((e) =>
        console.error("applyPasswordChange: failed to send password changed notification", e)
    );
};
