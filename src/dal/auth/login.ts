import { AuthenticationException, AuthenticationExceptionData, ExceptionType, TwoFactorRequiredException } from "@/errors/Authentication";
import { prisma } from "@/lib/db";
import { sendUserBlockedEmail } from "@/lib/email/userBlockedEmail";
import { getIronSession } from "@/lib/ironSession";
import { LoginFormSchema, LoginFormType } from "@/zod/auth";
import { Organisation, User } from "@prisma/client";
import bcrypt from 'bcrypt';
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies, headers } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { userAgent } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { setTimeout } from "timers/promises";
import { __unsecuredSendEmailVerifyCode } from "./email/verifyCode";
import { AuthConfig, DeviceIdsCookie, DeviceIdsCookieAccount, get2FARequiredForLogin, getDeviceAccountFromCookies, getIPAddress, getUser2FAConfig, issueNewAccessToken, issueNewRefreshToken, LogDebugLevel, logSecurityAuditEntry, UserAgent, verifyMFAToken } from "./helper";


type LoginReturnType = {
    loginSuccessful: false;
    exceptionType: Omit<ExceptionType, "TwoFactorRequired">;
} | { loginSuccessful: true } | {
    loginSuccessful: false;
    exceptionType: "TwoFactorRequired";
    method: "email" | "totp";
};


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

export const Login = async (props: LoginFormType): Promise<LoginReturnType> => {
    try {
        await setTimeout(Math.random() * 500); // Mitigate timing analysis attacks by adding random delay between 0ms and 500ms

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
            throw new AuthenticationException("props could not be passed via zod schema", "UnknownError", LogDebugLevel.CRITICAL, loginLogData);
        }

        const { email, password, organisationId, secondFactor } = parsed.data!;
        const [organisation, user] = await prisma.$transaction([
            prisma.organisation.findFirst({
                where: { id: organisationId },
            }),
            prisma.user.findFirst({
                where: {
                    email,
                    organisationId,
                },
            }),
        ]);

        // ############# PRE AUTHENTICATION CHECKS #############
        if (!organisation) {
            await consumeIpLimiter(ipAddress, 5, agent);
            throw new AuthenticationException(`Failed login attempt: Organisation with id ${organisationId} not found`, "AuthenticationFailed", LogDebugLevel.WARNING, loginLogData);
        }

        const { account, accountCookie } = getDeviceAccountFromCookies({ cookieList, organisationId });
        loginLogData.organisationId = organisation.id;
        loginLogData.deviceId = account?.deviceId;
        if (!user) {
            await consumeIpLimiter(ipAddress, 1, agent, account?.deviceId);
            throw new AuthenticationException(`Failed login attempt: User with email ${email} not found`, "AuthenticationFailed", LogDebugLevel.INFO, loginLogData);
        }
        loginLogData.userId = user.id;

        // ############# AUTHENTICATION #############
        try {
            await verifyUser({ user, account, organisationId, ipAddress, agent, password, secondFactor, loginLogData });
        } catch (e) {
            if (e instanceof AuthenticationException) {
                consumeIpLimiter(ipAddress, 1, agent, account?.deviceId);
            }
            throw e;
        }

        // ############# POST AUTHENTICATION #############
        await handleSuccessfulLogin({ user, organisation, ipAddress, agent, cookieList: cookieList, accountCookie, account });

        return redirect(`/app/cadet`, RedirectType.push);
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

type VerifyUserProps = {
    user: User;
    account: DeviceIdsCookieAccount | null;
    organisationId: string;
    ipAddress: string;
    agent: UserAgent;
    password: string;
    secondFactor: LoginFormType["secondFactor"];
    loginLogData: AuthenticationExceptionData;
}
/**
 * Retrieves the active user for a given email and organisation. Handles cases where user does not exists or is blocked.
 * @param props
 * @returns returns a user, or the errorResponse if not found or blocked
 */
const verifyUser = async (props: VerifyUserProps): Promise<void> => {
    const { user, account, ipAddress, agent, organisationId, secondFactor, loginLogData } = props;
    if (user.recDelete) {
        throw new AuthenticationException("User has been deleted", "AuthenticationFailed", LogDebugLevel.WARNING, loginLogData);
    }

    if (!user.active) {
        throw new AuthenticationException("User is blocked", "User Blocked", LogDebugLevel.WARNING, loginLogData);
    }

    const isValidPassword = await bcrypt.compare(props.password, user.password);
    if (!isValidPassword) {
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginCount: { increment: 1 } }
        });
        if (updatedUser.failedLoginCount >= 10) {
            await prisma.user.update({
                where: { id: user.id },
                data: { active: false }
            });
            await prisma.refreshToken.updateMany({
                where: {
                    userId: user.id,
                },
                data: {
                    revoked: true,
                }
            });
            await sendUserBlockedEmail(user.id);
            throw new AuthenticationException("User is now blocked due to too many failed login attempts", "User Blocked", LogDebugLevel.WARNING, loginLogData);
        }
        throw new AuthenticationException("Failed login attempt: Invalid password", "AuthenticationFailed", LogDebugLevel.INFO, loginLogData);
    }

    // 2FA Check
    if (secondFactor) {
        return verifyMFAToken(secondFactor.token, secondFactor.appId, organisationId, loginLogData);
    }
    const { enabled, method } = await getUser2FAConfig(user.id);
    if (!enabled) {
        return;
    }

    const secondFactorRequired = await get2FARequiredForLogin({
        account,
        agent,
        ipAddress,
    });
    if (!secondFactorRequired) {
        return;
    }

    if (method === "email") {
        await __unsecuredSendEmailVerifyCode(organisationId, user.id);
    }
    throw new TwoFactorRequiredException("Two factor authentication required", method === "email" ? "email" : "totp", loginLogData);
};

