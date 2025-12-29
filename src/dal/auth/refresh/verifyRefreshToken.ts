import { AuthenticationException, AuthenticationExceptionData } from "@/errors/Authentication";
import { Device, RefreshToken, User } from "@prisma/client";
import { isValid } from "date-fns";
import dayjs from "dayjs";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { DeviceIdsCookieAccount, FingerprintValidationResult, RiskLevel, UserAgent, validateDeviceFingerprint } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { handleRefreshTokenReuse } from "./handleReuse";
import { sha256Hex } from "../helper.tokens";

type verificationsProp = {
    agent: UserAgent,
    ipAddress: string;
    sendToken: string;
    dbToken: RefreshToken;
    user: User;
    cookieList: ReadonlyRequestCookies;
    account: DeviceIdsCookieAccount;
    device: Device;
    logData: AuthenticationExceptionData;
}
export const verifyRefreshToken = async (props: verificationsProp): Promise<FingerprintValidationResult> => {
    const { agent, ipAddress, sendToken, dbToken, user, device, account, logData } = props;

    const sendTokenHash = sha256Hex(sendToken);
    if (dbToken.token !== sendTokenHash) {
        throw new AuthenticationException("Refresh token hash does not match", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
    }

    if (dbToken.status === 'revoked') {
        throw new AuthenticationException("Refresh token has been revoked", "AuthenticationFailed", LogDebugLevel.CRITICAL, logData);
    }

    if (dbToken.usedAt || dbToken.status === "rotated") {
        handleRefreshTokenReuse({
            reusedToken: dbToken,
            user,
            device,
            ipAddress
        });
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
    if (account.organisationId !== user.organisationId) {
        throw new AuthenticationException(
            "Organisation ID mismatch. The last used organisation Id in the account cookie does not match the user's organisation Id",
            "AuthenticationFailed",
            LogDebugLevel.WARNING,
            logData
        );
    }

    // ##### VALIDATE FINGERPRINT ####
    const fingerprintValidation = await validateDeviceFingerprint({
        expected: {
            ipAddress: dbToken.issuerIpAddress,
            deviceId: device.id,
            userAgent: device.userAgent,
        },
        current: {
            ipAddress,
            userAgent: agent,
            deviceId: account.deviceId,
        }
    });

    if (fingerprintValidation.riskLevel >= RiskLevel.HIGH) {
        throw new AuthenticationException(
            `Device fingerprint validation failed. 
                 Risk level: ${fingerprintValidation.riskLevel}
                 Reasons: ${fingerprintValidation.reasons.join(", ")}`,
            "AuthenticationFailed",
            fingerprintValidation.riskLevel === RiskLevel.SEVERE ? LogDebugLevel.CRITICAL : LogDebugLevel.INFO,
            logData
        );
    }

    return fingerprintValidation;

}
