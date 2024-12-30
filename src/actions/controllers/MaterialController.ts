"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";
import { AdministrationMaterialGroup } from "@/types/globalMaterialTypes";
import { MaterialDBHandler } from "../dbHandlers/MaterialDBHandler";
import { MaterialGroupDBHandler } from "../dbHandlers/MaterialGroupDBHandler";
import { genericSAValidatorV2 } from "../validations";

const dbGroupHandler = new MaterialGroupDBHandler();
const dbMaterialHandler = new MaterialDBHandler();

/**
 * Gennerell configuration for Materials. Can be used in for all Authroles 
 * @returns Array of all MaterialGroups with Materials. MaterialGroups without any Materials are not included.
 */
export const getMaterialConfiguration = async () => genericSAValidatorV2(AuthRole.user, true, {})
    .then(async ({ assosiation }) => dbGroupHandler.getNormalList(assosiation));

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

/**
 * Configuration of MaterialGroups & Types for Administration of theses. 
 * @returns list of MaterialGroups
 */
export const getMaterialAdministrationConfiguration = (): Promise<AdministrationMaterialGroup[]> => genericSAValidatorV2(
    AuthRole.materialManager,
    true, {}
).then(async ({ assosiation }) => {
    const [groups, issuedQuantities] = await prisma.$transaction([
        dbGroupHandler.getAdminList(assosiation),
        dbGroupHandler.getMaterialIssueCountsByAssosiation(assosiation),
    ]);

    return groups.map(group => ({
        ...group,
        typeList: group.typeList.map(type => ({
            ...type,
            issuedQuantity: issuedQuantities.find(iq => iq.fk_material === type.id)?._sum.quantity ?? 0
        })),
    }));
});
