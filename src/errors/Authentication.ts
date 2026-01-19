import { UserAgent } from "@/dal/auth/helper";
import { LogDebugLevel } from "@/dal/auth/LogDebugLeve.enum";

export type ExceptionType = "AuthenticationFailed" | "User Blocked" | "UnknownError" | "TwoFactorRequired" | "TooManyRequests" | "RefreshTokenReuseDetected";
export type AuthenticationExceptionData = {
    ipAddress: string;
    userAgent: UserAgent;
    organisationId?: string;
    userId?: string;
    deviceId?: string;
};

export class AuthenticationException extends Error {
    exceptionType: ExceptionType;
    debugLevel: LogDebugLevel;
    data: AuthenticationExceptionData;
    constructor(message: string, exceptionType: ExceptionType, debugLevel: LogDebugLevel, data: AuthenticationExceptionData) {
        super(message);
        this.exceptionType = exceptionType;
        this.debugLevel = debugLevel;
        this.data = data;
    }
}

export class TwoFactorRequiredException extends AuthenticationException {
    method: "email" | "totp";
    constructor(message: string, method: "email" | "totp", data: AuthenticationExceptionData) {
        super(message, "TwoFactorRequired", LogDebugLevel.SUCCESS, data);
        this.method = method;
    }
}