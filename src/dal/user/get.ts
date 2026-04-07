import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { userArgs } from "@/types/userTypes";

/**
 * Returns all non-deleted users belonging to the caller's organisation.
 *
 * - Requires `AuthRole.admin`.
 * - Automatically scopes results to the caller's `organisationId` — users from other
 *   organisations are never included.
 * - Excludes soft-deleted users (`recDelete: null` filter).
 * - Result shape is defined by `userArgs` (includes `email` and all displayable profile fields).
 *
 * @returns Array of `User` objects for the caller's organisation. Empty array if none exist.
 */
export const getUserList = () =>
    genericSANoDataValidator(AuthRole.admin)
        .then(([{ organisationId }]) =>
            prisma.user.findMany({
                where: { organisationId, recDelete: null },
                ...userArgs,
            })
        );