// ############## POST AUTHENTICATION ##################
type HandleSuccessfulLoginProps = {
    user: User;
    organisation: Organisation;
    ipAddress: string;
    agent: UserAgent;
    cookieList: ReadonlyRequestCookies;
    account: DeviceIdsCookieAccount | null;
    accountCookie: DeviceIdsCookie | null;
}
const handleSuccessfulLogin = async (props: HandleSuccessfulLoginProps): Promise<void> => {
    const { user, organisation, ipAddress, agent, cookieList, accountCookie } = props;
    let { account } = props;

    const session = await getIronSession();

    await prisma.user.update({
        where: { id: user.id },
        data: {
            lastLoginAt: new Date(),
            failedLoginCount: 0,
        }
    });

    // Register new device if it does not exists
    account = await handleDeviceUsage({ account, accountCookie, organisationId: organisation.id, userAgent: agent, ipAddress, userId: user.id, cookieList: cookieList });

    await issueNewRefreshToken({ cookieList, userId: user.id, deviceId: account.deviceId, ipAddress });
    await issueNewAccessToken({ session, user, organisation });
    await logSecurityAuditEntry({
        userId: user.id,
        organisationId: organisation.id,
        success: true,
        ipAddress,
        userAgent: agent,
        details: "Successful login",
        action: "LOGIN_ATTEMPT",
        deviceId: account.deviceId,
        debugLevel: LogDebugLevel.SUCCESS,
    });
};

type HandleDeviceUsageProps = {
    accountCookie: DeviceIdsCookie | null;
    account: DeviceIdsCookieAccount | null;
    organisationId: string;
    userAgent: UserAgent;
    ipAddress: string;
    userId: string;
    cookieList: ReadonlyRequestCookies;
}
/**
 * Creates or updates a device usage entry and updates the auth cookie accordingly.
 * @param props 
 * @returns The current device account information.
 */
const handleDeviceUsage = async (props: HandleDeviceUsageProps): Promise<DeviceIdsCookieAccount> => {
    const { accountCookie, organisationId, userAgent, ipAddress, userId, cookieList } = props;
    let { account } = props;
    if (account) {
        await prisma.device.update({
            where: {
                id: account.deviceId
            },
            data: {
                lastUsedAt: new Date(),
            }
        });
    } else {
        const name = `${userAgent.os.name} ${userAgent.os.version} - ${userAgent.browser.name}`;
        const device = await prisma.device.create({
            data: {
                userId: userId,
                name: name,
                lastIpAddress: ipAddress,
                userAgent: JSON.stringify(userAgent),
                lastUsedAt: new Date(),
                lastLoginAt: new Date(),
                last2FAAt: null,
            }
        });
        account = {
            deviceId: device.id,
            organisationId: organisationId,
            lastUsedAt: new Date().toISOString(),
        }
    }

    if (accountCookie?.lastUsed.organisationId === organisationId) {
        cookieList.set(AuthConfig.deviceCookie, JSON.stringify({
            lastUsed: {
                ...account,
                lastUsedAt: new Date(),
            },
            otherAccounts: accountCookie.otherAccounts,
        }));
    } else {
        const otherAccounts = accountCookie ? accountCookie.otherAccounts.filter(x => x.organisationId !== organisationId) : [];
        cookieList.set(AuthConfig.deviceCookie, JSON.stringify({
            lastUsed: {
                ...account,
                lastUsedAt: new Date(),
            },
            otherAccounts: otherAccounts,
        }));
    }

    return account;
}
