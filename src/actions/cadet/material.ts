"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { genericSAValidatior } from "../validations";
import { uuidValidationPattern } from "@/lib/validations";
import { prisma } from "@/lib/db";
import { CadetMaterialMap } from "@/types/globalCadetTypes";
import { dbCadetMaterialArgs } from "@/types/globalMaterialTypes";
import { NullValueException } from "@/errors/LoadDataException";
import { isToday } from "date-fns";

export const getcadetMaterialMap = async (cadetId: string) => genericSAValidatior(
    AuthRole.user,
    uuidValidationPattern.test(cadetId),
    [{ value: cadetId, type: "cadet" }]
).then(async ({ assosiation }) => handleCadetMaterialMap(cadetId, assosiation));

const handleCadetMaterialMap = async (cadetId: string, assosiation: string) => {
    // GET DATA
    const list = await prisma.material.findMany({
        select: {
            ...dbCadetMaterialArgs.select,
            issuedEntrys: {
                ...dbCadetMaterialArgs.select.issuedEntrys,
                where: {
                    dateReturned: null,
                    fk_cadet: cadetId,
                }
            }
        },
        where: {
            recdelete: null,
            materialGroup: { fk_assosiation: assosiation },
            issuedEntrys: {
                some: {
                    dateReturned: null,
                    fk_cadet: cadetId,
                }
            }
        },
        orderBy: { sortOrder: "asc" }
    });

    // FORMATT DATA
    const materialMap: CadetMaterialMap = {};
    list.forEach(m => {
        if (!materialMap[m.fk_materialGroup]) {
            materialMap[m.fk_materialGroup] = [];
        }
        materialMap[m.fk_materialGroup].push({
            ...m,
            groupId: m.fk_materialGroup,
            issued: m.issuedEntrys[0].quantity,
        });
    });
    return materialMap;
}

export const issueMaterial = (cadetId: string, newMaterialId: string, quantity: number, oldMaterialId?: string) => genericSAValidatior(
    AuthRole.inspector,
    (uuidValidationPattern.test(cadetId)
        && uuidValidationPattern.test(newMaterialId)
        && (!oldMaterialId || uuidValidationPattern.test(oldMaterialId))
        && Number.isInteger(quantity) && quantity > 0),
    [{ value: cadetId, type: "cadet" },
    { value: newMaterialId, type: "material" },
    { value: oldMaterialId, type: "material" }]
).then(async ({ assosiation }) => {
    await prisma.$transaction(async (prismaCl) => {
        if (oldMaterialId) {
            // IssuedMaterial 
            var matIssued = await prismaCl.materialIssued.findFirstOrThrow({
                where: {
                    fk_cadet: cadetId,
                    fk_material: oldMaterialId,
                    dateReturned: null,
                }
            });
            if (!matIssued) {
                throw new NullValueException("Could not find materialIssue entry for old MaterialId", "material", { id: oldMaterialId });
            }
            if (oldMaterialId === newMaterialId && matIssued.quantity === quantity) {
                return;
            }

            // return old material
            await handleReturn(matIssued.id, matIssued.dateIssued, prismaCl);
        }

        // issue new Material
        if (newMaterialId) {
            await prismaCl.materialIssued.create({
                data: {
                    quantity: quantity,
                    material: {
                        connect: { id: newMaterialId }
                    },
                    cadet: {
                        connect: { id: cadetId }
                    },
                    dateIssued: new Date(),
                }
            });
        }
    });
    return handleCadetMaterialMap(cadetId, assosiation);
});

export const returnMaterial = (cadetId: string, materialId: string): Promise<CadetMaterialMap> => genericSAValidatior(
    AuthRole.inspector,
    (uuidValidationPattern.test(cadetId)
        && uuidValidationPattern.test(materialId)),
    [{ value: cadetId, type: "cadet" },
    { value: materialId, type: "material" }]
).then(async ({ assosiation }) => {
    const mi = await prisma.materialIssued.findFirstOrThrow({
        where: {
            fk_cadet: cadetId,
            fk_material: materialId,
            dateReturned: null,
        }
    });
    await handleReturn(mi.id, mi.dateIssued, prisma);
    return handleCadetMaterialMap(cadetId, assosiation);
});

const handleReturn = async (issuedId: string, dateIssued: Date, prismaCl: any) => {
    if (isToday(dateIssued)) {
        // delete entry
        return prismaCl.materialIssued.delete({
            where: { id: issuedId }
        });
    } else {
        // mark as returned
        return prismaCl.materialIssued.update({
            where: {
                id: issuedId,
            },
            data: {
                dateReturned: new Date(),
            }
        });
    }
}
