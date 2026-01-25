import { genericSANoDataValidator } from "@/actions/validations";
import { AuthenticationException, AuthenticationExceptionData } from "@/errors/Authentication";
import { AuthRole } from "@/lib/AuthRoles";
import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/db";
import { sendTokenViaEmail } from "@/lib/email/emailToken";
import { cookies, headers } from "next/headers";
import { userAgent } from "next/server";
import { getDeviceAccountFromCookies, getIPAddress, logSecurityAuditEntry, RiskLevel, validateDeviceFingerprint } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";

export const sendVerifyCode = async () => genericSANoDataValidator(
    AuthRole.user,
).then(async ([{ id, organisationId }]) => __unsecuredSendEmailVerifyCode(organisationId, id));

export const __unsecuredSendEmailVerifyCode = async (organisationId: string, id: string) => {
    const headerList = await headers();
    const cookieList = await cookies();
    const ipAddress = getIPAddress(headerList);
    const { accountCookie } = getDeviceAccountFromCookies({ cookieList, organisationId });
    const agent = userAgent({ headers: headerList });
    if (!accountCookie?.lastUsed) throw new Error('Device not recognized. Please login again.');

    const logAudit = (success: boolean, details: string) => logSecurityAuditEntry({
        ipAddress,
        organisationId,
        userId: id,
        deviceId: accountCookie.lastUsed.deviceId,
        action: "SEND_EMAIL_CODE",
        success,
        details,
        userAgent: agent,
        debugLevel: success ? LogDebugLevel.SUCCESS : LogDebugLevel.INFO,
    });

    const user = await prisma.user.findUniqueOrThrow({
        where: {
            id: id,
        }
    });

    await prisma.emailToken.deleteMany({
        where: {
            userId: id,
        }
    });

    // Generate a 6-digit token with only digits
    const token = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.emailToken.create({
        data: {
            userId: user.id,
            token: token,
            endOfLive: dayjs().add(1, 'hour').toDate(),
            ipAddress: ipAddress,
            userAgent: JSON.stringify(userAgent),
            deviceId: accountCookie.lastUsed.deviceId,
        },
    });

    await sendTokenViaEmail(user, token);
    logAudit(true, 'Verification code sent');
};


export const verifyEmailCode = async (organisationId: string, userId: string, token: string): Promise<void> => {
    const headerList = await headers();
    const cookieList = await cookies();
    const ipAddress = getIPAddress(headerList);
    const { accountCookie } = getDeviceAccountFromCookies({ cookieList, organisationId });
    const agent = userAgent({ headers: headerList });
    if (!accountCookie?.lastUsed) throw new AuthenticationException(
        'Device not recognized. Please login again.',
        "AuthenticationFailed",
        LogDebugLevel.WARNING,
        { ipAddress, userId, organisationId, userAgent: agent }
    );

    const exceptionData = {
        userId,
        ipAddress,
        organisationId,
        userAgent: agent,
        deviceId: accountCookie.lastUsed.deviceId,
    } satisfies AuthenticationExceptionData;

    const tokenEntry = await prisma.emailToken.findFirst({
        where: {
            userId,
            token,
        }
    });
    if (!tokenEntry) {
        throw new AuthenticationException('Invalid email verification code. Token not found', "AuthenticationFailed", LogDebugLevel.INFO, exceptionData);
    }

    if (tokenEntry.usedAt) {
        throw new AuthenticationException('Invalid email verification code. Token already used', "AuthenticationFailed", LogDebugLevel.CRITICAL, exceptionData);
    }

    if (dayjs(tokenEntry.endOfLive).isBefore(dayjs())) {
        throw new AuthenticationException('Invalid email verification code. Token expired', "AuthenticationFailed", LogDebugLevel.INFO, exceptionData);
    }

    await prisma.emailToken.update({
        where: {
            id: tokenEntry.id,
        },
        data: {
            usedAt: new Date(),
            usedIpAddress: ipAddress,
            usedUserAgent: JSON.stringify(agent),
        }
    });

    const fingerprintResult = await validateDeviceFingerprint({
        current: {
            userAgent: agent,
            ipAddress: ipAddress,
            deviceId: accountCookie.lastUsed.deviceId,
        },
        expected: {
            userAgent: tokenEntry.userAgent,
            ipAddress: tokenEntry.ipAddress,
            deviceId: tokenEntry.deviceId,
        }
    });
    if (fingerprintResult.riskLevel !== RiskLevel.LOW) {
        const message = `
            Invalid email verification code -> Device fingerprint validation failed: 
            ${fingerprintResult.reasons.join(', ')}, 
            Risk level: ${fingerprintResult.riskLevel}
        `;
        throw new AuthenticationException(
            message,
            "AuthenticationFailed",
            fingerprintResult.riskLevel === RiskLevel.SEVERE ? LogDebugLevel.CRITICAL : LogDebugLevel.WARNING,
            exceptionData
        );
    }
    if (ipAddress !== tokenEntry.ipAddress) {
        const message = `
            Invalid email verification code -> IP address mismatch: 
            expected: ${tokenEntry.ipAddress}, 
            actual: ${ipAddress}`;

        throw new AuthenticationException(message, "AuthenticationFailed", LogDebugLevel.INFO, exceptionData);
    }
    return;
};
