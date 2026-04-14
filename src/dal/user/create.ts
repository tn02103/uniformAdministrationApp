import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { hash } from "bcrypt";
import { generateTempPassword } from "./passwordReset";
import { UserFormInput, UserFormSchema } from "@/zod/user";

/**
 * Creates a new user within the caller's organisation.
 *
 * - Requires `AuthRole.admin`.
 * - Before creating, checks for duplicate `username` and `email` within the organisation
 *   in a single parallel transaction. Returns a form-level error on conflict instead of throwing.
 * - Hashes the plaintext `password` with bcrypt (12 salt rounds) before persisting.
 *
 * @param data - Validated payload: `username`, `email`, `name`, `role`, `active`.
 * @returns `{success: true, tempPassword: string }` on success, or one of the following error shapes:
 *   - `{ error: { formElement: "username"; message: "user.username.duplication" } }` — username already taken
 *   - `{ error: { formElement: "email"; message: "user.email.duplication" } }` — email already taken
 */
export const createUser = (data: UserFormInput) =>
    genericSAValidator(AuthRole.admin, data, UserFormSchema, {})
        .then(async ([{ organisationId }, validatedData]) => {
            const [usernameExists, emailExists] = await prisma.$transaction([
                prisma.user.findFirst({
                    where: { organisationId, username: validatedData.username },
                }),
                prisma.user.findFirst({
                    where: { organisationId, email: validatedData.email },
                }),
            ])

            if (usernameExists) {
                return {
                    error: {
                        message: "user.username.duplication",
                        formElement: "username",
                    },
                };
            }

            if (emailExists) {
                return {
                    error: {
                        message: "user.email.duplication",
                        formElement: "email",
                    },
                };
            }

            const tempPassword = generateTempPassword();
            const hashedPassword = await hash(tempPassword, 12);
            await prisma.user.create({
                data: {
                    username: validatedData.username,
                    email: validatedData.email,
                    name: validatedData.name,
                    role: validatedData.role,
                    active: validatedData.active,
                    password: hashedPassword,
                    changePasswordOnLogin: true,
                    organisationId,
                },
            });
            return { success: true, tempPassword };
        });
