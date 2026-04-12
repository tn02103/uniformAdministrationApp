import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";

/**
 * Returns the full profile data for the currently authenticated user.
 *
 * Includes account details, organisation config (2FA rule), verified TOTP apps
 * ordered by verification date, and registered devices.
 *
 * @returns The user's profile record, or `null` if the user no longer exists.
 */
export const getOwnProfileData = () =>
    genericSANoDataValidator(AuthRole.user)
        .then(([user]) =>
            prisma.user.findUnique({
                where: {
                    id: user.id,
                    organisationId: user.organisationId,
                },
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    role: true,
                    active: true,
                    twoFAEnabled: true,
                    default2FAMethod: true,
                    organisation: {
                        select: {
                            name: true,
                            organisationConfiguration: {
                                select: {
                                    twoFactorAuthRule: true,
                                },
                            },
                        },
                    },
                    twoFactorApps: {
                        where: {
                            verifiedAt: { not: null },
                        },
                        orderBy: {
                            verifiedAt: "asc",
                        },
                        select: {
                            id: true,
                            appName: true,
                            verifiedAt: true,
                        },
                    },
                    devices: {
                        select: {
                            id: true,
                            name: true,
                            createdAt: true,
                            lastUsedAt: true,
                            valid: true,
                        },
                    },
                },
            })
        );
