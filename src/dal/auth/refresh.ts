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

        // ##### Get Refresh Token from Cookie####
        if (!refreshToken) {
            await consumeIpLimiter(ipAddress, 1, agent, account?.deviceId);
            logSecurityAuditEntry({
                success: false,
                ipAddress,
                details: "Refresh token cookie is missing",
                action: "REFRESH_ACCESS_TOKEN",
                userAgent: agent,
                deviceId: account?.deviceId
            });
            return {
                success: false,
                exceptionType: "AuthenticationFailed",
            }
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
            logSecurityAuditEntry({
                success: false,
                ipAddress,
                details: "Refresh token not found in database",
                action: "REFRESH_ACCESS_TOKEN",
                userAgent: agent,
                deviceId: account?.deviceId
            });
            return {
                success: false,
                exceptionType: "AuthenticationFailed",
            }
        }

        // ##### AUTHORIZE User ####
        const verificationResult = await verifications({
            agent,
            ipAddress: ipAddress ?? "unknown",
            dbToken,
            user: dbToken.user,
            device: dbToken.device,
            cookieList,
            accountCookie,
        });
        if (!verificationResult.isValid) {
            await consumeIpLimiter(ipAddress, 1, agent);
            logSecurityAuditEntry({
                userId: dbToken.userId,
                organisationId: dbToken.user.organisationId,
                success: false,
                ipAddress,
                details: verificationResult.reasons.join(", "),
                action: "REFRESH_ACCESS_TOKEN",
                userAgent: agent,
                deviceId: account?.deviceId
            });
            return {
                success: false,
                exceptionType: "AuthenticationFailed",
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
            deviceId: account?.deviceId
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
}
type VerivicationsResult = {
    isValid: boolean;
    reasons: string[];
}
const verifications = async (props: verificationsProp): Promise<VerivicationsResult> => {
    const { agent, ipAddress, cookieList, dbToken, user, device, accountCookie } = props;
    const criticalReasons: string[] = [];

    if (dbToken.revoked) {
        criticalReasons.push("RefreshToken has been revoked");
    }
    if (dbToken.usedAt) {
        // Handle refresh token reuse - this could be parallel requests or an attack
        const reuseResult = await handleRefreshTokenReuse(dbToken, {
            deviceId: device.id,
            ipAddress,
            userAgent: agent
        });

        if (reuseResult.action === 'INVALIDATE_ALL_SESSIONS') {
            // Critical security incident - invalidate all user sessions
            await invalidateAllUserSessions(user.id, device.id);
            criticalReasons.push(`SECURITY_INCIDENT: ${reuseResult.reason}`);
            cookieList.delete(AuthConfig.refreshTokenCookie);
        } else if (reuseResult.action === 'REQUIRE_REAUTH') {
            criticalReasons.push(`Suspicious token reuse: ${reuseResult.reason}`);
            cookieList.delete(AuthConfig.refreshTokenCookie);
        }

        // If ALLOW, we continue normally but still log the incident
        await logSecurityAuditEntry({
            userId: user.id,
            organisationId: user.organisationId,
            success: reuseResult.action === 'ALLOW',
            ipAddress,
            userAgent: agent,
            details: `Refresh token reuse detected: ${reuseResult.reason} (Risk: ${reuseResult.riskLevel})`,
            action: "REFRESH_ACCESS_TOKEN",
            deviceId: accountCookie?.lastUsed.deviceId
        });
    }
    if (!isValid(dbToken.endOfLife) || dayjs().isAfter(dbToken.endOfLife)) {
        criticalReasons.push(`RefreshToken has expired ${dayjs().diff(dbToken.endOfLife, 'seconds')} seconds ago`);
    }
    if (!user.active) {
        criticalReasons.push("User is not active");
    }
    if (user.failedLoginCount > 5) {
        criticalReasons.push("User has to many failed login attempts");
    }
    if (user.recDelete) {
        criticalReasons.push("User is deleted");
    }
    if (user.changePasswordOnLogin) {
        criticalReasons.push("User has to change. No refresh possible");
    }

    // ##### VALIDATE DEVICE FROM DB ####
    if (!accountCookie) {
        criticalReasons.push("Device cookie not found");
    }
    if (!accountCookie?.lastUsed) {
        criticalReasons.push("No last used device in cookie");
    }
    if (accountCookie?.lastUsed.organisationId !== user.organisationId) {
        criticalReasons.push("Organisation ID mismatch");
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
            return {
                isValid: false,
                reasons: [
                    ...criticalReasons,
                    ...fingerprintValidation.reasons
                ],
            };
        }
    }

    return {
        isValid: criticalReasons.length === 0,
        reasons: criticalReasons,
    }
}
