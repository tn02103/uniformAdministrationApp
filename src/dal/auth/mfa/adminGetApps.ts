import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { adminGetUserTwoFactorAppsSchema, AdminGetUserTwoFactorAppsInput } from "@/zod/auth";

/**
 * Returns all TOTP apps registered for a target user within the admin's organisation.
 *
 * @param data - `{ userId: string }` — UUID of the target user.
 * @returns Array of `{ id, appName, createdAt, verifiedAt }` for each registered app.
 */
export const adminGetUserTwoFactorApps = (data: AdminGetUserTwoFactorAppsInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        adminGetUserTwoFactorAppsSchema,
        { userId: data.userId },
    ).then(([admin, { userId }]) =>
        prisma.twoFactorApp.findMany({
            where: { userId, user: { organisationId: admin.organisationId } },
            select: {
                id: true,
                appName: true,
                createdAt: true,
                verifiedAt: true,
            },
        })
    );
