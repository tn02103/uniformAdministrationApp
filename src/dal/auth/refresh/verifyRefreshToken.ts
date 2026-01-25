import { AuthenticationException, AuthenticationExceptionData } from "@/errors/Authentication";
import { isValid } from "date-fns";
import dayjs from "dayjs";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { DBRefreshToken } from ".";
import { AuthConfig, DeviceIdsCookieAccount, FingerprintValidationResult, RiskLevel, UserAgent, validateDeviceFingerprint } from "../helper";
import { sha256Hex } from "../helper.tokens";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { handleRefreshTokenReuse } from "./handleReuse";

type verificationsProp = {
    dbToken: DBRefreshToken;
    agent: UserAgent;
    ipAddress: string;
    sendToken: string;
    cookieList: ReadonlyRequestCookies;
    account: DeviceIdsCookieAccount;
    logData: AuthenticationExceptionData;
}
export const verifyRefreshToken = async (props: verificationsProp): Promise<FingerprintValidationResult> => {
    const { agent, ipAddress, sendToken, dbToken, account, logData } = props;

    const sendTokenHash = sha256Hex(sendToken);
    if (dbToken.token !== sendTokenHash) {
        throw new AuthenticationException("Refresh token hash does not match", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
    }

    if (dbToken.status === 'revoked') {
        throw new AuthenticationException("Refresh token has been revoked", "AuthenticationFailed", LogDebugLevel.CRITICAL, logData);
    }

    if (dbToken.usedAt || dbToken.status === "rotated") {
        handleRefreshTokenReuse({
            token: dbToken,
            ipAddress,
            agent,
            logData,
        });
    }

    if (!dbToken.session.valid) {
        throw new AuthenticationException("Session is no longer valid", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
    }

    if (!isValid(dbToken.endOfLife) || dayjs().add(AuthConfig.inactiveRefreshMinAge, "minutes").isAfter(dbToken.endOfLife)) {
        // EOL may be to short for inactive sessions. Only valid if session is active
        if (dayjs(dbToken.endOfLife).isBefore()) {
            // expired
            throw new AuthenticationException(
                `Refresh token has expired. The token expired ${dayjs().diff(dbToken.endOfLife, 'seconds')} seconds ago`,
                "AuthenticationFailed",
                LogDebugLevel.INFO,
                logData
            );
        }

        if (dayjs(dbToken.issuedAt).add(AuthConfig.inactiveCutoff, "minutes").isBefore()) {
            // inactive session
            throw new AuthenticationException(
                `Refresh token has expired due to inactive session. Not enough remaining lifetime to reactivate the session.`,
                "AuthenticationFailed",
                LogDebugLevel.INFO,
                logData
            );
        }
    }
    if (!dbToken.user.active) {
        throw new AuthenticationException("User is not active", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
    }
    if (dbToken.user.failedLoginCount > 5) {
        throw new AuthenticationException("User has to many failed login attempts", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
    }
    if (dbToken.user.recDelete) {
        throw new AuthenticationException("User is deleted", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
    }
    if (dbToken.user.changePasswordOnLogin) {
        throw new AuthenticationException("User has to change. No refresh possible", "AuthenticationFailed", LogDebugLevel.INFO, logData);
    }

    // ##### VALIDATE DEVICE FROM DB ####
    if (account.organisationId !== dbToken.user.organisationId) {
        throw new AuthenticationException(
            "Organisation ID mismatch. The last used organisation Id in the account cookie does not match the user's organisation Id",
            "UnknownError",
            LogDebugLevel.WARNING,
            logData
        );
    }

    // ##### VALIDATE FINGERPRINT ####
    const fingerprintValidation = await validateDeviceFingerprint({
        expected: {
            ipAddress: dbToken.issuerIpAddress,
            deviceId: dbToken.device.id,
            userAgent: dbToken.session.userAgent,
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
