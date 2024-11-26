"use server";

import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { descriptionValidationPattern, uuidValidationPattern } from "@/lib/validations";
import { AdministrationMaterialGroup } from "@/types/globalMaterialTypes";
import { revalidatePath } from "next/cache";
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


/**
 * creates new Material of materialGroup.
 * @param materialGroupId 
 * @param name 
 * @param actualQuantity 
 * @param targetQuantity 
 * @returns 
 */
type createMaterialReturnType = Promise<{
    error: {
        message: string,
        formElement: string,
    }
} | void>;
export const createMaterial = (materialGroupId: string, name: string, actualQuantity: number, targetQuantity: number): createMaterialReturnType => genericSAValidatorV2(
    AuthRole.materialManager,
    (uuidValidationPattern.test(materialGroupId)
        && descriptionValidationPattern.test(name)
        && (typeof actualQuantity === "number")
        && (typeof targetQuantity === "number")),
    { materialGroupId }
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const group = await dbGroupHandler.getGroup(materialGroupId, client);

    if (group.typeList.some(t => t.typename === name)) {
        return {
            error: {
                message: "custom.material.typename.duplication",
                formElement: "typename"
            }
        }
    }

    await dbMaterialHandler.create(materialGroupId, name, actualQuantity, targetQuantity, group.typeList.length, client);
    revalidatePath(`/[locale]/${assosiation}/admin/material`, 'page');
}));

/**
 * moves Material up or down by one spot. Revalidates MaterialAdminPage
 * @param materialId 
 * @param up 
 * @returns 
 */
export const changeMaterialSortOrder = (materialId: string, up: boolean) => genericSAValidatorV2(
    AuthRole.materialManager,
    (uuidValidationPattern.test(materialId)
        && (typeof up === "boolean")),
    { materialId }
).then(async ({ assosiation }) => prisma.$transaction(async (client) => {
    const material = await prisma.material.findUniqueOrThrow({ where: { id: materialId } });
    const group = await dbGroupHandler.getGroup(material.fk_materialGroup, client);

    const newSortOrder = up ? (material.sortOrder - 1) : (material.sortOrder + 1);
    const seccondMaterial = group.typeList.find(t => t.sortOrder === newSortOrder);

    if (!seccondMaterial) {
        throw new SaveDataException('Could not find seccond Material');
    }

    await dbMaterialHandler.updateSortOrderById(materialId, up, client);
    await dbMaterialHandler.updateSortOrderById(seccondMaterial.id, !up, client);

    revalidatePath(`/[locale]/${assosiation}/admin/material`, 'page');
}));

/**
 * Updates data of Material
 * @param materialId 
 * @param typename 
 * @param actualQuantity 
 * @param targetQuantity 
 * @returns 
 */

type updateMaterialReturnType = {
    error: {
        message: string,
        formElement?: string,
    }
} | void;
export const updateMaterial = (materialId: string, typename: string, actualQuantity: number, targetQuantity: number): Promise<updateMaterialReturnType> => genericSAValidatorV2(
    AuthRole.materialManager,
    (uuidValidationPattern.test(materialId)
        && descriptionValidationPattern.test(typename)
        && (typeof actualQuantity === "number")
        && (typeof targetQuantity === "number")),
    { materialId }
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const material = await prisma.material.findUniqueOrThrow({ where: { id: materialId } });
    const group = await dbGroupHandler.getGroup(material.fk_materialGroup, client);

    if (group.typeList.some(t => (t.id !== materialId) && (t.typename === typename))) {
        return {
            error: {
                message: "custom.material.typename.duplication",
                formElement: "typename"
            }
        }
    }

    await dbMaterialHandler.update(materialId, typename, actualQuantity, targetQuantity, client);
    revalidatePath(`/[locale]/${assosiation}/admin/material`, 'page');
}));

/**
 * 
 * @param materialId 
 * @returns 
 */
export const deleteMaterial = (materialId: string) => genericSAValidatorV2(
    AuthRole.materialManager,
    (uuidValidationPattern.test(materialId)),
    { materialId }
).then(({ username, assosiation }) => prisma.$transaction(async (client) => {
    const material = await prisma.material.findUniqueOrThrow({ where: { id: materialId } });

    await dbMaterialHandler.returnAllById(materialId, client);
    await dbMaterialHandler.deleteById(materialId, username, client);
    await dbMaterialHandler.closeSortOrderGap(material.fk_materialGroup, material.sortOrder, client);

    revalidatePath(`/[locale]/${assosiation}/admin/material`, 'page');
}));
