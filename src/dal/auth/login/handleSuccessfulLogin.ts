import { AuthenticationException } from "@/errors/Authentication";
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { Prisma } from "@prisma/client";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { UserLoginData } from ".";
import { AuthConfig, calculateSessionLifetime, DeviceIdsCookie, DeviceIdsCookieAccount, logSecurityAuditEntry, RiskLevel, UserAgent } from "../helper";
import { issueNewAccessToken, issueNewRefreshToken } from "../helper.tokens";
import { LogDebugLevel } from "../LogDebugLeve.enum";

// ############## POST AUTHENTICATION ##################
type HandleSuccessfulLoginProps = {
    userLoginData: UserLoginData;
    cookieList: ReadonlyRequestCookies;
    accountCookie: DeviceIdsCookie | null;
    mfaMethod: null | "email" | "totp";
}
export const handleSuccessfulLogin = async (props: HandleSuccessfulLoginProps): Promise<void> => {
    const { userLoginData, cookieList, accountCookie, mfaMethod } = props;
    const { user, organisationId, ipAddress, agent, fingerprint } = userLoginData;
    let { account } = userLoginData;

    // Register new device if it does not exists
    account = await handleDeviceUsage({
        account,
        accountCookie,
        organisationId: organisationId,
        userAgent: agent,
        ipAddress,
        userId: user.id,
        cookieList: cookieList,
        riskLevel: fingerprint.riskLevel,
        mfaUsed: !!mfaMethod
    });

    const sessionEOL = calculateSessionLifetime({
        isNewDevice: account.deviceId === userLoginData.account?.deviceId,
        lastPWValidation: new Date(),
        mfa: mfaMethod ? {
            lastValidation: new Date(),
            type: mfaMethod,
        } : undefined,
        fingerprintRisk: fingerprint.riskLevel,
        userRole: user.role,
    });

    if (!sessionEOL) {
        throw new AuthenticationException(
            "Session lifetime could not be determined, password re-authentication required",
            "AuthenticationFailed",
            LogDebugLevel.WARNING,
            userLoginData
        );
    }

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
        endOfLife: sessionEOL,
        logData: userLoginData,
        mode: "new",
    });
    await issueNewAccessToken({ session, user, organisation: userLoginData.organisation });
    await logSecurityAuditEntry({
        userId: user.id,
        organisationId: organisationId,
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
        lastMFAAt: mfaUsed ? new Date() : null,
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
