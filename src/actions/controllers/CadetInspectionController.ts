"use server";

import { FormType } from "@/app/[locale]/[acronym]/cadet/[cadetId]/_inspctionTable/card";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { descriptionValidationPattern, uuidValidationPattern } from "@/lib/validations";
import { CadetInspection, Deficiency } from "@/types/deficiencyTypes";
import { PrismaClient } from "@prisma/client";
import { CadetInspectionDBHandler } from "../dbHandlers/CadetInspectionDBHandler";
import { genericSAValidatiorV2 } from "../validations";

const dbHandler = new CadetInspectionDBHandler();
export const getUnresolvedDeficienciesByCadet = async (cadetId: string): Promise<Deficiency[]> => genericSAValidatiorV2(
    AuthRole.inspector,
    uuidValidationPattern.test(cadetId),
    { cadetId }
).then(async () => dbHandler.getUnresolvedDeficienciesByCadet(cadetId));

export const getCadetInspection = async (cadetId: string): Promise<CadetInspection | null> => genericSAValidatiorV2(
    AuthRole.inspector,
    uuidValidationPattern.test(cadetId),
    { cadetId }
).then(async ({ assosiation }) => {
    const activeInspection = await dbHandler.getActiveInspection(assosiation);
    if (!activeInspection)
        return null;

    const data = await prisma.$transaction([
        dbHandler.getDBCadetInspection(cadetId, activeInspection.id),
        // unresolved deficiencies from previous inspections
        dbHandler.getPreviouslyUnresolvedDeficiencies(cadetId, activeInspection.id, activeInspection.date),
        // new deficiencies from this inspection
        dbHandler.getCadetDeficienciesFromInspection(cadetId, activeInspection.id),
    ]);
    if (!data[0]) {
        return {
            id: undefined,
            uniformComplete: false,
            oldCadetDeficiencies: data[1] as Deficiency[],
            newCadetDeficiencies: []
        }
    }
    return {
        id: data[0]!.id,
        uniformComplete: data[0]!.uniformComplete,
        oldCadetDeficiencies: data[1] as Deficiency[],
        newCadetDeficiencies: data[2] as Deficiency[],
    }
});
const saveValidator = (data: FormType) => (
    Object.entries(data.oldDeficiencyList).every(([key, value]) => (
        uuidValidationPattern.test(key)
        && (typeof value === "boolean")
    ))
    && data.newDeficiencyList.every((def) => (
        (!def.id || uuidValidationPattern.test(def.id))
        && uuidValidationPattern.test(def.typeId)
        && (!def.description || descriptionValidationPattern.test(def.description))
        && (!def.fk_uniform || uuidValidationPattern.test(def.fk_uniform))
        && (!def.fk_material || uuidValidationPattern.test(def.fk_material))
    ))
);
export const saveCadetInspection = async (data: FormType, cadetId: string, uniformComplete: boolean) => genericSAValidatiorV2(
    AuthRole.inspector,
    saveValidator(data) && (typeof uniformComplete === "boolean"),
    { cadetId }
).then(async ({ assosiation, username }) => {
    const { oldDeficiencyList, newDeficiencyList } = data;
    // Check if Inspection is active
    const inspection = await dbHandler.getActiveInspection(assosiation);
    if (!inspection) {
        throw new Error("Could not save CadetInspection since no inspection is active");
    }

    // LOADING DATA FROM DATABASE
    let [previousInspectionDeficiencies, activeInspectionDeficiencies]: Deficiency[][] = await prisma.$transaction([
        dbHandler.getPreviouslyUnresolvedDeficiencies(cadetId, inspection.id, inspection.date),
        dbHandler.getCadetDeficienciesFromInspection(cadetId, inspection.id)
    ]);

    await prisma.$transaction(async (client) => {
        // INSERT | UPDATE cadet_inspection
        await dbHandler.upsertCadetInspection(cadetId, inspection.id, uniformComplete, username, client as PrismaClient);

        // RESOLVING OLD DEFICIENCIES
        if (oldDeficiencyList) {
            // -- collecting ids of deficiencies that are to be resolved
            const deficiencyIdsToResolve: string[] = [];
            const deficiencyIdsToUnresolve: string[] = [];
            await Object.entries(oldDeficiencyList)
                .forEach(([id, resolved]) => {
                    const prevDeficiency = previousInspectionDeficiencies.find(d => d.id === id);
                    if (!prevDeficiency) {
                        throw new Error("Failed to find old Deficiency in prevInDefList");
                    }

                    if (resolved) {
                        if (!prevDeficiency.dateResolved) {
                            deficiencyIdsToResolve.push(id);
                        }
                    } else {
                        if (prevDeficiency.dateResolved) {
                            deficiencyIdsToUnresolve.push(id);
                        }
                    }
                });
            // -- resolving & unresolving deficiencies
            if (deficiencyIdsToResolve.length > 0) {
                await dbHandler.resolveDeficiencies(deficiencyIdsToResolve, inspection.id, username, assosiation, client as PrismaClient);
            }
            if (deficiencyIdsToUnresolve.length > 0) {
                await dbHandler.unresolveDeficiencies(deficiencyIdsToUnresolve, assosiation, client as PrismaClient);
            }
        }

        // UPDATE AND CREATE NEW DEFICIENCIES
        await Promise.all(newDeficiencyList.map(async (def) => {
            // -- get data
            const type = await prisma.deficiencyType.findUniqueOrThrow({
                where: {
                    id: def.typeId,
                    AND: {
                        fk_assosiation: assosiation,
                    }
                }
            });
            // -- prepare data
            if (type.dependent === "uniform" || type.relation === "uniform") {
                if (!def.fk_uniform) throw Error("Could not save new Deficiency fk_uniform is missing");
                def.description = await dbHandler.getUniformLabel(def.fk_uniform, assosiation);
            }

            if (type.relation === "material") {
                if (!def.fk_material) throw Error("Could not save new Deficiency fk_material is missing");
                def.description = await dbHandler.getMaterialLabel(def.fk_material, assosiation);
            }

            if (!def.description) throw new Error("Could not save Deficiency description is missing");

            // -- save data
            const dbDef = await dbHandler.upsertDeficiency(def, username, assosiation, client as PrismaClient, inspection.id);
            if (type.dependent === "uniform") {
                await dbHandler.upsertDeficiencyUniform(dbDef.id, def.fk_uniform!, client as PrismaClient);
            } else {
                const data = {
                    fk_cadet: cadetId,
                    fk_uniform: (type.relation === "uniform") ? def.fk_uniform : undefined,
                    fk_material: (type.relation === "material") ? def.fk_material : undefined,
                }

                await dbHandler.upsertDeficiencyCadet(dbDef.id, data, client as PrismaClient);
            }

            // -- remove from list
            if (activeInspectionDeficiencies) {
                activeInspectionDeficiencies = activeInspectionDeficiencies.filter(d => d.id !== dbDef.id);
            }
        }));

        // DELETE deficiencies not removed from list
        if (activeInspectionDeficiencies && activeInspectionDeficiencies.length > 0) {
            await dbHandler.deleteNewDeficiencies(activeInspectionDeficiencies.map(d => d.id!), assosiation, client as PrismaClient);
        }
    });
});
