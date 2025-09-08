import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { User, userArgs } from "@/types/userTypes";


export const getList = async (): Promise<User[]> => genericSANoDataValidator(AuthRole.admin).then(([{organisationId}]) => {
    return prisma.user.findMany({
        ...userArgs,
        where: {
            organisationId,
            recDelete: null,
        },
    });
});