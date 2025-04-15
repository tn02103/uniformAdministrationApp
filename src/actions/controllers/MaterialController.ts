"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";
import { genericSAValidatorV2 } from "../validations";

/**
 * Used to get Id of the MaterialGroup, the Material belongs to.
 * @param materialId 
 * @returns Id of MaterialGroup
 */
export const getMaterialGroupIdByTypeId = async (materialId: string): Promise<string> => genericSAValidatorV2(
    AuthRole.user,
    uuidValidationPattern.test(materialId),
    { materialId }
).then(async () => prisma.material.findUnique({
    select: { fk_materialGroup: true },
    where: { id: materialId },
})).then(data => data!.fk_materialGroup);
