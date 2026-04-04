import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { userArgs } from "@/types/userTypes";

export const getUserList = () =>
    genericSANoDataValidator(AuthRole.admin)
        .then(([{ organisationId }]) =>
            prisma.user.findMany({
                where: { organisationId, recDelete: null },
                ...userArgs,
            })
        );
