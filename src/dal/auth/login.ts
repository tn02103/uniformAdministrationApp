/* eslint-disable no-console */
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { Organisation, User } from "@prisma/client";
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import dayjs from "dayjs";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies, headers } from "next/headers";
import { userAgent } from "next/server";
import { setTimeout } from "timers/promises";
import { z } from "zod";
import { AuthConfig, DeviceIdsCookie, DeviceIdsCookieAccount, getDeviceAccountFromCookies, issueNewAccessToken, issueNewRefreshToken, logAuthenticationAttempt, UserAgent } from "./helper";
import { redirect, RedirectType } from "next/navigation";

const LoginPropSchema = z.object({
    organisationId: z.string().uuid(),
    email: z.string().email(),
    password: z.string().min(6).max(100)
});
type LoginProps = z.infer<typeof LoginPropSchema>;

type LoginReturnType = {
    loginSuccessful: false;
    exceptionType: "AuthenticationFailed" | "User Blocked" | "UnknownError",
} | { loginSuccessful: true };

export const Login = async (props: LoginProps): Promise<LoginReturnType> => new Promise<LoginReturnType>(async (resolves) => {
    try {
        console.log("🚀 ~ Login ~ props:", props);
        // ######## DATA COLLECTION ########
        await setTimeout(Math.random() * 500); // Mitigate timing analysis attacks by adding random delay between 0ms and 500ms
        const headerList = await headers();
        for (const pair of headerList.entries()) {
            console.log(`🚀 ~ Login ~ HEADERS ~ ${pair[0]}: ${pair[1]}`);
        }
        const cookieList = await cookies();
        const userAgentStructure = { headers: headerList }
        const agent: UserAgent = userAgent(userAgentStructure);
        const ipAddress = headerList.get('x-real-ip') ?? headerList.get('x-forwarded-for') ?? "Unknown IP";
        console.log("🚀 ~ Login ~ agent:", agent);


        const parsed = LoginPropSchema.safeParse(props);
        const { email, password, organisationId } = parsed.data!;
        if (!parsed.success) {
            return resolves({
                loginSuccessful: false,
                exceptionType: "UnknownError"
            });
        }

        const organisation = await prisma.organisation.findFirst({
            where: { id: organisationId },
        });
        console.log("Test5");
        // ############# PRE AUTHENTICATION CHECKS #############
        if (agent.isBot) {
            return resolves(handleBot({ organisation, formOrganisationId: organisationId, email, ipAddress, userAgent: agent }));
        }
        if (!organisation) {
            console.warn("Loginattempt to non existing organisation", { organisationId, email, ipAddress, userAgent: agent });
            return resolves({
                loginSuccessful: false,
                exceptionType: "AuthenticationFailed"
            });
        }

        const { account, accountCookie } = getDeviceAccountFromCookies({ cookieList, organisationId });
        console.log("Test4");

        // ############# AUTHENTICATION #############
        const getUserReturn = await getActiveUser({ email, organisationId, ipAddress, agent });
        if (Object(getUserReturn).hasOwnProperty('loginSuccessful')) {
            return resolves(getUserReturn as LoginReturnType);
        }
        const user = getUserReturn as User;
        console.log("Test3");
        // Validate Password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return resolves(handleInvalidPassword({ userId: user.id, organisationId, ipAddress, agent }));
        }
        // Conditionally other verifications
        console.log("Test2");

        // ############# POST AUTHENTICATION #############
        await handleSuccessfulLogin({ user, organisation, ipAddress, agent, cookieList: cookieList, accountCookie, account });
        console.log("Test1");

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
        console.error("Login failed:", response);
        const session = await getIronSession();
        session.destroy();
    } else {
        console.log("Login successful, redirecting:", response);
        return redirect(`/app/cadet`, RedirectType.push);
    }
    return response;
});


type HandleBotProps = {
    organisation: Organisation | null;
    formOrganisationId: string;
    email: string;
    ipAddress: string | null;
    userAgent: UserAgent;
}
/**
 * Handles bot login attempts.
 * @param props 
 * @returns 
 */
const handleBot = async (props: HandleBotProps): Promise<LoginReturnType> => {
    const { organisation, email, ipAddress, userAgent, formOrganisationId } = props;

    if (organisation) {
        await logAuthenticationAttempt({
            organisationId: organisation.id,
            success: false,
            ipAddress,
            userAgent: userAgent,
            details: "Bot detected",
            action: "LOGIN_ATTEMPT",
        });
    } else {
        console.warn("Loginattempt to non existing organisation by a bot", { formOrganisationId, email, ipAddress, userAgent: userAgent });
    }
    return {
        loginSuccessful: false,
        exceptionType: "AuthenticationFailed"
    }
}


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

type HandleRefreshTokenProps = {
    cookieList: ReadonlyRequestCookies;
    account: DeviceIdsCookieAccount;
    userId: string;
    ipAddress: string;
}
/**
 * Invalidates existing refresh tokens for the device and user, creates a new refresh token, saves it to the database and sets it as a cookie.
 * @param props 
 */
const handleRefreshToken = async (props: HandleRefreshTokenProps) => {
    const { cookieList, account, userId, ipAddress } = props;
    // Invalidate existing refreshTokens
    prisma.refreshToken.updateMany({
        where: {
            deviceId: account.deviceId,
            userId: userId,
        },
        data: {
            revoked: true,
        }
    });

    // Create new refresh Token
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const endOfLife = dayjs().add(3, "days").toDate();
    await prisma.refreshToken.create({
        data: {
            userId: userId,
            deviceId: account.deviceId,
            token: refreshToken,
            endOfLife,
            ipAddress,
        }
    });
    // Set Refreshtoken cookie
    cookieList.set(AuthConfig.refreshTokenCookie, refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: endOfLife,
    });
}
