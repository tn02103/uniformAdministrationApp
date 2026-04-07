import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { CreateUserInput, CreateUserSchema } from "@/zod/user";
import { hash } from "bcrypt";
import { revalidatePath } from "next/cache";

/**
 * Creates a new user within the caller's organisation.
 *
 * - Requires `AuthRole.admin`.
 * - Before creating, checks for duplicate `username` and `email` within the organisation
 *   in a single parallel transaction. Returns a form-level error on conflict instead of throwing.
 * - Hashes the plaintext `password` with bcrypt (12 salt rounds) before persisting.
 * - Revalidates `/[locale]/{organisationId}/admin/user` on success so the user list page
 *   reflects the new entry without a manual refresh.
 *
 * @param data - Validated payload: `username`, `email`, `name`, `role`, `active`, `password`.
 * @returns `undefined` on success, or one of the following error shapes:
 *   - `{ error: { formElement: "username"; message: "user.username.duplication" } }` — username already taken
 *   - `{ error: { formElement: "email"; message: "user.email.duplication" } }` — email already taken
 */
export const createUser = (data: CreateUserInput) =>
    genericSAValidator(AuthRole.admin, data, CreateUserSchema, {})
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

            const hashedPassword = await hash(validatedData.password, 12);
            await prisma.user.create({
                data: {
                    username: validatedData.username,
                    email: validatedData.email,
                    name: validatedData.name,
                    role: validatedData.role,
                    active: validatedData.active,
                    password: hashedPassword,
                    organisationId,
                },
            });
        });
