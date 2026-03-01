import { AuthenticationException } from "@/errors/Authentication";
import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { Prisma, Session } from "@prisma/client";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { UserLoginData } from ".";
import { calculateSessionLifetime, DeviceIdsCookie, DeviceIdsCookieAccount, logSecurityAuditEntry, RiskLevel, UserAgent } from "../helper";
import { AuthConfig } from "../config";
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

    // Register new device if it does not exists
    const [account, dbSession] = await handleDeviceUsage({
        account: userLoginData.account,
        accountCookie,
        organisationId: organisationId,
        userAgent: agent,
        ipAddress,
        userId: user.id,
        cookieList: cookieList,
        riskLevel: fingerprint.riskLevel,
        mfaMethod,
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

    const ironSession = await getIronSession();

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
        sessionId: dbSession.id,
        ipAddress,
        endOfLife: sessionEOL,
        logData: userLoginData,
        mode: "new",
    });
    await issueNewAccessToken({
        ironSession,
        user,
        organisation: userLoginData.organisation,
        sessionId: dbSession.id
    });
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
    mfaMethod: null | "email" | "totp";
    riskLevel: RiskLevel;
}
/**
 * Creates or updates a device usage entry and updates the auth cookie accordingly.
 * @param props 
 * @returns The current device account information.
 */
const handleDeviceUsage = async (props: HandleDeviceUsageProps): Promise<[DeviceIdsCookieAccount, Session]> => {
    const { accountCookie, organisationId, userAgent, ipAddress, userId, cookieList, mfaMethod, riskLevel } = props;
    let { account } = props;

    // ##### UPDATE OR CREATE DEVICE ENTRY #####
    const updateData = {
        lastIpAddress: ipAddress,
        lastUsedAt: new Date(),
        userAgent: JSON.stringify(userAgent),
        lastMFAAt: mfaMethod ? new Date() : undefined,
        lastUsedMFAType: mfaMethod ? (mfaMethod === "totp" ? "totp" : "email") : undefined,
    } satisfies Prisma.DeviceUpdateInput
    const dbDevice = await prisma.device.upsert({
        where: {
            id: account?.deviceId ?? "unknown-device-id",
            valid: true,
        },
        update: updateData,
        create: {
            ...updateData,
            userId: userId,
            name: `${userAgent.os.name} ${userAgent.os.version} - ${userAgent.browser.name}`,
        }
    });
    const isNewDevice = !account || account.deviceId !== dbDevice.id;

    // ##### VALIDATE ACTIVE SESSION #####
    const activeSession = isNewDevice ? null : await prisma.session.findFirst({
        where: {
            deviceId: dbDevice.id,
            valid: true,
            refreshTokens: {
                some: {
                    status: "active",
                    issuedAt: {
                        gte: dayjs().subtract(AuthConfig.inactiveCutoff, "minutes").toDate()
                    }
                }
            }
        }
    });
    let session;
    if (activeSession) {
        session = await prisma.session.update({
            where: { id: activeSession.id },
            data: {
                userAgent: JSON.stringify(userAgent),
                lastLoginAt: new Date(),
                sessionRL: String(riskLevel),
                lastIpAddress: ipAddress,
            }
        });
    } else {
        session = await prisma.session.create({
            data: {
                deviceId: dbDevice.id,
                valid: true,
                userAgent: JSON.stringify(userAgent),
                lastLoginAt: new Date(),
                sessionRL: isNewDevice ? "newDevice" : String(riskLevel),
                lastIpAddress: ipAddress,
            }
        })
    }

    // ##### UPDATE AUTH COOKIE #####
    account = {
        deviceId: dbDevice.id,
        organisationId: organisationId,
        lastUsedAt: new Date().toISOString(),
    }

    if (accountCookie?.lastUsed.organisationId === organisationId) {
        cookieList.set(AuthConfig.deviceCookie, JSON.stringify({
            lastUsed: {
                ...account,
                lastUsedAt: new Date().toISOString(),
            },
            otherAccounts: accountCookie.otherAccounts,
        }), { httpOnly: true, secure: true, path: '/', sameSite: 'strict' });
    } else {
        const otherAccounts = accountCookie ? accountCookie.otherAccounts.filter(x => x.organisationId !== organisationId) : [];
        cookieList.set(AuthConfig.deviceCookie, JSON.stringify({
            lastUsed: {
                ...account,
                lastUsedAt: new Date().toISOString(),
            },
            otherAccounts: otherAccounts,
        }), { httpOnly: true, secure: true, path: '/', sameSite: 'strict' });
    }

    return [account, session];
}
