/* eslint-disable no-console */
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { Organisation, User } from "@prisma/client";
import bcrypt from 'bcrypt';
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies, headers } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { userAgent } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { setTimeout } from "timers/promises";
import { z } from "zod";
import { AuthConfig, DeviceIdsCookie, DeviceIdsCookieAccount, getDeviceAccountFromCookies, getIPAddress, issueNewAccessToken, issueNewRefreshToken, logAuthenticationAttempt, UserAgent } from "./helper";

const LoginPropSchema = z.object({
    organisationId: z.string().uuid(),
    email: z.string().email(),
    password: z.string().min(6).max(100)
});
type LoginProps = z.infer<typeof LoginPropSchema>;

type LoginReturnType = {
    loginSuccessful: false;
    exceptionType: "AuthenticationFailed" | "User Blocked" | "UnknownError" | "TooManyRequests",
} | { loginSuccessful: true };


const ipLimiter = new RateLimiterMemory({
    points: 15, // 15 failed attempts allowed
    duration: 60 * 15, // reset after 15 minutes
});

const consumeIpLimiter = async (ipAddress: string, points: number) => {
    return ipLimiter.consume(ipAddress, points)
        .then((limit) => {
            console.log("🚀 ~ consumeIpLimiter ~ limit:", limit, ipAddress);
            if (limit.remainingPoints <= 0) {
                console.warn("IP temporarily blocked due to too many failed login attempts", ipAddress);
            }
        }).catch(() => console.warn("IP temporarily blocked due to too many failed login attempts", ipAddress));
}

export const Login = async (props: LoginProps): Promise<LoginReturnType> => new Promise<LoginReturnType>(async (resolves) => {
    try {
        console.log("🚀 ~ Login ~ props:", props);
        // ######## DATA COLLECTION ########
        const headerList = await headers();
        const ipAddress = getIPAddress(headerList);
        const ipLimit = await ipLimiter.get(ipAddress);
        console.log("🚀 ~ Login ~ ipAddress:", ipAddress)
        console.log("🚀 ~ Login ~ ipLimit:", ipLimit)
        if (ipLimit && ipLimit.remainingPoints <= 0) {
            console.warn("IP temporarily blocked due to too many failed login attempts", ipAddress);
            return resolves({
                loginSuccessful: false,
                exceptionType: "TooManyRequests"
            });
        }


        for (const pair of headerList.entries()) {
            console.log(`🚀 ~ Login ~ HEADERS ~ ${pair[0]}: ${pair[1]}`);
        }
        await setTimeout(Math.random() * 500); // Mitigate timing analysis attacks by adding random delay between 0ms and 500ms

        const cookieList = await cookies();
        const userAgentStructure = { headers: headerList }
        const agent: UserAgent = userAgent(userAgentStructure);
        console.log("🚀 ~ Login ~ agent:", agent);


        const parsed = LoginPropSchema.safeParse(props);
        if (!parsed.success) {
            await consumeIpLimiter(ipAddress, 2);
            return resolves({
                loginSuccessful: false,
                exceptionType: "UnknownError"
            });
        }

        const { email, password, organisationId } = parsed.data!;
        const organisation = await prisma.organisation.findFirst({
            where: { id: organisationId },
        });
        console.log("🚀 ~ Login ~ Test5");
        // ############# PRE AUTHENTICATION CHECKS #############
        if (!organisation) {
            await consumeIpLimiter(ipAddress, 5);
            console.warn("Loginattempt to non existing organisation", { organisationId, email, ipAddress, userAgent: agent });
            return resolves({
                loginSuccessful: false,
                exceptionType: "AuthenticationFailed"
            });
        }

        const { account, accountCookie } = getDeviceAccountFromCookies({ cookieList, organisationId });
        console.log("🚀 ~ Login ~ Test4");

        // ############# AUTHENTICATION #############
        const getUserReturn = await getActiveUser({ email, organisationId, ipAddress, agent });
        if (Object(getUserReturn).hasOwnProperty('loginSuccessful')) {
            await consumeIpLimiter(ipAddress, 1);
            return resolves(getUserReturn as LoginReturnType);
        }
        const user = getUserReturn as User;
        console.log("🚀 ~ Login ~ Test3");
        // Validate Password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            await consumeIpLimiter(ipAddress, 1);
            return resolves(handleInvalidPassword({ userId: user.id, organisationId, ipAddress, agent }));
        }
        // Conditionally other verifications
        console.log("🚀 ~ Login ~ Test2");

        // ############# POST AUTHENTICATION #############
        await handleSuccessfulLogin({ user, organisation, ipAddress, agent, cookieList: cookieList, accountCookie, account });
        console.log("🚀 ~ Login ~ Test1");

        await logAuthenticationAttempt({
            userId: user.id,
            organisationId: organisation.id,
            success: true,
            ipAddress,
            userAgent: agent,
            details: "Successful login",
            action: "LOGIN_ATTEMPT",
        })
        return resolves({
            loginSuccessful: true,
        });
    } catch (e) {
        console.error("Login error:", e);
        return resolves({
            loginSuccessful: false,
            exceptionType: "UnknownError"
        });
    }
}).then(async (response) => {
    console.log("🚀 ~ Login ~ response:", response)
    if (!response.loginSuccessful) {
        // Invalidate IRON-SESSION
        const session = await getIronSession();
        session.destroy();
    } else {
        console.log("🚀 ~ Login ~ Login successful, redirecting:", response);
        return redirect(`/app/cadet`, RedirectType.push);
    }
    return response;
});

