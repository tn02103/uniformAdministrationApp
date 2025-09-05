/* eslint-disable no-console */
import { cookies, headers } from "next/headers";
import { userAgent } from "next/server";
import { AuthConfig, getDeviceAccountFromCookies, getIPAddress, issueNewAccessToken, issueNewRefreshToken, logAuthenticationAttempt, validateDeviceFingerprint, type UserAgent } from "./helper";
import { prisma } from "@/lib/db";
import { isValid } from "date-fns";
import dayjs from "dayjs";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { Device, RefreshToken, User } from "@prisma/client";
import { getIronSession } from "@/lib/ironSession";

type RefreshResponse = {
    success: false;
    exceptionType: "AuthenticationFailed" | "UnknownError";
} | { success: true };

export const refreshToken = async (): Promise<RefreshResponse> => {
    try {
        // Logic to refresh the access token
        const headerList = await headers();
        const cookieList = await cookies();

        const userAgentStructure = { headers: headerList }
        const agent: UserAgent = userAgent(userAgentStructure);
        const ipAddress = getIPAddress(headerList);
        const refreshToken = cookieList.get(AuthConfig.refreshTokenCookie);

        console.log("🚀 ~ refreshAccessToken ~ agent:", agent)
        console.log("🚀 ~ refreshAccessToken ~ ipAddress:", ipAddress)
        console.log("🚀 ~ refreshAccessToken ~ refreshToken:", refreshToken)

        // ##### Get Refresh Token from Cookie####
        if (!ipAddress)
            throw new Error("IP Address is required");

        if (!refreshToken) {
            console.log("🚀 ~ refreshAccessToken ~ FAILURE ~ no refreshToken:")
            logAuthenticationAttempt({
                success: false,
                ipAddress,
                details: "Refresh token cookie is missing",
                action: "REFRESH_ACCESS_TOKEN",
                userAgent: agent,
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
            console.log("🚀 ~ refreshToken ~ FAILURE ~  no dbToken:", dbToken)
            logAuthenticationAttempt({
                success: false,
                ipAddress,
                details: "Refresh token not found in database",
                action: "REFRESH_ACCESS_TOKEN",
                userAgent: agent,
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
        });
        if (!verificationResult.isValid) {
            console.log("🚀 ~ refreshToken ~ FAILURE ~  verificationResult invalid:", verificationResult)
            logAuthenticationAttempt({
                userId: dbToken.userId,
                organisationId: dbToken.user.organisationId,
                success: false,
                ipAddress,
                details: verificationResult.reasons.join(", "),
                action: "REFRESH_ACCESS_TOKEN",
                userAgent: agent,
            });
            return {
                success: false,
                exceptionType: "AuthenticationFailed",
            }
        }

        // ##### ISSUE NEW TOKENS ####
        logAuthenticationAttempt({
            userId: dbToken.userId,
            organisationId: dbToken.user.organisationId,
            success: true,
            ipAddress,
            details: "Refresh token valid",
            action: "REFRESH_ACCESS_TOKEN",
            userAgent: agent,
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
            endOfLife: endOfLifeRefresh
        });
        await issueNewAccessToken({
            session: await getIronSession(),
            user: dbToken.user,
            organisation: dbToken.user.organisation,
        });

        console.log("🚀 ~ refreshToken ~ SUCCESS:")
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
    device: Device;
}
type VerivicationsResult = {
    isValid: boolean;
    reasons: string[];
}
const verifications = async (props: verificationsProp): Promise<VerivicationsResult> => {
    const { agent, ipAddress, cookieList, dbToken, user, device } = props;
    const criticalReasons: string[] = [];

    if (dbToken.revoked) {
        criticalReasons.push("RefreshToken has been revoked");
    }
    if (dbToken.usedAt) {
        criticalReasons.push("RefreshToken has been used");
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
        criticalReasons.push("User has to change. No refresh Possible");
    }

    // ##### VALIDATE DEVICE FROM DB ####
    const { accountCookie } = getDeviceAccountFromCookies({ cookieList });
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
        const fingerprintValidation = await validateDeviceFingerprint(
            ipAddress,
            device,
            accountCookie?.lastUsed,
            ipAddress,
            agent
        );
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
        isValid: true,
        reasons: [],
    }
}
