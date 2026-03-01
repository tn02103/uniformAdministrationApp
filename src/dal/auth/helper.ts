import { AuthenticationExceptionData } from "@/errors/Authentication";
import { AuthRole } from "@/lib/AuthRoles";
import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { MFAType } from "@prisma/client";
import { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { userAgent } from "next/server";
import z from "zod";
import { __unsecuredVerifyTwoFactorCode } from "./2fa/verify";
import { verifyEmailCode } from "./email/verifyCode";
import { LogDebugLevel } from "./LogDebugLeve.enum";
import { AuthConfig } from "./config";


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

export const getIPAddress = (headers: ReadonlyHeaders) => {
    return headers.get('true-client-ip') ?? headers.get('x-forwarded-for') ?? "Unknown IP";
}

type LogSecurityAuditEntryData = {
    action: "LOGIN_ATTEMPT" | "REFRESH_ACCESS_TOKEN" | "LOGOUT" | "CREATE_2FA_APP"
    | "VERIFY_2FA_APP" | "REMOVE_2FA_APP" | "SEND_EMAIL_CODE" | "VERIFY_EMAIL_CODE";
    debugLevel: LogDebugLevel;
    userId?: string;
    deviceId?: string;
    organisationId?: string;
    success: boolean;
    ipAddress: string;
    userAgent: UserAgent;
    details: string;
}

/**
* Logs a login attempt to the audit log.
* @param data 
*/
export const logSecurityAuditEntry = async (data: LogSecurityAuditEntryData) => {
    const { userId, organisationId, success, ipAddress, details, action, deviceId, debugLevel } = data;
    const userAgent = JSON.stringify(data.userAgent);

    await prisma.auditLog.create({
        data: {
            debugLevel: debugLevel.valueOf(),
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

export const calculateSessionLifetime = (context: {
    isNewDevice: boolean;
    fingerprintRisk: RiskLevel;
    mfa?: {
        lastValidation: Date;
        type: MFAType;
    }
    lastPWValidation: Date;
    userRole: AuthRole;
}): Date | null => {
    // Base lifetime in days
    let baseDays = AuthConfig.sessionAgesInDays.no2FA; // Conservative default

    // Authentication method bonus
    if (context.mfa?.type === MFAType.totp) {
        baseDays = AuthConfig.sessionAgesInDays.totp2FA;
    } else if (context.mfa?.type === 'email') {
        baseDays = AuthConfig.sessionAgesInDays.email2FA;
    }

    // Device trust penalty
    if (context.isNewDevice) {
        baseDays = Math.min(baseDays, AuthConfig.sessionAgesInDays.newDevice);
    }

    // Risk-based reduction
    const riskMultipliers = {
        [RiskLevel.LOW]: 1.0,
        [RiskLevel.MEDIUM]: 0.7,
        [RiskLevel.HIGH]: 0.3,
        [RiskLevel.SEVERE]: 0 // Force re-auth
    };

    baseDays *= riskMultipliers[context.fingerprintRisk];

    // Admin users get shorter sessions for security
    if (context.userRole >= AuthRole.admin) {
        baseDays *= 0.7;
    }

    // Hard limits based on last authentication
    const daysSincePasswordAuth = dayjs().diff(context.lastPWValidation, 'days');

    if (daysSincePasswordAuth >= AuthConfig.sessionAgesInDays.requirePasswordReauth) {
        baseDays = 0; // Force password re-authentication
    }
    if (baseDays === 0) {
        return null;
    }
    if (baseDays * 24 < 8) {
        baseDays = 8 / 24; // Minimum 8 hours
    }

    return dayjs(context.lastPWValidation).add(baseDays * 24, 'hours').toDate();
};


export type GetAccountProps = {
    cookieList: ReadonlyRequestCookies;
    organisationId?: string;
}
export type GetDeviceAccountFromCookiesReturn = {
    account: DeviceIdsCookieAccount | null;
    accountCookie: DeviceIdsCookie | null;
}
/**
 * Gets device accounts from cookies. If organisationId is provided it will return the account for that organisation.
 * @param param0 
 * @returns 
 */
export const getDeviceAccountFromCookies = ({ cookieList, organisationId }: GetAccountProps): GetDeviceAccountFromCookiesReturn => {
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

export enum RiskLevel {
    "LOW" = 0,
    "MEDIUM" = 1,
    "HIGH" = 2,
    "SEVERE" = 3,
}
export type FingerprintValidationResult = {
    riskLevel: RiskLevel,
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
export const validateDeviceFingerprint = async ({ current, expected }: {
    current: {
        ipAddress: string;
        userAgent: UserAgent;
        deviceId: string;
    };
    expected: {
        ipAddress: string;
        userAgent: string;
        deviceId: string;
    };
}): Promise<FingerprintValidationResult> => {
    const reasons: string[] = [];
    let riskLevel: FingerprintValidationResult["riskLevel"] = RiskLevel.LOW;

    // 1. CRITICAL: Device ID must match
    if (expected.deviceId !== current.deviceId) {
        return {
            riskLevel: RiskLevel.SEVERE,
            reasons: ['Device ID mismatch']
        };
    }

    // 4. IP Address check (informational)
    if (expected.ipAddress !== current.ipAddress) {
        reasons.push('IP address changed');
        // Mobile users change IPs frequently - don't elevate risk
    }

    // 2. Parse stored user agent
    let storedUA;
    try {
        storedUA = JSON.parse(expected.userAgent);
    } catch {
        return {
            riskLevel: RiskLevel.SEVERE,
            reasons: ['Invalid stored user agent']
        };
    }

    // 3. User Agent validation
    // Critical properties that shouldn't change
    if (storedUA.os?.name !== current.userAgent.os?.name) {
        reasons.push('OS name changed');
        riskLevel = RiskLevel.SEVERE;
    } else if (storedUA.os?.version !== current.userAgent.os?.version) {
        reasons.push('OS version updated');
        riskLevel = RiskLevel.HIGH;
    }

    if (storedUA.device?.type !== current.userAgent.device?.type) {
        reasons.push('Device type changed');
        riskLevel = RiskLevel.SEVERE;
    }

    if (storedUA.browser?.name !== current.userAgent.browser?.name) {
        reasons.push('Browser name changed');
        riskLevel = RiskLevel.SEVERE;
    } else if (storedUA.browser?.version !== current.userAgent.browser?.version) {
        reasons.push('Browser version updated');
        if (riskLevel === RiskLevel.LOW) riskLevel = RiskLevel.MEDIUM;
    }

    return { riskLevel, reasons };
}

export const getUserMFAConfig = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            organisation: {
                include: {
                    organisationConfiguration: true,
                }
            }
        }
    });
    if (!user) throw new Error('User not found');
    const method = user.default2FAMethod ?? "email";
    if (user.twoFAEnabled)
        return { enabled: true, method };


    if (user.organisation.organisationConfiguration) {
        const config = user.organisation.organisationConfiguration;
        if (config.twoFactorAuthRule === 'required') {
            return { enabled: true, method };
        }
        if (config.twoFactorAuthRule === 'administrators' && user.role >= AuthRole.admin) {
            return { enabled: true, method };
        }
    }
    return { enabled: false, methdo: null };
};

export const verifyMFAToken = async (token: string, userId: string, appId: string, organisationId: string, logData: AuthenticationExceptionData): Promise<void> => {
    if (appId === "email") {
        return verifyEmailCode(organisationId, userId, token);
    }
    return __unsecuredVerifyTwoFactorCode(organisationId, userId, token, appId, logData);
}
