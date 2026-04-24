import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { DeficiencyType, deficiencyTypeArgs } from "@/types/deficiencyTypes";

export const getUniformDefTypes = async (): Promise<DeficiencyType[]> => genericSANoDataValidator(
    AuthRole.inspector,
).then(([{ assosiation }]) => prisma.deficiencyType.findMany({
    where: {
        dependent: 'uniform',
        fk_assosiation: assosiation,
        disabledDate: null,
    },
    ...deficiencyTypeArgs
}));

export const getDeficiencyTypeList = async (): Promise<DeficiencyType[]> => genericSANoDataValidator(AuthRole.inspector)
    .then(([{ assosiation }]) => __usecuredGetDeficiencyTypeList(assosiation));

export const __usecuredGetDeficiencyTypeList = async (assosiation: string): Promise<DeficiencyType[]> => prisma.deficiencyType.findMany({
    where: {
        fk_assosiation: assosiation,
        disabledDate: null,
    },
    ...deficiencyTypeArgs,
    orderBy: {
        "name": "asc"
    },
});