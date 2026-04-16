import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { adminDisableUserTwoFASchema, AdminDisableUserTwoFAInput } from "@/zod/auth";
import { getIPAddress, logSecurityAuditEntry } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { headers } from "next/headers";
import { userAgent } from "next/server";

/**
 * Admin: force-disables 2FA for a target user within the admin's organisation.
 *
 * Sets `twoFAEnabled = false` and `default2FAMethod = null`.
 * Does NOT delete existing TwoFactorApp records.
 *
 * @param data - `{ userId: string }` — UUID of the target user.
 * @returns `{ success: true }` on success.
 */
export const adminDisableUserTwoFA = (data: AdminDisableUserTwoFAInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        adminDisableUserTwoFASchema,
        { userId: data.userId },
    ).then(async ([admin, { userId }]) => {
        const headerList = await headers();
        const ipAddress = getIPAddress(headerList);
        const agent = userAgent({ headers: headerList });

        await prisma.user.update({
            where: { id: userId, organisationId: admin.organisationId },
            data: { twoFAEnabled: false, default2FAMethod: null },
        });

        await logSecurityAuditEntry({
            action: "ADMIN_DISABLE_2FA",
            debugLevel: LogDebugLevel.SUCCESS,
            userId: admin.id,
            organisationId: admin.organisationId,
            ipAddress,
            userAgent: agent,
            success: true,
            details: `Admin ${admin.id} force-disabled 2FA for user ${userId}`,
        });

        return { success: true as const };
    });
