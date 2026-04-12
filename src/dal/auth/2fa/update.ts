import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import {
    setDefault2FAMethodSchema,
    SetDefault2FAMethodInput,
    toggleUserTwoFASchema,
    ToggleUserTwoFAInput,
} from "@/zod/auth";
import { getIPAddress, logSecurityAuditEntry } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { headers } from "next/headers";
import { userAgent } from "next/server";

/**
 * Sets the default 2FA delivery method for the current user.
 *
 * @param data - `{ method: string }` — Either `"email"` or the UUID of a verified TOTP app.
 * @throws {Error} If the supplied app ID is not found, not verified, or belongs to another user.
 */
export const setDefault2FAMethod = async (data: SetDefault2FAMethodInput) =>
    genericSAValidator(
        AuthRole.user,
        data,
        setDefault2FAMethodSchema,
    ).then(async ([user, { method }]) => {
        const headerList = await headers();
        const ipAddress = getIPAddress(headerList);
        const agent = userAgent({ headers: headerList });

        const logBase = {
            action: "SET_DEFAULT_2FA_METHOD" as const,
            userId: user.id,
            organisationId: user.organisationId,
            ipAddress,
            userAgent: agent,
        };

        if (method !== "email") {
            const app = await prisma.twoFactorApp.findUnique({
                where: { id: method, userId: user.id },
                select: { id: true, userId: true, verifiedAt: true },
            });

            if (!app || app.verifiedAt === null || app.userId !== user.id) {
                await logSecurityAuditEntry({ ...logBase, debugLevel: LogDebugLevel.WARNING, success: false, details: `Set default 2FA method failed: invalid method ${method}` });
                throw new Error("Invalid 2FA method: app not found or not verified");
            }
        }

        await prisma.user.update({
            where: { id: user.id, organisationId: user.organisationId },
            data: { default2FAMethod: method },
        });

        await logSecurityAuditEntry({ ...logBase, debugLevel: LogDebugLevel.SUCCESS, success: true, details: `Default 2FA method set to ${method === "email" ? "email" : "TOTP app"}` });
    });

/**
 * Enables or disables two-factor authentication for the current user.
 *
 * Disabling is blocked when the organisation rule is `"required"`, or when
 * it is `"administrators"` and the user holds an admin role or higher.
 * On disable, `default2FAMethod` is also reset to `null`.
 *
 * @param data - `{ enabled: boolean }` — `true` to enable, `false` to disable.
 * @throws {Error} If disabling is prevented by the organisation's 2FA policy.
 */
export const toggleUserTwoFA = async (data: ToggleUserTwoFAInput) =>
    genericSAValidator(
        AuthRole.user,
        data,
        toggleUserTwoFASchema,
    ).then(async ([user, { enabled }]) => {
        const headerList = await headers();
        const ipAddress = getIPAddress(headerList);
        const agent = userAgent({ headers: headerList });

        const logBase = {
            action: "TOGGLE_2FA" as const,
            userId: user.id,
            organisationId: user.organisationId,
            ipAddress,
            userAgent: agent,
        };

        if (!enabled) {
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id, organisationId: user.organisationId },
                select: {
                    role: true,
                    organisation: {
                        select: {
                            organisationConfiguration: {
                                select: { twoFactorAuthRule: true },
                            },
                        },
                    },
                },
            });

            const rule = dbUser?.organisation?.organisationConfiguration?.twoFactorAuthRule;

            if (rule === "required") {
                await logSecurityAuditEntry({ ...logBase, debugLevel: LogDebugLevel.WARNING, success: false, details: "Disable 2FA blocked: organisation requires two-factor authentication" });
                throw new Error("Cannot disable 2FA: organisation requires two-factor authentication");
            }

            if (rule === "administrators" && dbUser && dbUser.role >= AuthRole.admin) {
                await logSecurityAuditEntry({ ...logBase, debugLevel: LogDebugLevel.WARNING, success: false, details: "Disable 2FA blocked: administrators are required to use two-factor authentication" });
                throw new Error("Cannot disable 2FA: administrators are required to use two-factor authentication");
            }
        }

        await prisma.user.update({
            where: { id: user.id, organisationId: user.organisationId },
            data: {
                twoFAEnabled: enabled,
                ...(enabled === false ? { default2FAMethod: null } : {}),
            },
        });

        await logSecurityAuditEntry({ ...logBase, debugLevel: LogDebugLevel.SUCCESS, success: true, details: `2FA ${enabled ? "enabled" : "disabled"} successfully` });
    });
