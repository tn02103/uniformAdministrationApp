import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/db";
import { Device, Organisation, RefreshToken, User } from "@prisma/client";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { userAgent } from "next/server";
import z from "zod";
import crypto from 'crypto';
import { getIronSession, IronSession } from "@/lib/ironSession";
import { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";


// ########## SCHEMAS AND TYPES ##########
export type UserAgent = ReturnType<typeof userAgent>;

const DeviceIdsCookieAccountSchema = z.object({
    deviceId: z.string().uuid(),
    organisationId: z.string().uuid(),
    lastUsedAt: z.string().datetime(),
});
const DeviceIdsCookieSchema = z.object({
    lastUsed: DeviceIdsCookieAccountSchema,
    otherAccounts: z.array(DeviceIdsCookieAccountSchema)
});
export type DeviceIdsCookie = z.infer<typeof DeviceIdsCookieSchema>;
export type DeviceIdsCookieAccount = z.infer<typeof DeviceIdsCookieAccountSchema>;

// ########## CONFIG ##########
export const AuthConfig = {
    deviceCookie: process.env.AUTH_DEVICE_COOKIE_NAME ?? "deviceToken",
    refreshTokenCookie: process.env.AUTH_REFRESH_COOKIE_NAME ?? "refreshToken",
    maxSessionAgeDays: +(process.env.AUTH_MAX_SESSION ?? 30), // After this many days a full re-auth is required
    maxRefreshTokenAgeDays: +(process.env.AUTH_MAX_REFRESH ?? 30), // After this many days the refresh token is invalid
    refreshTokenReuse: {
        acceptedTime: 1000,
        mediumRiskTime: 5000,
    },
}

export const getIPAddress = (headers: ReadonlyHeaders) => {
    return headers.get('true-client-ip') ?? headers.get('x-forwarded-for') ?? "Unknown IP";
}

type LogSecurityAuditEntryData = {
    action: "LOGIN_ATTEMPT" | "REFRESH_ACCESS_TOKEN" | "LOGOUT" | "CREATE_2FA_APP" | "VERIFY_2FA_APP" | "REMOVE_2FA_APP";
    userId?: string;
    deviceId?: string;
    organisationId?: string;
    success: boolean;
    ipAddress: string | null;
    userAgent: UserAgent;
    details: string;
}
/**
* Logs a login attempt to the audit log.
* @param data 
*/
export const logSecurityAuditEntry = async (data: LogSecurityAuditEntryData) => {
    const { userId, organisationId, success, ipAddress, details, action, deviceId } = data;
    const userAgent = JSON.stringify(data.userAgent);

    await prisma.auditLog.create({
        data: {
            userId,
            deviceId,
            details,
            organisationId,
            ipAddress,
            userAgent,
            action,
            state: success ? "SUCCESS" : "FAILURE",
            entity: "",
        }
    });
}

type IssueNewRefreshTokenProps = {
    cookieList: ReadonlyRequestCookies;
    userId: string;
    deviceId: string;
    ipAddress: string;
    endOfLife?: Date;
} & ({ usedRefreshToken?: undefined, userAgent?: undefined } | {
    userAgent: UserAgent;
    usedRefreshToken: string;
})
/**
 * Issues a new access token for the user.
 */
export const issueNewRefreshToken = async (props: IssueNewRefreshTokenProps) => {
    const {
        cookieList,
        deviceId,
        userId,
        ipAddress,
        usedRefreshToken,
        endOfLife = dayjs().add(3, "days").toDate(),
        userAgent,
    } = props;

    if (usedRefreshToken) {
        // Mark the used refresh token as used
        await prisma.refreshToken.update({
            where: {
                token: usedRefreshToken,
                userId: userId,
                revoked: false,
                usedAt: null,
                endOfLife: { gt: new Date() },
            },
            data: {
                usedAt: new Date(),
                usedIpAddress: ipAddress,
                usedUserAgent: JSON.stringify(userAgent),
            }
        });
    }

    // Invalidate existing refreshTokens
    await prisma.refreshToken.updateMany({
        where: {
            deviceId: deviceId,
            userId: userId,
            revoked: false,
            usedAt: null,
            endOfLife: { gt: new Date() },
        },
        data: {
            revoked: true,
        }
    });

    // Create new refresh Token

    let refreshToken = crypto.randomBytes(64).toString('hex');
    while (await prisma.refreshToken.findUnique({ where: { token: refreshToken } })) {
        // Regenerate if collision (extremely unlikely)
        refreshToken = crypto.randomBytes(64).toString('hex');
    }

    await prisma.refreshToken.create({
        data: {
            userId: userId,
            deviceId: deviceId,
            token: refreshToken,
            endOfLife,
            issuerIpAddress: ipAddress,
        }
    });
    // Set Refreshtoken cookie
    cookieList.set(AuthConfig.refreshTokenCookie, refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: endOfLife,
    });
}

