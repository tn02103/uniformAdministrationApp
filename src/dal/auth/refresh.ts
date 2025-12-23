import { cookies, headers } from "next/headers";
import { userAgent } from "next/server";
import { AuthConfig, DeviceIdsCookie, getDeviceAccountFromCookies, getIPAddress, handleRefreshTokenReuse, invalidateAllUserSessions, issueNewAccessToken, issueNewRefreshToken, logSecurityAuditEntry, validateDeviceFingerprint, type UserAgent } from "./helper";
import { prisma } from "@/lib/db";
import { isValid } from "date-fns";
import dayjs from "dayjs";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { Device, RefreshToken, User } from "@prisma/client";
import { getIronSession } from "@/lib/ironSession";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { LogDebugLevel } from "./LogDebugLeve.enum";
import { AuthenticationException, AuthenticationExceptionData } from "@/errors/Authentication";

type RefreshResponse = {
    success: false;
    exceptionType: "AuthenticationFailed" | "UnknownError";
} | { success: true };

const ipLimiter = new RateLimiterMemory({
    points: 15, // 15 failed attempts allowed
    duration: 60 * 15, // reset after 15 minutes
});

const consumeIpLimiter = async (ipAddress: string, points: number, userAgent: UserAgent, deviceId?: string) => {
    return ipLimiter.consume(ipAddress, points)
        .then((limit) => {
            if (limit.remainingPoints <= 0) {
                logSecurityAuditEntry({
                    success: false,
                    ipAddress,
                    details: "IP temporarily blocked due to too many failed login attempts",
                    action: "REFRESH_ACCESS_TOKEN",
                    userAgent,
                    deviceId,
                    debugLevel: LogDebugLevel.CRITICAL
                });
            }
        }).catch(() =>
            logSecurityAuditEntry({
                ipAddress,
                success: false,
                details: "IP temporarily blocked due to too many failed login attempts",
                action: "REFRESH_ACCESS_TOKEN",
                userAgent,
                deviceId,
                debugLevel: LogDebugLevel.CRITICAL
            })
        );
}


