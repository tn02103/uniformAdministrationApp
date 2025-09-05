import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/db";
import { Device, Organisation, User } from "@prisma/client";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { userAgent } from "next/server";
import z from "zod";
import crypto from 'crypto';
import { IronSession } from "@/lib/ironSession";
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
}

export const getIPAddress = (headers: ReadonlyHeaders) => {
    return headers.get('true-client-ip') ?? headers.get('x-forwarded-for') ?? "Unknown IP";
}



type LogLoginAttemptData = {
    action: "LOGIN_ATTEMPT" | "REFRESH_ACCESS_TOKEN";
    userId?: string;
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
export const logAuthenticationAttempt = async (data: LogLoginAttemptData) => {
    const { userId, organisationId, success, ipAddress, details, action } = data;
    const userAgent = JSON.stringify(data.userAgent);

    await prisma.auditLog.create({
        data: {
            userId,
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
    usedRefreshToken?: string;
    deviceId: string;
    ipAddress: string;
    endOfLife?: Date;
}
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
        endOfLife = dayjs().add(3, "days").toDate()
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
            data: { usedAt: new Date() }
        });
    }

    // Invalidate existing refreshTokens
    prisma.refreshToken.updateMany({
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
            ipAddress,
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
    device: Device,
    deviceCookie: DeviceIdsCookieAccount,
    currentIP: string,
    currentUA: UserAgent
): Promise<DeviceValidationResult> => {
    const reasons: string[] = [];
    let riskLevel: DeviceValidationResult["riskLevel"] = 'LOW';

    // 1. CRITICAL: Device ID must match
    if (device.id !== deviceCookie.deviceId) {
        return {
            riskLevel: 'SEVERE',
            reasons: ['Device ID mismatch']
        };
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

    // 4. IP Address check (informational)
    if (ipAddress !== currentIP) {
        reasons.push('IP address changed');
        // Mobile users change IPs frequently - don't elevate risk
    }

    return { riskLevel, reasons };
}