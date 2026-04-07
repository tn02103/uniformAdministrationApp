import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { sendPasswordChangedEmail } from "@/lib/email/passwordChangedEmail";
import { SelfServiceChangePasswordDALSchema, SelfServiceChangePasswordDALType } from "@/zod/auth";
import { compare as passwordCompare, hash } from "bcrypt";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { getIPAddress, logSecurityAuditEntry } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";

const SALT_ROUNDS = 12;

const userRateLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60 * 15, // 15 minutes
});

type ChangePasswordError =
    | { error: { formElement: "currentPassword"; message: string } }
    | { error: { tooManyRequests: true } };

/**
 * Self-service password change for the currently authenticated user.
 *
 * - Requires `AuthRole.user` or higher.
 * - Rate-limited to 5 failed attempts per 15 minutes per user.
 * - Verifies the current password via bcrypt before accepting the change.
 * - On success: hashes the new password, invalidates all other active sessions
 *   and refresh tokens (keeping the caller's current session alive), and sends
 *   a notification email asynchronously.
 * - Writes a security audit log entry for every attempt (success or failure), with exception of rate-limited attempts.
 *
 * @param data - Validated payload containing `currentPassword` and `newPassword`.
 * @returns `undefined` on success, or one of the following error shapes:
 *   - `{ error: { formElement: "currentPassword"; message: string } }` — wrong current password
 *   - `{ error: { tooManyRequests: true } }` — rate limit exceeded
 * @throws {Error} If the authenticated user record cannot be found in the database.
 */
export const changePassword = async (data: SelfServiceChangePasswordDALType): Promise<void | ChangePasswordError> => {
    const [user, { currentPassword, newPassword }] = await genericSAValidator(
        AuthRole.user,
        data,
        SelfServiceChangePasswordDALSchema,
    );

    const headerList = await headers();
    const ipAddress = getIPAddress(headerList);
    const agent = userAgent({ headers: headerList });

    const limit = await userRateLimiter.get(user.id);
    if (limit !== null && limit.remainingPoints <= 0) {
        console.warn("Too many failed password change attempts for user", user.id);
        return { error: { tooManyRequests: true } };
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true },
    });

    if (!dbUser) {
        await logSecurityAuditEntry({
            action: "CHANGE_PASSWORD",
            debugLevel: LogDebugLevel.WARNING,
            userId: user.id,
            success: false,
            ipAddress,
            userAgent: agent,
            details: "Password change failed: user not found",
        });
        throw new Error("User not found");
    }

    const isValid = await passwordCompare(currentPassword, dbUser.password);
    if (!isValid) {
        await userRateLimiter.consume(user.id);
        await logSecurityAuditEntry({
            action: "CHANGE_PASSWORD",
            debugLevel: LogDebugLevel.INFO,
            userId: user.id,
            success: false,
            ipAddress,
            userAgent: agent,
            details: "Password change failed: invalid current password",
        });
        return { error: { formElement: "currentPassword", message: "custom.auth.invalidCurrentPassword" } };
    }

    const hashedNewPassword = await hash(newPassword, SALT_ROUNDS);

    const ironSession = await getIronSession();
    const currentSessionId = ironSession.sessionId;

    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: user.id },
            data: {
                password: hashedNewPassword,
                changePasswordOnLogin: false,
            },
        });

        await tx.session.updateMany({
            where: {
                device: { userId: user.id },
                valid: true,
                ...(currentSessionId ? { NOT: { id: currentSessionId } } : {}),
            },
            data: { valid: false },
        });

        await tx.refreshToken.deleteMany({
            where: {
                userId: user.id,
                ...(currentSessionId ? { NOT: { sessionId: currentSessionId } } : {}),
            },
        });
    });

    await logSecurityAuditEntry({
        action: "CHANGE_PASSWORD",
        debugLevel: LogDebugLevel.SUCCESS,
        userId: user.id,
        success: true,
        ipAddress,
        userAgent: agent,
        details: "Password changed successfully",
    });

    void sendPasswordChangedEmail(user.id, "change").catch((e) =>
        console.error("changePassword: failed to send password changed notification", e)
    );
};