export const refreshToken = async (): Promise<RefreshResponse> => {
    try {
        // Logic to refresh the access token
        const headerList = await headers();
        const cookieList = await cookies();

        const userAgentStructure = { headers: headerList }
        const agent: UserAgent = userAgent(userAgentStructure);
        const ipAddress = getIPAddress(headerList);
        const refreshToken = cookieList.get(AuthConfig.refreshTokenCookie);
        const { accountCookie } = getDeviceAccountFromCookies({ cookieList });
        const account = accountCookie?.lastUsed;

        if (!ipAddress)
            throw new Error("IP Address is required");

        const limit = await ipLimiter.get(ipAddress);
        if (limit && limit.remainingPoints <= 0) {
            console.warn("IP temporarily blocked due to too many failed login attempts", ipAddress);
            return { success: false, exceptionType: "AuthenticationFailed" };
        }
        const logData: AuthenticationExceptionData = {
            ipAddress,
            userAgent: agent,
            organisationId: account?.organisationId,
            deviceId: account?.deviceId,
        }

        // ##### Get Refresh Token from Cookie####
        if (!refreshToken) {
            await consumeIpLimiter(ipAddress, 2, agent, account?.deviceId);
            throw new AuthenticationException("Refresh token cookie is missing", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
        }
        const dbToken = await prisma.refreshToken.findUnique({
            where: {
                token: refreshToken.value
            },
            include: {
                user: {
                    include: {
                        organisation: true
                    }
                },
                device: true,
            },
        });
        if (!dbToken) {
            await consumeIpLimiter(ipAddress, 5, agent, account?.deviceId);
            throw new AuthenticationException("Refresh token not found in database", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
        }

        // ##### AUTHORIZE User ####
        await verifyRefreshToken({
            agent,
            ipAddress: ipAddress ?? "unknown",
            dbToken,
            user: dbToken.user,
            device: dbToken.device,
            cookieList,
            accountCookie,
            logData
        }).catch(async (e) => {
            await consumeIpLimiter(ipAddress, 1, agent);
            throw e;
        });

        // ##### ISSUE NEW TOKENS ####
        logSecurityAuditEntry({
            userId: dbToken.userId,
            organisationId: dbToken.user.organisationId,
            success: true,
            ipAddress,
            details: "Refresh token valid",
            action: "REFRESH_ACCESS_TOKEN",
            userAgent: agent,
            deviceId: account?.deviceId,
            debugLevel: LogDebugLevel.SUCCESS,
        });

        const maxSession = dayjs(dbToken.device.lastLoginAt).add(Number(AuthConfig.maxSessionAgeDays), "days");
        const maxRefresh = dayjs(dbToken.device.lastLoginAt).add(Number(AuthConfig.maxRefreshTokenAgeDays), "days");

        const endOfLifeRefresh = maxSession.isBefore(maxRefresh) ? maxSession.toDate() : maxRefresh.toDate();

        await issueNewRefreshToken({
            cookieList,
            userId: dbToken.userId,
            usedRefreshToken: dbToken.token,
            deviceId: dbToken.deviceId,
            ipAddress,
            endOfLife: endOfLifeRefresh,
            userAgent: agent,
        });
        await issueNewAccessToken({
            session: await getIronSession(),
            user: dbToken.user,
            organisation: dbToken.user.organisation,
        });

        return {
            success: true
        };
    } catch (error) {
        console.error("Error refreshing access token:", error);
        return { success: false, exceptionType: "UnknownError" };
    }
};

type verificationsProp = {
    agent: UserAgent,
    ipAddress: string;
    dbToken: RefreshToken;
    user: User;
    cookieList: ReadonlyRequestCookies;
    accountCookie?: DeviceIdsCookie | null;
    device: Device;
    logData: AuthenticationExceptionData;
}
const verifyRefreshToken = async (props: verificationsProp): Promise<void> => {
    const { agent, ipAddress, cookieList, dbToken, user, device, accountCookie, logData } = props;
    const criticalReasons: string[] = [];

    if (dbToken.revoked) {
        throw new AuthenticationException("Refresh token has been revoked", "AuthenticationFailed", LogDebugLevel.CRITICAL, logData);
    }
    if (dbToken.usedAt) {
        return handleRefreshTokenReuse(dbToken.token);
    }
    if (!isValid(dbToken.endOfLife) || dayjs().isAfter(dbToken.endOfLife)) {
        throw new AuthenticationException(
            `Refresh token has expired. The token expired ${dayjs().diff(dbToken.endOfLife, 'seconds')} seconds ago`,
            "AuthenticationFailed",
            LogDebugLevel.INFO,
            logData
        );
    }
    if (!user.active) {
        throw new AuthenticationException("User is not active", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
    }
    if (user.failedLoginCount > 5) {
        throw new AuthenticationException("User has to many failed login attempts", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
    }
    if (user.recDelete) {
        throw new AuthenticationException("User is deleted", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
    }
    if (user.changePasswordOnLogin) {
        throw new AuthenticationException("User has to change. No refresh possible", "AuthenticationFailed", LogDebugLevel.INFO, logData);
    }

    // ##### VALIDATE DEVICE FROM DB ####
    if (!accountCookie) {
        throw new AuthenticationException("Device cookie not found", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
    }
    if (!accountCookie?.lastUsed) {
        throw new AuthenticationException("No last used device in cookie", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
    }
    if (accountCookie?.lastUsed.organisationId !== user.organisationId) {
        throw new AuthenticationException(
            "Organisation ID mismatch. The last used organisation Id in the account cookie does not match the user's organisation Id",
            "AuthenticationFailed",
            LogDebugLevel.WARNING,
            logData
        );
    }

    // ##### VALIDATE FINGERPRINT ####
    if (device && accountCookie?.lastUsed) {
        const fingerprintValidation = await validateDeviceFingerprint({
            expected: {
                ipAddress: dbToken.issuerIpAddress,
                deviceId: device.id,
                userAgent: device.userAgent,
            },
            current: {
                ipAddress,
                userAgent: agent,
                deviceId: accountCookie.lastUsed.deviceId,
            }
        });

        if (fingerprintValidation.riskLevel === 'SEVERE' || fingerprintValidation.riskLevel === 'HIGH') {
            throw new AuthenticationException(
                `Device fingerprint validation failed. 
                 Risk level: ${fingerprintValidation.riskLevel}
                 Reasons: ${fingerprintValidation.reasons.join(", ")}`,
                "AuthenticationFailed",
                fingerprintValidation.riskLevel === 'SEVERE' ? LogDebugLevel.CRITICAL : LogDebugLevel.INFO,
                logData
            );
        }
    }
}

const handleRefreshTokenReuse = async (dbToken: string) => {

}
