"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { genericSAValidatior, genericSAValidatiorV2 } from "./validations";
import { prisma } from "@/lib/db";
import { materialGroupArgs } from "@/types/globalMaterialTypes";
import { uuidValidationPattern } from "@/lib/validations";

export const getMaterialConfiguration = async () => genericSAValidatior(AuthRole.user, true, [])
    .then(async ({ assosiation }) => prisma.materialGroup.findMany({
        ...materialGroupArgs,
        where: {
            fk_assosiation: assosiation,
            recdelete: null,
            typeList: {
                some: {
                    recdelete: null,
                }
            }
        },
        orderBy: { sortOrder: "asc" }
    }))

export const getMaterialGroupIdByTypeId = async (materialId: string): Promise<string> => genericSAValidatiorV2(
    AuthRole.user,
    uuidValidationPattern.test(materialId),
    { materialId }
).then(async () => prisma.material.findUnique({
    select: { fk_materialGroup: true },
    where: { id: materialId },
})).then(data => data!.fk_materialGroup);