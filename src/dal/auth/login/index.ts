"use server";

import { AuthenticationException, AuthenticationExceptionData, ExceptionType, TwoFactorRequiredException } from "@/errors/Authentication";
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { LoginFormSchema, LoginFormType } from "@/zod/auth";
import { Device, Organisation, User } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { userAgent } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { setTimeout } from "timers/promises";
import { DeviceIdsCookieAccount, FingerprintValidationResult, getDeviceAccountFromCookies, getIPAddress, logSecurityAuditEntry, RiskLevel, UserAgent, validateDeviceFingerprint } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { handleSuccessfulLogin } from "./handleSuccessfulLogin";
import { verifyUser } from "./verifyUser";

type LoginReturnType = {
    loginSuccessful: false;
    exceptionType: Omit<ExceptionType, "TwoFactorRequired" | "RefreshTokenReuseDetected">;
} | { loginSuccessful: true } | {
    loginSuccessful: false;
    exceptionType: "TwoFactorRequired";
    method: "email" | "totp";
};

const ipLimiter = new RateLimiterMemory({
    points: 15, // 15 failed attempts allowed
    duration: 60 * 5, // reset after 5 minutes
});

const consumeIpLimiter = async (ipAddress: string, points: number, userAgent: UserAgent, deviceId?: string) => {
    return ipLimiter.consume(ipAddress, points)
        .then((limit) => {
            if (limit.remainingPoints <= 0) {
                logSecurityAuditEntry({
                    success: false,
                    debugLevel: LogDebugLevel.CRITICAL,
                    ipAddress,
                    details: "IP temporarily blocked due to too many failed login attempts",
                    action: "LOGIN_ATTEMPT",
                    userAgent,
                    deviceId,
                });
            }
        }).catch(() => logSecurityAuditEntry({
            success: false,
            debugLevel: LogDebugLevel.CRITICAL,
            ipAddress,
            details: "IP temporarily blocked due to too many failed login attempts",
            action: "LOGIN_ATTEMPT",
            userAgent,
            deviceId,
        }));
}

export type UserLoginData = AuthenticationExceptionData & {
    user: User;
    organisationId: string;
    organisation: Organisation;
    ipAddress: string;
    agent: UserAgent;
    account: DeviceIdsCookieAccount | null;
    fingerprint: FingerprintValidationResult;
    device: Device | null;
}

export const Login = async (props: LoginFormType): Promise<LoginReturnType> => {
    try {
        await setTimeout(Math.random() * 100); // Mitigate timing analysis attacks by adding random delay between 0ms and 100ms

        // ######## DATA COLLECTION ########
        const headerList = await headers();
        const cookieList = await cookies();
        const ipAddress = getIPAddress(headerList);
        const userAgentStructure = { headers: headerList }
        const agent: UserAgent = userAgent(userAgentStructure);
        const loginLogData: AuthenticationExceptionData = {
            ipAddress,
            userAgent: agent,
        }

        const ipLimit = await ipLimiter.get(ipAddress);
        if (ipLimit && ipLimit.remainingPoints <= 0) {
            console.warn("IP temporarily blocked due to too many failed login attempts", ipAddress);
            throw new AuthenticationException("Too many requests from this IP address", "TooManyRequests", LogDebugLevel.WARNING, loginLogData);
        }

        const parsed = LoginFormSchema.safeParse(props);
        if (!parsed.success) {
            await consumeIpLimiter(ipAddress, 2, agent);
            throw new AuthenticationException("Props could not be passed via zod schema", "UnknownError", LogDebugLevel.CRITICAL, loginLogData);
        }

        const formData = parsed.data!;
        const [organisation, user] = await prisma.$transaction([
            prisma.organisation.findFirst({
                where: { id: formData.organisationId },
            }),
            prisma.user.findFirst({
                where: {
                    email: formData.email,
                    organisationId: formData.organisationId,
                },
            }),
        ]);

        // ############# PRE AUTHENTICATION CHECKS #############
        if (!organisation) {
            await consumeIpLimiter(ipAddress, 5, agent);
            throw new AuthenticationException(`Failed login attempt: Organisation with id ${formData.organisationId} not found`, "AuthenticationFailed", LogDebugLevel.WARNING, loginLogData);
        }

        const { account, accountCookie } = getDeviceAccountFromCookies({ cookieList, organisationId: formData.organisationId });
        loginLogData.organisationId = organisation.id;
        loginLogData.deviceId = account?.deviceId;
        if (!user) {
            await consumeIpLimiter(ipAddress, 1, agent, account?.deviceId);
            throw new AuthenticationException(`Failed login attempt: User with email ${formData.email} not found`, "AuthenticationFailed", LogDebugLevel.INFO, loginLogData);
        }
        loginLogData.userId = user.id;

        const dbDevice = !account ? null : await prisma.device.findUnique({
            where: {
                id: account.deviceId,
                valid: true
            },
            include: {
                sessions: true,
            }
        });

        let fingerprint: FingerprintValidationResult;
        if (dbDevice && account) {
            fingerprint = await validateDeviceFingerprint({
                current: {
                    ipAddress,
                    userAgent: agent,
                    deviceId: account.deviceId,
                },
                expected: {
                    ipAddress: dbDevice.lastIpAddress,
                    deviceId: dbDevice.id,
                    userAgent: dbDevice.userAgent,
                }
            });
        } else {
            fingerprint = {
                riskLevel: RiskLevel.LOW,
                reasons: [],
            }
        }

        // ############# AUTHENTICATION #############
        const UserLoginData: UserLoginData = {
            ...loginLogData,
            organisationId: organisation.id,
            organisation,
            user,
            ipAddress,
            agent,
            account,
            fingerprint,
            device: dbDevice,
        };

        const { mfaMethod } = await verifyUser({
            userData: UserLoginData,
            loginFormData: formData,
        }).catch((e) => {
            if (e instanceof AuthenticationException && e.exceptionType !== "TwoFactorRequired") {
                consumeIpLimiter(ipAddress, 1, agent, account?.deviceId);
            }
            throw e;
        });

        // ############# POST AUTHENTICATION #############
        await handleSuccessfulLogin({
            userLoginData: UserLoginData,
            cookieList: cookieList,
            accountCookie,
            mfaMethod,
        });

        return { loginSuccessful: true };
    } catch (e) {
        if (!(e instanceof AuthenticationException)) {
            console.error("Uncaught login error:", e);
            return {
                loginSuccessful: false,
                exceptionType: "UnknownError"
            };
        }

        const session = await getIronSession();
        session.destroy();

        if (e.exceptionType !== "TooManyRequests") {
            await logSecurityAuditEntry({
                ...e.data,
                success: false,
                debugLevel: e.debugLevel,
                action: "LOGIN_ATTEMPT",
                details: e.message,
            });
        }

        if (e instanceof TwoFactorRequiredException) {
            return {
                loginSuccessful: false,
                exceptionType: "TwoFactorRequired",
                method: e.method,
            }
        }

        return {
            loginSuccessful: false,
            exceptionType: e.exceptionType,
        }
    }
};

