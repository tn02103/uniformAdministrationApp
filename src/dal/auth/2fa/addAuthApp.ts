import { genericSAValidator } from "@/actions/validations"
import { AuthRole } from "@/lib/AuthRoles"
import { prisma } from "@/lib/db";
import { TOTP } from "otpauth";
import z from "zod"
import { getDeviceAccountFromCookies, getIPAddress, logSecurityAuditEntry } from "../helper";
import { cookies, headers } from "next/headers";
import { userAgent } from "next/server";
import { SAReturnType } from "@/dal/_helper/testHelper";

const AppConfig = {
    digits: 6,
    period: 30,
    window: 1,
}

const addPropSchema = z.object({
    userId: z.string().uuid().optional(),
    appName: z.string().min(1).max(20, "string.max;value:20")
});
type AddPropType = z.infer<typeof addPropSchema>;
type AddAuthAppReturnType = SAReturnType<{
    url: string;
    appId: string;
}>
export const add = async (props: AddPropType): AddAuthAppReturnType => genericSAValidator(
    props.userId ? AuthRole.admin : AuthRole.user,
    props,
    addPropSchema,
    { userId: props.userId }
).then(async ([{ organisationId, id }, data]) => prisma.$transaction(async (client) => {
    const userId = data.userId || id;
    // VALIDATE USER
    const headerList = await headers();
    const cookieList = await cookies();
    const ipAddress = getIPAddress(headerList);
    const { accountCookie } = getDeviceAccountFromCookies({ cookieList, organisationId });
    const agent = userAgent({ headers: headerList });
    if (!accountCookie?.lastUsed) throw new Error('Device not recognized. Please login again.');

    // Remove unverified apps
    await client.twoFactorApp.deleteMany({
        where: {
            userId: userId,
            verified: false
        }
    });

    const user = await client.user.findUnique({
        where: {
            id: userId,
            organisationId: organisationId
        },
        include: {
            organisation: true,
            twoFactorApps: true
        }
    });
    if (!user) throw new Error('User not found');

    // Verify app name is unique for user
    const name = data.appName.trim();
    if (user.twoFactorApps.find(app => app.appName.toLowerCase() === name.toLowerCase())) {
        return {
            error: {
                formElement: "appName",
                message: "custom.auth.2fa.appNameNotUnique"
            }
        }
    }


    // CREATE APP
    const totp = new TOTP({
        label: user.name!,
        issuer: 'Uniformadmin-' + user.organisation.acronym,
        digits: AppConfig.digits,
        period: AppConfig.period,
    });

    const app = await client.twoFactorApp.create({
        data: {
            secret: totp.secret.base32,
            userId: user.id!,
            appName: name,
            verified: false,
        }
    });
    await logSecurityAuditEntry({
        ipAddress,
        organisationId,
        userId: id,
        deviceId: accountCookie.lastUsed.deviceId,
        action: "CREATE_2FA_APP",
        success: true,
        details: `Created new 2FA app for user ${user.username} (${user.id})`,
        userAgent: agent,
    });

    return { url: totp.toString(), appId: app.id };
}));


const RemovedUnverifiedAuthAppSchema = z.object({
    userId: z.string().uuid().optional(),
    appId: z.string().uuid(),
});
type RemovedUnverifiedAuthAppType = z.infer<typeof RemovedUnverifiedAuthAppSchema>;

export const removeUnverified = async (props: RemovedUnverifiedAuthAppType) => genericSAValidator(
    props.userId ? AuthRole.admin : AuthRole.user,
    props,
    RemovedUnverifiedAuthAppSchema,
    { userId: props.userId }
).then(async ([{ id }, data]) => {

    return prisma.twoFactorApp.deleteMany({
        where: {
            userId: data.userId || id,
            id: data.appId,
            verified: false
        }
    });
});

const verifyPropSchema = z.object({
    userId: z.string().uuid().optional(),
    token: z.string().min(6).max(6),
    appId: z.string().min(1),
});
type VerifyPropType = z.infer<typeof verifyPropSchema>;
type VerifyReturnType = Promise<{
    success: true;
} | { success: false; error: string }>;
export const verify = async (props: VerifyPropType): VerifyReturnType => genericSAValidator(
    props.userId ? AuthRole.admin : AuthRole.user,
    props,
    verifyPropSchema,
    { userId: props.userId }
).then(async ([{ organisationId, id }, { token, appId, ...data }]) => prisma.$transaction(async (client) => {
    const userId = data.userId || id;
    // VALIDATE USER
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
        action: "VERIFY_2FA_APP",
        success,
        details,
        userAgent: agent,
    });

    const dbApp = await client.twoFactorApp.findFirst({
        where: {
            id: appId,
            user: {
                id: userId,
                organisationId: organisationId
            }
        },
        include: {
            user: true
        }
    });
    if (!dbApp) {
        logAudit(false, `2FA app not found (${appId})`);
        return { success: false, error: 'Unknown 2FA app' };
    }
    if (dbApp.verified) {
        logAudit(false, `2FA app already verified (${appId})`);
        return { success: false, error: 'App already verified' };
    }

    const totp = new TOTP({
        secret: dbApp.secret,
        digits: AppConfig.digits,
        period: AppConfig.period,
    });

    const validateResult = totp.validate({
        token,
        window: AppConfig.window
    });
    if (!Number.isInteger(validateResult)) throw new Error('Token is invalid');

    await client.twoFactorApp.update({
        where: { id: dbApp.id },
        data: { verified: true }
    });
    if (dbApp.user.twoFAEnabled === false) {
        await client.user.update({
            where: { id: dbApp.user.id },
            data: {
                twoFAEnabled: true,
                default2FAMethod: dbApp.id
            }
        });
    }
    await logAudit(true, `2FA app verified (${appId})`);
    return { success: true };
}));
