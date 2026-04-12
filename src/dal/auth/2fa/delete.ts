import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { removeVerifiedTwoFactorAppSchema, RemoveVerifiedTwoFactorAppInput } from "@/zod/auth";
import { getIPAddress, logSecurityAuditEntry } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { headers } from "next/headers";
import { userAgent } from "next/server";

/**
 * Removes a TOTP app (verified or unverified) belonging to the current user.
 *
 * If the deleted app was the current default 2FA method, the default is
 * automatically reassigned to the most recently verified remaining app, or
 * reset to `"email"` if none remain.
 *
 * @param data - `{ appId: string }` — UUID of the TOTP app to remove.
 * @returns `{ success: true }` on success.
 * @throws {Error} If the app is not found or does not belong to the current user.
 */
export const removeVerifiedTwoFactorApp = async (data: RemoveVerifiedTwoFactorAppInput) =>
    genericSAValidator(
        AuthRole.user,
        data,
        removeVerifiedTwoFactorAppSchema,
    ).then(async ([user, { appId }]) => {
        const headerList = await headers();
        const ipAddress = getIPAddress(headerList);
        const agent = userAgent({ headers: headerList });

        const logBase = {
            action: "REMOVE_2FA_APP" as const,
            userId: user.id,
            organisationId: user.organisationId,
            ipAddress,
            userAgent: agent,
        };

        return prisma.$transaction(async (tx) => {
            const app = await tx.twoFactorApp.findUnique({
                where: { id: appId },
                select: { id: true, userId: true, verifiedAt: true },
            });

            if (!app) {
                await logSecurityAuditEntry({ ...logBase, debugLevel: LogDebugLevel.WARNING, success: false, details: `Remove 2FA app failed: app ${appId} not found` });
                throw new Error("Two-factor app not found");
            }
            if (app.userId !== user.id) {
                await logSecurityAuditEntry({ ...logBase, debugLevel: LogDebugLevel.WARNING, success: false, details: `Remove 2FA app failed: app ${appId} belongs to a different user` });
                throw new Error("Two-factor app does not belong to the current user");
            }

            const dbUser = await tx.user.findUnique({
                where: { id: user.id, organisationId: user.organisationId },
                select: {
                    default2FAMethod: true,
                },
            });

            await tx.twoFactorApp.delete({ where: { id: appId, userId: user.id } });

            // Only update defaultMethod if the deleted app was the current default
            if (dbUser?.default2FAMethod === appId) {
                // Find remaining verified apps ordered by verifiedAt desc → last used is first
                const remainingApps = await tx.twoFactorApp.findMany({
                    where: { userId: user.id, verifiedAt: { not: null } },
                    orderBy: { verifiedAt: "desc" },
                    select: { id: true },
                });

                const newDefault = remainingApps.length > 0 ? remainingApps[0].id : "email";

                await tx.user.update({
                    where: { id: user.id, organisationId: user.organisationId },
                    data: { default2FAMethod: newDefault },
                });
            }

            await logSecurityAuditEntry({ ...logBase, debugLevel: LogDebugLevel.SUCCESS, success: true, details: `2FA app ${appId} removed successfully` });

            return { success: true };
        });
    });
