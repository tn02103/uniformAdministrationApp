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
import { AuthConfig, DeviceIdsCookie, DeviceIdsCookieAccount, getDeviceAccountFromCookies, getIPAddress, issueNewAccessToken, issueNewRefreshToken, logSecurityAuditEntry, UserAgent } from "./helper";
import { LoginFormSchema, LoginFormType } from "@/zod/auth";
import { sendUserBlockedEmail } from "@/lib/email/userBlockedEmail";

type LoginReturnType = {
    loginSuccessful: false;
    exceptionType: "AuthenticationFailed" | "User Blocked" | "UnknownError" | "TooManyRequests",
} | { loginSuccessful: true };


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
                    ipAddress,
                    details: "IP temporarily blocked due to too many failed login attempts",
                    action: "LOGIN_ATTEMPT",
                    userAgent,
                    deviceId,
                });
            }
        }).catch(() => logSecurityAuditEntry({
            success: false,
            ipAddress,
            details: "IP temporarily blocked due to too many failed login attempts",
            action: "LOGIN_ATTEMPT",
            userAgent,
            deviceId,
        }));
}

export const Login = async (props: LoginFormType): Promise<LoginReturnType> => new Promise<LoginReturnType>(async (resolves) => {
    try {
        await setTimeout(Math.random() * 500); // Mitigate timing analysis attacks by adding random delay between 0ms and 500ms

        // ######## DATA COLLECTION ########
        const headerList = await headers();
        const cookieList = await cookies();
        const ipAddress = getIPAddress(headerList);
        const userAgentStructure = { headers: headerList }
        const agent: UserAgent = userAgent(userAgentStructure);

        const ipLimit = await ipLimiter.get(ipAddress);
        if (ipLimit && ipLimit.remainingPoints <= 0) {
            console.warn("IP temporarily blocked due to too many failed login attempts", ipAddress);
            return resolves({
                loginSuccessful: false,
                exceptionType: "TooManyRequests"
            });
        }

        const parsed = LoginFormSchema.safeParse(props);
        if (!parsed.success) {
            await consumeIpLimiter(ipAddress, 2, agent);
            return resolves({
                loginSuccessful: false,
                exceptionType: "UnknownError"
            });
        }

        const { email, password, organisationId } = parsed.data!;
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
            await logSecurityAuditEntry({
                success: false,
                ipAddress,
                userAgent: agent,
                details: `Failed login attempt: Organisation with id ${organisationId} not found`,
                action: "LOGIN_ATTEMPT",
            });

            return resolves({
                loginSuccessful: false,
                exceptionType: "AuthenticationFailed"
            });
        }
        const { account, accountCookie } = getDeviceAccountFromCookies({ cookieList, organisationId });
        if (!user) {
            await consumeIpLimiter(ipAddress, 1, agent, account?.deviceId);
            await logSecurityAuditEntry({
                ipAddress,
                organisationId,
                success: false,
                userAgent: agent,
                details: `Failed login attempt: User with email ${email} not found`,
                action: "LOGIN_ATTEMPT",
                deviceId: account?.deviceId,
            });

            return resolves({
                loginSuccessful: false,
                exceptionType: "AuthenticationFailed"
            });
        }

        // ############# AUTHENTICATION #############
        const isVerified = await verifyUser({ user, account, organisationId, ipAddress, agent, password });
        if (!isVerified.loginSuccessful) {
            return resolves(isVerified);
        }

        // ############# POST AUTHENTICATION #############
        await handleSuccessfulLogin({ user, organisation, ipAddress, agent, cookieList: cookieList, accountCookie, account });

        return resolves({
            loginSuccessful: true,
        });
    } catch (e) {
        console.error("Uncaught login error:", e);
        return resolves({
            loginSuccessful: false,
            exceptionType: "UnknownError"
        });
    }
}).then(async (response) => {
    if (!response.loginSuccessful) {
        // Invalidate IRON-SESSION
        const session = await getIronSession();
        session.destroy();
    } else {
        return redirect(`/app/cadet`, RedirectType.push);
    }
    return response;
});

type VerifyUserProps = {
    user: User;
    account: DeviceIdsCookieAccount | null;
    organisationId: string;
    ipAddress: string;
    agent: UserAgent;
    password: string;
}
/**
 * Retrieves the active user for a given email and organisation. Handles cases where user does not exists or is blocked.
 * @param props
 * @returns returns a user, or the errorResponse if not found or blocked
 */
const verifyUser = async (props: VerifyUserProps): Promise<LoginReturnType> => {
    const { user, account, ipAddress, agent, organisationId } = props;
    const criticalReasons: string[] = [];
    if (user.recDelete) {
        criticalReasons.push("User has been deleted");
    }

    if (!user.active) {
        criticalReasons.push("User is inactive");
    }

    // If there are critical problems with the user, log and return
    if (criticalReasons.length > 0) {
        await logSecurityAuditEntry({
            userId: user.id,
            organisationId: user.organisationId,
            success: false,
            ipAddress,
            userAgent: agent,
            details: `${criticalReasons.join(", ")}`,
            action: "LOGIN_ATTEMPT",
            deviceId: account?.deviceId,
        });
        return {
            loginSuccessful: false,
            exceptionType: user.active ? "AuthenticationFailed" : "User Blocked"
        }
    }

    const isValidPassword = await bcrypt.compare(props.password, user.password);
    if (!isValidPassword) {
        await consumeIpLimiter(ipAddress, 1, agent, account?.deviceId);
        return handleInvalidPassword({ userId: user.id, organisationId, ipAddress, agent })
    }

    /* 
      USE WHEN 2FA IS IMPLEMENTED
      let fingerprintValidation = null;
      if (account) {
          const device = await prisma.device.findFirst({
              where: {
                  id: account.deviceId,
              }
          });
          if (device) {
              fingerprintValidation = await validateDeviceFingerprint(
                  device.lastIpAddress,
                  device,
                  account,
                  ipAddress,
                  agent
              );
          }
      }
  */
    return {
        loginSuccessful: true,
    }
}


type handleInvalidPasswordProps = {
    userId: string;
    deviceId?: string;
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
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { failedLoginCount: { increment: 1 } }
    });
    if (updatedUser.failedLoginCount >= 10) {
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

        await logSecurityAuditEntry({
            userId: userId,
            organisationId,
            success: false,
            ipAddress,
            userAgent: agent,
            details: "Failed login attempt: User is now blocked due to too many failed login attempts",
            action: "LOGIN_ATTEMPT",
            deviceId: props.deviceId,
        });
        await sendUserBlockedEmail(userId);
        return {
            loginSuccessful: false,
            exceptionType: "User Blocked"
        }
    }

    logSecurityAuditEntry({
        userId: userId,
        organisationId,
        success: false,
        ipAddress,
        userAgent: agent,
        details: `Failed login attempt: Invalid password`,
        action: "LOGIN_ATTEMPT",
        deviceId: props.deviceId,
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
