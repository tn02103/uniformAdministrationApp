import { genericSAValidator } from "@/actions/validations";
import { getIPAddress, logSecurityAuditEntry } from "@/dal/auth/helper";
import { LogDebugLevel } from "@/dal/auth/LogDebugLeve.enum";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { AdminTriggerPasswordResetInput, AdminTriggerPasswordResetSchema } from "@/zod/user";
import { hash } from "bcrypt";
import { randomInt } from "crypto";
import { headers } from "next/headers";
import { userAgent } from "next/server";

// Excludes visually ambiguous characters: 0, 1, O, I, l
const TEMP_PASSWORD_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';

export function generateTempPassword(): string {
    const chars = Array.from({ length: 10 }, () => TEMP_PASSWORD_ALPHABET[randomInt(TEMP_PASSWORD_ALPHABET.length)]);
    return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
}

export const adminTriggerPasswordReset = (data: AdminTriggerPasswordResetInput) =>
    genericSAValidator(AuthRole.admin, data, AdminTriggerPasswordResetSchema, { userId: data.id })
        .then(async ([{ organisationId }, { id: userId }]) => {
            const headerList = await headers();
            const ipAddress = getIPAddress(headerList);
            const agent = userAgent({ headers: headerList });

            const tempPassword = generateTempPassword();
            const hashedPassword = await hash(tempPassword, 12);

            try {
                await prisma.$transaction([
                    prisma.refreshToken.updateMany({
                        where: { userId, status: "active" },
                        data: { status: "revoked" },
                    }),
                    prisma.session.updateMany({
                        where: { device: { userId }, valid: true },
                        data: { valid: false },
                    }),
                    prisma.user.update({
                        where: { id: userId, organisationId },
                        data: { password: hashedPassword, changePasswordOnLogin: true, failedLoginCount: 0 },
                    }),
                ]);

                await logSecurityAuditEntry({
                    action: "ADMIN_PASSWORD_RESET",
                    success: true,
                    debugLevel: LogDebugLevel.SUCCESS,
                    userId,
                    organisationId,
                    ipAddress,
                    userAgent: agent,
                    details: "Admin triggered password reset: sessions revoked, temp password set",
                });

                return { success: true as const, tempPassword };
            } catch (error) {
                await logSecurityAuditEntry({
                    action: "ADMIN_PASSWORD_RESET",
                    success: false,
                    debugLevel: LogDebugLevel.WARNING,
                    userId,
                    organisationId,
                    ipAddress,
                    userAgent: agent,
                    details: "Admin triggered password reset: unexpected error",
                });
                throw error;
            }
        });
