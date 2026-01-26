import { AuthenticationException, AuthenticationExceptionData } from "@/errors/Authentication";
import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/db";
import { sendTokenReuseDetectedEmail } from "@/lib/email/tokenReuseDetected";
import { DBRefreshToken } from "./refreshAccessToken";
import { FingerprintValidationResult, RiskLevel, UserAgent, validateDeviceFingerprint } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";

type HandleRefreshTokenReuseProps = {
    token: DBRefreshToken;
    ipAddress: string;
    agent: UserAgent;
    logData: AuthenticationExceptionData;
}
export const handleRefreshTokenReuse = async ({ token, ipAddress, agent, logData }: HandleRefreshTokenReuseProps): Promise<void> => {
    if (!token.usedAt || !token.usedIpAddress || !token.usedUserAgent) {

        throw new AuthenticationException(
            "Refresh token reuse detected but no previous usage data found",
            "AuthenticationFailed",
            LogDebugLevel.CRITICAL,
            logData
        );
    }

    const fingerprint = await validateDeviceFingerprint({
        current: {
            ipAddress: ipAddress,
            userAgent: agent,
            deviceId: token.deviceId
        },
        expected: {
            ipAddress: token.usedIpAddress,
            userAgent: token.usedUserAgent,
            deviceId: token.deviceId
        }
    });

    const risk = getReuseRisk({ fingerprint, initialTokenUse: token.usedAt });
    switch (risk) {
        case "SEVERE":
            // revoke all refresh tokens for this device
            await prisma.refreshToken.updateMany({
                where: {
                    userId: token.userId,
                    status: "active",
                },
                data: {
                    status: "revoked",
                }
            });
            await prisma.session.updateMany({
                where: {
                    device: {
                        userId: token.userId,
                    },
                    valid: true,
                },
                data: {
                    valid: false,
                }
            });
            // Send alert to user and devs
            await sendTokenReuseDetectedEmail(token.userId);
            throw new AuthenticationException(
                "Refresh token reuse detected",
                "RefreshTokenReuseDetected",
                LogDebugLevel.CRITICAL,
                logData
            );
        case "MEDIUM":
            // revoke this session
            await prisma.refreshToken.updateMany({
                where: {
                    deviceId: token.deviceId,
                    status: "active",
                },
                data: {
                    status: "revoked",
                }
            });
            await prisma.session.updateMany({
                where: {
                    deviceId: token.deviceId,
                    valid: true,
                },
                data: {
                    valid: false,
                }
            });
            throw new AuthenticationException(
                "Refresh token reuse detected",
                "RefreshTokenReuseDetected",
                LogDebugLevel.CRITICAL,
                logData
            );
        case "LOW":
            throw new AuthenticationException(
                "Refresh token reuse detected",
                "RefreshTokenReuseDetected",
                LogDebugLevel.WARNING,
                logData
            );
    }
}

const getReuseRisk = (props: { fingerprint: FingerprintValidationResult, initialTokenUse: Date }) => {
    const minutesSinceInitialUse = Math.abs(dayjs().diff(dayjs(props.initialTokenUse), 'minutes'));

    if (props.fingerprint.riskLevel >= RiskLevel.MEDIUM) {
        return "SEVERE";
    }
    if (minutesSinceInitialUse > 15) {
        return "SEVERE";
    }
    if (minutesSinceInitialUse > 5) {
        return "MEDIUM";
    }
    return "LOW";
}
