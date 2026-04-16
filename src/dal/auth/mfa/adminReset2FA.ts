import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { adminRemoveTwoFactorAppSchema, AdminRemoveTwoFactorAppInput } from "@/zod/auth";
import { getIPAddress, logSecurityAuditEntry } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { __unsecuredReassignDefault2FAMethod } from "./delete";
import { headers } from "next/headers";
import { userAgent } from "next/server";

/**
 * Admin: removes a specific TOTP app registered by a target user within the admin's organisation.
 *
 * If the deleted app was the user's default 2FA method, the default is
 * automatically reassigned to the most recently verified remaining app,
 * or reset to `"email"` if none remain.
 *
 * @param data - `{ userId: string; appId: string }` — target user UUID and app UUID.
 * @returns `{ success: true }` on success.
 * @throws {Error} If the app is not found or does not belong to the target user.
 */
export const adminRemoveTwoFactorApp = (data: AdminRemoveTwoFactorAppInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        adminRemoveTwoFactorAppSchema,
        // appId is intentionally absent: TwoFactorApp has no organisationId column and
        // is therefore not supported by OrganisationValidationDataType. Ownership is
        // enforced via the `user: { organisationId }` filter in the subsequent
        // findFirst query, and the `app.userId !== userId` runtime check.
        { userId: data.userId },
    ).then(async ([admin, { userId, appId }]) => {
        const headerList = await headers();
        const ipAddress = getIPAddress(headerList);
        const agent = userAgent({ headers: headerList });

        const logBase = {
            action: "ADMIN_REMOVE_2FA_APP" as const,
            userId: admin.id,
            organisationId: admin.organisationId,
            ipAddress,
            userAgent: agent,
        };

        return prisma.$transaction(async (tx) => {
            const app = await tx.twoFactorApp.findFirst({
                where: { id: appId, user: { organisationId: admin.organisationId } },
                select: { id: true, userId: true },
            });

            if (!app || app.userId !== userId) {
                await logSecurityAuditEntry({ ...logBase, debugLevel: LogDebugLevel.WARNING, success: false, details: `Admin remove 2FA app failed: app ${appId} not found for user ${userId}` });
                throw new Error("Two-factor app not found");
            }

            const dbUser = await tx.user.findUnique({
                where: { id: userId, organisationId: admin.organisationId },
                select: { default2FAMethod: true },
            });

            await tx.twoFactorApp.deleteMany({ where: { id: appId, user: { organisationId: admin.organisationId } } });

            await __unsecuredReassignDefault2FAMethod(
                userId,
                admin.organisationId,
                appId,
                dbUser?.default2FAMethod,
                tx,
            );

            await logSecurityAuditEntry({ ...logBase, debugLevel: LogDebugLevel.SUCCESS, success: true, details: `Admin ${admin.id} removed 2FA app ${appId} from user ${userId}` });

            return { success: true as const };
        });
    });
