import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { ChangePasswordSchema, UpdateUserSchema } from "@/zod/user";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

export const updateUser = (data: { userId: string; name: string; role: AuthRole; active: boolean }) =>
    genericSAValidator(AuthRole.admin, data, UpdateUserSchema, { userId: data.userId })
        .then(async ([{ organisationId }, { userId, name, role, active }]) => {
            await prisma.user.update({
                where: { id: userId, organisationId },
                data: { name, role, active, failedLoginCount: 0 },
            });
            revalidatePath(`/[locale]/${organisationId}/admin/user`, "page");
        });

export const changeUserPassword = (data: { userId: string; password: string }) =>
    genericSAValidator(AuthRole.admin, data, ChangePasswordSchema, { userId: data.userId })
        .then(async ([{ organisationId }, { userId, password }]) => {
            const hashedPassword = await bcrypt.hash(password, 12);
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: userId, organisationId },
                    data: { password: hashedPassword },
                }),
                prisma.refreshToken.deleteMany({
                    where: { userId },
                }),
            ]);
            revalidatePath(`/[locale]/${organisationId}/admin/user`, "page");
        });
