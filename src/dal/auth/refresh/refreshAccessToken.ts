"use server";

import { AuthenticationException, AuthenticationExceptionData } from "@/errors/Authentication";
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import { cookies, headers } from "next/headers";
import { userAgent } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { AuthConfig } from "../config";
import { calculateSessionLifetime, getDeviceAccountFromCookies, getIPAddress, logSecurityAuditEntry, type UserAgent } from "../helper";
import { issueNewAccessToken, issueNewRefreshToken, sha256Hex } from "../helper.tokens";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { verifyRefreshToken } from "./verifyRefreshToken";
import { releaseLock, storeCachedResult, tryAcquireLockWithPolling, type CachedRefreshData } from "./idempotency.redis";

type RefreshResponse = {
    status: number;
    message: string;
}

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
    const headerList = await headers();
    const cookieList = await cookies();
    const userAgentStructure = { headers: headerList };
    const agent: UserAgent = userAgent(userAgentStructure);
    const ipAddress = getIPAddress(headerList);
    const refreshTokenCookie = cookieList.get(AuthConfig.refreshTokenCookie);
    const { accountCookie } = getDeviceAccountFromCookies({ cookieList });
    const account = accountCookie?.lastUsed;
    const idempotencyKey = headerList.get('x-idempotency-key');

    if (!ipAddress) {
        console.warn("RefreshAccessToken: IP Address is required and was not provided");
        return { status: 400, message: "IP Address is required" };
    }

    // ===== REDIS LOCK ACQUISITION WITH POLLING =====
    let lockAcquired = false;
    if (idempotencyKey) {
        const lockResult = await tryAcquireLockWithPolling(
            idempotencyKey,
            ipAddress,
            agent,
            refreshTokenCookie?.value,
            cookieList
        );

        if (!lockResult.lockAcquired) {
            // Another request processed this, return cached response
            return lockResult.cachedResponse;
        }

        // Lock acquired successfully
        lockAcquired = true;
        console.debug('Lock acquired, processing token refresh');
    }

    try {
        // ===== EXISTING VALIDATION LOGIC =====

        const limit = await ipLimiter.get(ipAddress);
        if (limit && limit.remainingPoints <= 0) {
            console.warn("IP temporarily blocked due to too many failed login attempts", ipAddress);
            return { status: 429, message: "Too many requests. Try again later." };
        }
        const logData: AuthenticationExceptionData = {
            ipAddress,
            userAgent: agent,
            organisationId: account?.organisationId,
            deviceId: account?.deviceId,
        }

        // ##### Get Refresh Token from Cookie####
        if (!refreshTokenCookie) {
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
            sendToken: refreshTokenCookie.value,
            cookieList,
            account,
            logData,
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
            // INACTIVE SESSION: EOL needs to be at least 2 hours, 
            // otherwise reauth required so it does not happen in the middle of the session
            if (dayjs().add(AuthConfig.inactiveRefreshMinAge, "minutes").isAfter(endOfLife)) {
                throw new AuthenticationException(
                    `Inactive Session: EOL is under ${AuthConfig.inactiveRefreshMinAge} minutes away. Reauth required`,
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
        
        const newRefreshToken = await issueNewRefreshToken({
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

        const response: RefreshResponse = {
            status: 200,
            message: "Tokens refreshed successfully"
        };

        // ===== STORE METADATA WITH RESPONSE =====
        if (idempotencyKey && lockAcquired) {
            const cacheData: CachedRefreshData = {
                response,
                metadata: {
                    ipAddress,
                    userAgent: JSON.stringify(agent),
                    oldRefreshTokenHash: sha256Hex(refreshTokenCookie.value),
                    cookieExpiry: endOfLife,
                    newRefreshTokenPlaintext: newRefreshToken,
                }
            };

            await storeCachedResult(idempotencyKey, cacheData);
            await releaseLock(idempotencyKey);
        }

        return response;
    } catch (error) {
        // ===== RELEASE LOCK ON ERROR =====
        if (idempotencyKey && lockAcquired) {
            await releaseLock(idempotencyKey);
            console.debug('Released lock after error');
        }
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

            switch (error.exceptionType) {
                case "AuthenticationFailed":
                    return {
                        status: 401,
                        message: "Authentication failed"
                    };
                default:
                    return {
                        status: 500,
                        message: "An unknown error occurred"
                    };
            }
        } else {
            console.error("Error refreshing access token:", error);
            return { status: 500, message: "Unknown error occurred" };
        }
    };
};

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