type IssueNewAccessTokenProps = {
    user: User;
    session: IronSession;
    organisation: Organisation;
}
export const issueNewAccessToken = async (props: IssueNewAccessTokenProps) => {
    const { user, session, organisation } = props;
    session.user = {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        organisationId: organisation.id,
        acronym: organisation.acronym
    };
    await session.save();
}

type GetAccountProps = {
    cookieList: ReadonlyRequestCookies;
    organisationId?: string;
}
/**
 * Gets device accounts from cookies. If organisationId is provided it will return the account for that organisation.
 * @param param0 
 * @returns 
 */
export const getDeviceAccountFromCookies = ({ cookieList, organisationId }: GetAccountProps): ({ account: DeviceIdsCookieAccount | null; accountCookie: DeviceIdsCookie | null; }) => {
    const accountCookieString = cookieList.get(AuthConfig.deviceCookie);
    const accountCookie: DeviceIdsCookie | null = accountCookieString ?
        DeviceIdsCookieSchema.parse(JSON.parse(accountCookieString.value)) :
        null;

    if (accountCookie && organisationId) {
        if (accountCookie.lastUsed.organisationId === organisationId) {
            return {
                accountCookie,
                account: accountCookie.lastUsed
            };
        } else {
            return {
                account: accountCookie.otherAccounts.find(x => x.organisationId === organisationId) ?? null,
                accountCookie
            };
        }
    } else if (accountCookie) {
        return { account: null, accountCookie };
    }
    return { account: null, accountCookie: null };
}

type DeviceValidationResult = {
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "SEVERE",
    reasons: string[];
}
/**
 * Validates the device fingerprint based on several criteria. 
 * @param ipAddress 
 * @param device 
 * @param deviceCookie 
 * @param currentIP 
 * @param currentUA 
 * @returns 
 */
export const validateDeviceFingerprint = async (
    ipAddress: string,
    device: Pick<Device, "id" | "userAgent">,
    currentDeviceId: string,
    currentIP: string,
    currentUA: UserAgent
): Promise<DeviceValidationResult> => {
    const reasons: string[] = [];
    let riskLevel: DeviceValidationResult["riskLevel"] = 'LOW';

    // 1. CRITICAL: Device ID must match
    if (device.id !== currentDeviceId) {
        return {
            riskLevel: 'SEVERE',
            reasons: ['Device ID mismatch']
        };
    }

     // 4. IP Address check (informational)
    if (ipAddress !== currentIP) {
        reasons.push('IP address changed');
        // Mobile users change IPs frequently - don't elevate risk
    }

    // 2. Parse stored user agent
    let storedUA;
    try {
        storedUA = JSON.parse(device.userAgent);
    } catch {
        reasons.push('Invalid stored user agent');
        riskLevel = 'SEVERE';
    }
   

    // 3. User Agent validation
    if (storedUA) {
        // Critical properties that shouldn't change
        const criticalMismatches = [];

        if (storedUA.os?.name !== currentUA.os?.name) {
            criticalMismatches.push('OS name changed');
        }

        if (storedUA.device?.type !== currentUA.device?.type) {
            criticalMismatches.push('Device type changed');
        }

        if (storedUA.browser?.name !== currentUA.browser?.name) {
            criticalMismatches.push('Browser name changed');
        }

        // If any critical property changed, this is suspicious
        if (criticalMismatches.length > 0) {
            return {
                riskLevel: 'SEVERE',
                reasons: criticalMismatches
            };
        }

        // Check for minor changes (informational only)
        if (storedUA.browser?.version !== currentUA.browser?.version) {
            reasons.push('Browser version updated');
            riskLevel = "MEDIUM"
            // This is normal - browsers auto-update
        }

        if (storedUA.os?.version !== currentUA.os?.version) {
            reasons.push('OS version updated');
            riskLevel = 'HIGH'; // Less common, slightly more suspicious
        }
    }


    return { riskLevel, reasons };
}

