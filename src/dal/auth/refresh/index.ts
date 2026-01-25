"use server";

import { AuthenticationException, AuthenticationExceptionData } from "@/errors/Authentication";
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import dayjs from "dayjs";
import { cookies, headers } from "next/headers";
import { userAgent } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { calculateSessionLifetime, getDeviceAccountFromCookies, getIPAddress, logSecurityAuditEntry, type UserAgent } from "../helper";
import { AuthConfig } from "../config";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { verifyRefreshToken } from "./verifyRefreshToken";
import { issueNewRefreshToken, issueNewAccessToken } from "../helper.tokens";
import { Prisma } from "@prisma/client";

type RefreshResponse = {
    success: false;
    exceptionType: ExceptionType;
} | { success: true };
type ExceptionType = "AuthenticationFailed" | "TwoFactorRequired" | "UnknownError";

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

        if (!ipAddress) {
            console.warn("RefreshAccessToken: IP Address is required and was not provided");
            return { success: false, exceptionType: "UnknownError" };
        }

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

        if (!account) {
            await consumeIpLimiter(ipAddress, 2, agent);
            throw new AuthenticationException("Account from AccountCookie is missing", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
        }

        const dbToken = await prisma.refreshToken.findFirst({
            where: {
                deviceId: account.deviceId,
                status: "active",
            },
            ...dbTokenInclude,
        });
        if (!dbToken) {
            await consumeIpLimiter(ipAddress, 5, agent, account?.deviceId);
            throw new AuthenticationException("Refresh token not found in database", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
        }

        // ##### AUTHORIZE User ####
        const fingerprintValidation = await verifyRefreshToken({
            dbToken,
            agent,
            ipAddress: ipAddress ?? "unknown",
            sendToken: refreshToken.value,
            cookieList,
            account,
            logData
        }).catch(async (e) => {
            await consumeIpLimiter(ipAddress, 1, agent);
            throw e;
        });

        // ##### CALCULATE SESSION LIFETIME ####
        const { session, device } = dbToken;
        const endOfLife = calculateSessionLifetime({
            lastPWValidation: session.lastLoginAt,
            mfa: (device.lastMFAAt && device.lastUsedMFAType) ? {
                lastValidation: device.lastMFAAt,
                type: device.lastUsedMFAType,
            } : undefined,
            fingerprintRisk: fingerprintValidation.riskLevel,
            userRole: dbToken.user.role,
            isNewDevice: false,
        });

        if (!endOfLife) {
            throw new AuthenticationException(
                "Session lifetime could not be determined, password re-authentication required",
                "AuthenticationFailed",
                LogDebugLevel.WARNING,
                logData
            );
        }

        if (dayjs().subtract(AuthConfig.inactiveCutoff, "minutes").isAfter(dbToken.issuedAt)) {
            // INACTIVE SESSION: EOL needs to be at least 4 hours, 
            // otherwise reauth required so it does not happen in the middle of the session
            if (dayjs().add(AuthConfig.inactiveRefreshMinAge, "hours").isAfter(endOfLife)) {
                throw new AuthenticationException(
                    "Inactive Session: EOL is under 4 hours away. Reauth required",
                    "AuthenticationFailed",
                    LogDebugLevel.INFO,
                    logData,
                );
            }
        }

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
        await issueNewRefreshToken({
            cookieList,
            userId: dbToken.userId,
            usedRefreshTokenId: dbToken.id,
            deviceId: dbToken.deviceId,
            ipAddress,
            endOfLife: endOfLife,
            userAgent: agent,
            logData,
            mode: "refresh",
            sessionId: dbToken.sessionId,
        });
        await issueNewAccessToken({
            ironSession: await getIronSession(),
            user: dbToken.user,
            organisation: dbToken.user.organisation,
            sessionId: dbToken.sessionId,
        });

        return {
            success: true
        };
    } catch (error) {
        if (error instanceof AuthenticationException) {
            await logSecurityAuditEntry({
                ...error.data,
                success: false,
                debugLevel: error.debugLevel,
                action: "REFRESH_ACCESS_TOKEN",
                details: error.message,
            });

            if (error.exceptionType === "AuthenticationFailed") {
                const session = await getIronSession();
                session.destroy();
            } else if (error.exceptionType === "RefreshTokenReuseDetected") {
                if (error.debugLevel === LogDebugLevel.CRITICAL) {
                    const session = await getIronSession();
                    session.destroy();
                }
            }

            return {
                success: false,
                exceptionType: getRefreshResponseExceptionType(error.exceptionType),
            }
        } else {
            console.error("Error refreshing access token:", error);
            return { success: false, exceptionType: "UnknownError" };
        }
    };
};

const getRefreshResponseExceptionType = (type: AuthenticationException["exceptionType"]): ExceptionType => {
    switch (type) {
        case "UnknownError":
            return "UnknownError";
        case "TwoFactorRequired":
            return "TwoFactorRequired";
        default:
            return "AuthenticationFailed";
    }
}

const dbTokenInclude = {
    include: {
        user: {
            include: {
                organisation: true
            }
        },
        device: true,
        session: true,
    },
} satisfies Prisma.RefreshTokenFindFirstArgs;
export type DBRefreshToken = Prisma.RefreshTokenGetPayload<typeof dbTokenInclude>;