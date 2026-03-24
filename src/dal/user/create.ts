import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { CreateUserSchema } from "@/zod/user";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

export const createUser = (data: { username: string; name: string; role: AuthRole; active: boolean; password: string }) =>
    genericSAValidator(AuthRole.admin, data, CreateUserSchema, {})
        .then(async ([{ organisationId }, validatedData]) => {
            const existing = await prisma.user.findFirst({
                where: { organisationId, username: validatedData.username },
            });
            if (existing) {
                return {
                    error: {
                        message: "custom.usernameDuplication.user",
                        formElement: "username",
                    },
                };
            }

            const hashedPassword = await bcrypt.hash(validatedData.password, 12);
            await prisma.user.create({
                data: {
                    username: validatedData.username,
                    email: validatedData.username,
                    name: validatedData.name,
                    role: validatedData.role,
                    active: validatedData.active,
                    password: hashedPassword,
                    organisationId,
                },
            });
            revalidatePath(`/[locale]/${organisationId}/admin/user`, "page");
        });
