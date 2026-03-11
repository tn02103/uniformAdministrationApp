import { AuthenticationException, AuthenticationExceptionData } from "@/errors/Authentication";
import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/db";
import { sendTokenReuseDetectedEmail } from "@/lib/email/tokenReuseDetected";
import { RiskLevel, UserAgent, validateDeviceFingerprint } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { isRedisAvailable } from "../redis";
import { DBRefreshToken } from "./refreshAccessToken";

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

    const ipChanged = token.usedIpAddress !== ipAddress;
    const timeSinceUse = Math.abs(dayjs().diff(dayjs(token.usedAt), 'milliseconds'));

    // SCENARIO 1: Network retry without Redis (defense in depth)
    // Only fires if both frontend lock AND Redis idempotency failed
    if (!isRedisAvailable() &&
        fingerprint.riskLevel === RiskLevel.LOW &&
        !ipChanged &&
        timeSinceUse < 100) {
        // Inform developers but don't spook users
        await sendTokenReuseDetectedEmail(token.userId, false); // sendUserEmail=false

        throw new AuthenticationException(
            "Token already used (possible network retry - Redis unavailable)",
            "AuthenticationFailed",
            LogDebugLevel.WARNING,
            logData
        );
    }

    // SCENARIO 2: Different IP (token in two locations = definite attack)
    if (ipChanged) {
        // Revoke device + all sessions
        await prisma.refreshToken.updateMany({
            where: { deviceId: token.deviceId, status: "active" },
            data: { status: "revoked" }
        });
        await prisma.session.updateMany({
            where: { deviceId: token.deviceId, valid: true },
            data: { valid: false }
        });

        // Alert BOTH developers and user (high certainty)
        await sendTokenReuseDetectedEmail(token.userId, true); // sendUserEmail=true

        throw new AuthenticationException(
            "Refresh token reuse detected - Different IP address",
            "RefreshTokenReuseDetected",
            LogDebugLevel.CRITICAL,
            logData
        );
    }

    // SCENARIO 3: Different device (fingerprint mismatch = likely attack)
    if (fingerprint.riskLevel >= RiskLevel.MEDIUM) {
        // Revoke device + all sessions
        await prisma.refreshToken.updateMany({
            where: { deviceId: token.deviceId, status: "active" },
            data: { status: "revoked" }
        });
        await prisma.session.updateMany({
            where: { deviceId: token.deviceId, valid: true },
            data: { valid: false }
        });

        // Alert BOTH developers and user (high certainty)
        await sendTokenReuseDetectedEmail(token.userId, true); // sendUserEmail=true

        throw new AuthenticationException(
            "Refresh token reuse detected - Device fingerprint mismatch",
            "RefreshTokenReuseDetected",
            LogDebugLevel.CRITICAL,
            logData
        );
    }

    // SCENARIO 4: Same device + Same IP + Slow (>100ms = suspicious but not certain)
    // Revoke token family only (this device session chain)
    await prisma.refreshToken.updateMany({
        where: { tokenFamilyId: token.tokenFamilyId, status: "active" },
        data: { status: "revoked" }
    });
    await prisma.session.updateMany({
        where: {
            refreshTokens: { some: { tokenFamilyId: token.tokenFamilyId } }
        },
        data: { valid: false }
    });

    // Alert developers only (not certain enough to alarm user)
    await sendTokenReuseDetectedEmail(token.userId, false); // sendUserEmail=false

    throw new AuthenticationException(
        "Refresh token reuse detected - Token family revoked",
        "RefreshTokenReuseDetected",
        LogDebugLevel.CRITICAL,
        logData
    );
}