type GetActiveUserProps = {
    email: string;
    organisationId: string;
    ipAddress: string | null;
    agent: UserAgent;
}
/**
 * Retrieves the active user for a given email and organisation. Handles cases where user does not exists or is blocked.
 * @param props
 * @returns returns a user, or the errorResponse if not found or blocked
 */
const getActiveUser = async (props: GetActiveUserProps): Promise<LoginReturnType | User> => {
    const { email, organisationId, ipAddress, agent } = props;
    const user = await prisma.user.findFirst({
        where: {
            email,
            organisationId,
            recDelete: null,
        }
    });

    if (!user) {
        await logAuthenticationAttempt({
            organisationId,
            success: false,
            ipAddress,
            userAgent: agent,
            details: `Failed login attempt: User with email ${email} not found`,
            action: "LOGIN_ATTEMPT",
        });
        return {
            loginSuccessful: false,
            exceptionType: "AuthenticationFailed"
        }
    }
    if (!user.active) {
        await logAuthenticationAttempt({
            userId: user.id,
            organisationId,
            success: false,
            ipAddress,
            userAgent: agent,
            details: "Failed login attempt: User is blocked",
            action: "LOGIN_ATTEMPT",
        });
        return {
            loginSuccessful: false,
            exceptionType: "User Blocked"
        }
    }
    return user;
}


type handleInvalidPasswordProps = {
    userId: string;
    organisationId: string;
    ipAddress: string | null;
    agent: UserAgent;
}
/**
 * Adds a failed login attempt to the user. If the user has reached the maximum number of failed login attempts, the user is blocked.
 * @param props 
 * @returns 
 */
const handleInvalidPassword = async (props: handleInvalidPasswordProps): Promise<LoginReturnType> => {
    const { userId, organisationId, ipAddress, agent } = props;
    const x = await prisma.user.update({
        where: { id: userId },
        data: { failedLoginCount: { increment: 1 } }
    });
    if (x.failedLoginCount >= 10) {
        await prisma.user.update({
            where: { id: userId },
            data: { active: false }
        });
        await prisma.refreshToken.updateMany({
            where: {
                userId: userId,
            },
            data: {
                revoked: true,
            }
        });

        await logAuthenticationAttempt({
            userId: userId,
            organisationId,
            success: false,
            ipAddress,
            userAgent: agent,
            details: "Failed login attempt: User is now blocked due to too many failed login attempts",
            action: "LOGIN_ATTEMPT",
        });
        return {
            loginSuccessful: false,
            exceptionType: "User Blocked"
        }

        // TODO: Send mail to admin and user that user is now logged out
    }

    logAuthenticationAttempt({
        userId: userId,
        organisationId,
        success: false,
        ipAddress,
        userAgent: agent,
        details: `Failed login attempt: Invalid password`,
        action: "LOGIN_ATTEMPT",
    });
    return {
        loginSuccessful: false,
        exceptionType: "AuthenticationFailed"
    }
}

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

    prisma.user.update({
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