type RefreshTokenReuseResult = {
    action: 'ALLOW' | 'REQUIRE_REAUTH' | 'INVALIDATE_ALL_SESSIONS';
    reason: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
/**
 * Handles refresh token reuse detection and determines appropriate response
 */
export const handleRefreshTokenReuse = async (
    usedToken: RefreshToken,
    currentRequest: {
        deviceId: string;
        ipAddress: string;
        userAgent: UserAgent;
    }
): Promise<RefreshTokenReuseResult> => {
    if (!usedToken.usedAt || !usedToken.usedIpAddress || !usedToken.usedUserAgent) {
        // If any critical information is missing, we cannot validate the token
        return {
            action: 'INVALIDATE_ALL_SESSIONS',
            reason: 'Missing token usage context - implementation error',
            riskLevel: 'CRITICAL'
        };
    }

    // Compare the original token usage context with current request
    const deviceFingerprint = await validateDeviceFingerprint(
        usedToken.usedIpAddress ?? 'unknown',
        { id: usedToken.deviceId, userAgent: usedToken.usedUserAgent },
        currentRequest.deviceId,
        currentRequest.ipAddress,
        currentRequest.userAgent
    );

    // Same device, same IP, same user agent = likely parallel requests
    const isLowRiskUA = deviceFingerprint.riskLevel === 'LOW' && deviceFingerprint.reasons.length === 0;

    // Time since token was used (parallel requests should be very close)
    const timeSinceUsed = Date.now() - usedToken.usedAt!.getTime();
    const isWithinParallelWindow = timeSinceUsed < AuthConfig.refreshTokenReuse.acceptedTime; // 2 seconds TODO - make configurable //
    const isWithinLowRiskWindow = timeSinceUsed < AuthConfig.refreshTokenReuse.mediumRiskTime;
    if (isLowRiskUA && isWithinParallelWindow) {
        return {
            action: 'ALLOW',
            reason: 'Likely parallel request from same context',
            riskLevel: 'LOW'
        };
    }

    if (isLowRiskUA && !isWithinParallelWindow && isWithinLowRiskWindow) {
        return {
            action: 'REQUIRE_REAUTH',
            reason: 'Same device but not in parallel request window',
            riskLevel: 'MEDIUM'
        };
    }

    // Different device or significant time gap = potential attack
    return {
        action: 'INVALIDATE_ALL_SESSIONS',
        reason: 'Refresh token reuse from different context - possible token theft',
        riskLevel: 'CRITICAL'
    };
};

/**
 * Invalidates all active sessions for a user across all devices
 */
export const invalidateAllUserSessions = async (userId: string, deviceId: string): Promise<void> => {
    await prisma.refreshToken.updateMany({
        where: {
            userId: userId,
            revoked: false
        },
        data: {
            revoked: true
        }
    });
    const session = await getIronSession();
    session.destroy();


    // Log this critical security event
    await logSecurityAuditEntry({
        userId,
        deviceId,
        success: false,
        ipAddress: null,
        userAgent: {} as UserAgent,
        details: 'All user sessions invalidated due to refresh token reuse attack',
        action: 'REFRESH_ACCESS_TOKEN',
    });
};
