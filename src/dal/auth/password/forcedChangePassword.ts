import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { ForcedChangePasswordDALSchema, ForcedChangePasswordDALType } from "@/zod/auth";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { getIPAddress, logSecurityAuditEntry } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { applyPasswordChange } from "./_applyPasswordChange";

const userRateLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60 * 15, // 15 minutes
});

type ForcedChangePasswordError = { error: { tooManyRequests: true } };

/**
 * Forced password change flow — used when a user must change their password on login
 * (e.g. after an admin reset).
 *
 * - Requires `AuthRole.user`.
 * - Security guard: rejects the call if `changePasswordOnLogin` is not set on the user,
 *   preventing this endpoint from being used outside the intended flow.
 * - On success: hashes the new password, invalidates all other active sessions
 *   and refresh tokens, updates the iron-session flag, and sends a notification email.
 *
 * @param data - Validated payload containing `newPassword`.
 * @returns `undefined` on success, or one of the following error shapes:
 *   - `{ error: { tooManyRequests: true } }` — rate limit exceeded (5 attempts per 15 minutes per user)
 * @throws {Error} If the user record cannot be found, or if the forced-change flag is not set.
 */
export const forcedChangePassword = async (data: ForcedChangePasswordDALType): Promise<void | ForcedChangePasswordError> => {
    const [user, { newPassword }] = await genericSAValidator(
        AuthRole.user,
        data,
        ForcedChangePasswordDALSchema,
    );

    const headerList = await headers();
    const ipAddress = getIPAddress(headerList);
    const agent = userAgent({ headers: headerList });

    const limit = await userRateLimiter.get(user.id);
    if (limit !== null && limit.remainingPoints <= 0) {
        return { error: { tooManyRequests: true } };
    }
    await userRateLimiter.consume(user.id);

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { changePasswordOnLogin: true },
    });

    if (!dbUser) {
        throw new Error("User not found");
    }

    if (dbUser.changePasswordOnLogin !== true) {
        await logSecurityAuditEntry({
            action: "FORCED_CHANGE_PASSWORD",
            debugLevel: LogDebugLevel.WARNING,
            userId: user.id,
            success: false,
            ipAddress,
            userAgent: agent,
            details: "Forced password change rejected: flag not set",
        });
        throw new Error("Password change not required");
    }

    const ironSession = await getIronSession();
    const currentSessionId = ironSession.sessionId;

    await applyPasswordChange(user.id, newPassword, currentSessionId, "FORCED_CHANGE_PASSWORD", ipAddress, agent);

    if (ironSession.user) {
        ironSession.user.changePasswordOnLogin = false;
        await ironSession.save();
    }
};
