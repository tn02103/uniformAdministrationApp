"use server";

import { genericSAValidatorV2 } from "@/actions/validations";
import { NullValueException } from "@/errors/LoadDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";
import { CadetMaterialMap } from "@/types/globalCadetTypes";
import { UniformLabel } from "@/types/globalUniformTypes";
import { PrismaClient } from "@/prisma/client";
import { CadetMaterialDBHandler } from "../dbHandlers/CadetMaterialDBHandler";

const dbHandler = new CadetMaterialDBHandler();
export const getCadetMaterialMap = async (cadetId: string): Promise<CadetMaterialMap> => genericSAValidatorV2(
    AuthRole.user,
    uuidValidationPattern.test(cadetId),
    { cadetId }
).then(async ({ assosiation }) => dbHandler.getMaterialMap(cadetId, assosiation));

export const getCadetMaterialList = async (cadetId: string): Promise<UniformLabel[]> => genericSAValidatorV2(
    AuthRole.user,
    uuidValidationPattern.test(cadetId),
    { cadetId }
).then(({ assosiation }) =>
    dbHandler.getMaterialMap(cadetId, assosiation)
).then((map) =>
    Object.values(map).reduce(
        (list: UniformLabel[], matList) => [
            ...list,
            ...matList.map(mat => ({
                id: mat.id,
                description: `${mat.groupName}-${mat.typename}`
            }))
        ],
        []
    )
);

export const issueMaterial = async (cadetId: string, newMaterialId: string, quantity: number, oldMaterialId?: string): Promise<CadetMaterialMap | undefined> => genericSAValidatorV2(
    AuthRole.inspector,
    (uuidValidationPattern.test(cadetId)
        && uuidValidationPattern.test(newMaterialId)
        && (!oldMaterialId || uuidValidationPattern.test(oldMaterialId))
        && Number.isInteger(quantity) && quantity > 0),
    { cadetId, materialId: [newMaterialId, oldMaterialId] }
).then(async ({ assosiation }) => prisma.$transaction(async (prismaCl) => {
    if (oldMaterialId) {
        // IssuedMaterial 
        const matIssued = await dbHandler.getMaterialIssued(cadetId, oldMaterialId, prismaCl as PrismaClient);
        if (!matIssued) {
            throw new NullValueException("Could not find materialIssue entry for old MaterialId", "material", { id: oldMaterialId });
        }
        if (oldMaterialId === newMaterialId && matIssued.quantity === quantity) {
            return;
        }

        // return old material
        await dbHandler.returnMaterial(matIssued.id, matIssued.dateIssued, prismaCl as PrismaClient);
    }

    // issue new Material
    if (newMaterialId) {
        await dbHandler.issueMaterial(newMaterialId, cadetId, quantity, prismaCl as PrismaClient);
    }
    return dbHandler.getMaterialMap(cadetId, assosiation, prismaCl as PrismaClient);
}));

export const returnMaterial = async (cadetId: string, materialId: string): Promise<CadetMaterialMap> => genericSAValidatorV2(
    AuthRole.inspector,
    (uuidValidationPattern.test(cadetId)
        && uuidValidationPattern.test(materialId)),
    { cadetId, materialId }
).then(async ({ assosiation }) => {
    const mi = await dbHandler.getMaterialIssued(cadetId, materialId);

    await dbHandler.returnMaterial(mi.id, mi.dateIssued, prisma);
    return dbHandler.getMaterialMap(cadetId, assosiation);
});
