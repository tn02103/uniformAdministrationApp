import { prisma } from "@/lib/db";
import { User, Organisation, Prisma } from "@prisma/client";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { UserAgent, DeviceIdsCookieAccount, DeviceIdsCookie, calculateSessionLifetime, issueNewRefreshToken, issueNewAccessToken, logSecurityAuditEntry, RiskLevel, AuthConfig, FingerprintValidationResult } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { getIronSession } from "@/lib/ironSession";
import dayjs from "@/lib/dayjs";

// ############## POST AUTHENTICATION ##################
type HandleSuccessfulLoginProps = {
    user: User;
    organisation: Organisation;
    ipAddress: string;
    agent: UserAgent;
    cookieList: ReadonlyRequestCookies;
    account: DeviceIdsCookieAccount | null;
    accountCookie: DeviceIdsCookie | null;
    mfaMethod: null | "email" | "totp";
    fingerprint: FingerprintValidationResult;
}
export const handleSuccessfulLogin = async (props: HandleSuccessfulLoginProps): Promise<void> => {
    const { user, organisation, ipAddress, agent, cookieList, accountCookie, mfaMethod, fingerprint } = props;
    let { account } = props;
    
    // Register new device if it does not exists
    account = await handleDeviceUsage({
        account,
        accountCookie,
        organisationId: organisation.id,
        userAgent: agent,
        ipAddress,
        userId: user.id,
        cookieList: cookieList,
        riskLevel: fingerprint.riskLevel,
        mfaUsed: !!mfaMethod
    });

    const lifetime = calculateSessionLifetime({
        isNewDevice: account.deviceId === props.account?.deviceId,
        lastPWValidation: new Date(),
        mfa: mfaMethod ? {
            lastValidation: new Date(),
            method: mfaMethod,
        } : undefined,
        fingerprintRisk: fingerprint.riskLevel,
        userRole: user.role,
    });
    
    const sessionEOL = dayjs().add(
        Math.max(lifetime * 24, 4),
        "hours"
    );
    const session = await getIronSession();
    
    await prisma.user.update({
        where: { id: user.id },
        data: {
            lastLoginAt: new Date(),
            failedLoginCount: 0,
        }
    });

    await issueNewRefreshToken({
        cookieList,
        userId: user.id,
        deviceId: account.deviceId,
        ipAddress,
        endOfLife: sessionEOL.toDate()
    });
    await issueNewAccessToken({ session, user, organisation });
    await logSecurityAuditEntry({
        userId: user.id,
        organisationId: organisation.id,
        success: true,
        ipAddress,
        userAgent: agent,
        details: "Successful login",
        action: "LOGIN_ATTEMPT",
        deviceId: account.deviceId,
        debugLevel: LogDebugLevel.SUCCESS,
    });
};

type HandleDeviceUsageProps = {
    accountCookie: DeviceIdsCookie | null;
    account: DeviceIdsCookieAccount | null;
    organisationId: string;
    userAgent: UserAgent;
    ipAddress: string;
    userId: string;
    cookieList: ReadonlyRequestCookies;
    mfaUsed: boolean;
    riskLevel: RiskLevel;
}
/**
 * Creates or updates a device usage entry and updates the auth cookie accordingly.
 * @param props 
 * @returns The current device account information.
 */
const handleDeviceUsage = async (props: HandleDeviceUsageProps): Promise<DeviceIdsCookieAccount> => {
    const { accountCookie, organisationId, userAgent, ipAddress, userId, cookieList, mfaUsed, riskLevel } = props;
    let { account } = props;

    const updateData = {
        lastIpAddress: ipAddress,
        userAgent: JSON.stringify(userAgent),
        lastUsedAt: new Date(),
        lastLoginAt: new Date(),
        last2FAAt: mfaUsed ? new Date() : null,
        sessionRL: String(riskLevel),
    } satisfies Prisma.DeviceUpdateInput
    const dbDevice = await prisma.device.upsert({
        where: {
            id: account?.deviceId,
            valid: true,
        },
        update: updateData,
        create: {
            ...updateData,
            sessionRL: "newDevice",
            userId: userId,
            name: `${userAgent.os.name} ${userAgent.os.version} - ${userAgent.browser.name}`,
        }
    });
    account = {
        deviceId: dbDevice.id,
        organisationId: organisationId,
        lastUsedAt: new Date().toISOString(),
    }

    if (accountCookie?.lastUsed.organisationId === organisationId) {
        cookieList.set(AuthConfig.deviceCookie, JSON.stringify({
            lastUsed: {
                ...account,
                lastUsedAt: new Date(),
            },
            otherAccounts: accountCookie.otherAccounts,
        }), { httpOnly: true, secure: true, path: '/', sameSite: 'strict' });
    } else {
        const otherAccounts = accountCookie ? accountCookie.otherAccounts.filter(x => x.organisationId !== organisationId) : [];
        cookieList.set(AuthConfig.deviceCookie, JSON.stringify({
            lastUsed: {
                ...account,
                lastUsedAt: new Date(),
            },
            otherAccounts: otherAccounts,
        }), { httpOnly: true, secure: true, path: '/', sameSite: 'strict' });
    }

    return account;
}
