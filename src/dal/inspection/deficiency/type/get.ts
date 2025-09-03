import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { DeficiencyType, deficiencyTypeArgs } from "@/types/deficiencyTypes";

export const getUniformDefTypes = async (): Promise<DeficiencyType[]> => genericSANoDataValidator(
    AuthRole.inspector,
).then(([{ organisationId }]) => prisma.deficiencyType.findMany({
    where: {
        dependent: 'uniform',
        organisationId,
    },
    ...deficiencyTypeArgs
}));
