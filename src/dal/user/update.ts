import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { ChangePasswordInput, ChangePasswordSchema, UpdateUserDALInput, UpdateUserDALSchema } from "@/zod/user";
import { hash } from "bcrypt";
import { unsecuredGetUserList } from "./get";

/**
 * Updates an existing user's profile fields within the caller's organisation.
 *
 * - Requires `AuthRole.admin`.
 * - Org-scopes the target user via `userId` validation — cross-org updates are rejected.
 * - Before updating, checks that the new `username` and `email` are not already taken by
 *   a *different* user in the same organisation (parallel transaction). Returns a form-level
 *   error on conflict instead of throwing.
 * - On success, resets `failedLoginCount` to 0 (unlocks any login-lockout state).
 *
 * @param data - Validated payload: `id`, `username`, `email`, `name`, `role`, `active`.
 * @returns `undefined` on success, or one of the following error shapes:
 *   - `{ error: { formElement: "username"; message: "user.username.duplication" } }` — username taken by another user
 *   - `{ error: { formElement: "email"; message: "user.email.duplication" } }` — email taken by another user
 *   - `{ error: { formElement: "role"; message: "user.role.selfChange" } }` — admin tried to change their own role
 * @throws {Error} If the record does not exist or does not belong to the caller's organisation.
 */
export const updateUser = (data: UpdateUserDALInput) =>
    genericSAValidator(AuthRole.admin, data, UpdateUserDALSchema, { userId: data.id })
        .then(async ([{ organisationId, id: sessionUserId }, { id, username, email, name, role, active }]) => {
            if (sessionUserId === id) {
                const currentUser = await prisma.user.findUnique({
                    where: { id, organisationId },
                    select: { role: true },
                });
                if (currentUser && currentUser.role !== role) {
                    return { error: { formElement: "role", message: "user.role.selfChange" } };
                }
            }

            const [usernameExists, emailExists] = await prisma.$transaction([
                prisma.user.findFirst({
                    where: { organisationId, username, NOT: { id } },
                }),
                prisma.user.findFirst({
                    where: { organisationId, email, NOT: { id } },
                }),
            ]);

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

            await prisma.user.update({
                where: { id, organisationId },
                data: { username, email, name, role, active, failedLoginCount: 0 },
            });
            return unsecuredGetUserList(organisationId);
        });

/**
 * Admin-initiated password reset for any user within the caller's organisation.
 *
 * - Requires `AuthRole.admin`.
 * - Org-scopes the target user via `userId` validation — cross-org resets are rejected.
 * - Hashes the new plaintext `password` with bcrypt (12 salt rounds).
 * - In a single transaction: updates the hashed password and deletes all refresh tokens
 *   for the target user, forcing re-authentication on their next request.
 * - Does NOT invalidate existing session records (unlike `changePassword`, which preserves
 *   the caller's own session).
 *
 * @param data - Validated payload: `id` (target user UUID), `password` (new plaintext password).
 * @returns `undefined` on success.
 * @throws {Error} If the record does not exist or does not belong to the caller's organisation.
 */
export const changeUserPassword = (data: ChangePasswordInput) =>
    genericSAValidator(AuthRole.admin, data, ChangePasswordSchema, { userId: data.id })
        .then(async ([{ organisationId }, { id, password }]) => {
            const hashedPassword = await hash(password, 12);
            await prisma.$transaction([
                prisma.user.update({
                    where: { id, organisationId },
                    data: { password: hashedPassword },
                }),
                prisma.refreshToken.deleteMany({
                    where: { userId: id },
                }),
            ]);
        });
