"use server";

import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { PlannedInspectionDBQuery } from "./_dbQuerys";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import SaveDataException from "@/errors/SaveDataException";

const dbQuery = new PlannedInspectionDBQuery();

/**
 * Used to delete Inspection. Only posible for inspection, that werent active
 * @requires AuthRole.materialManager
 * @param props props is the id of inspection
 * @returns 
 */
export const deleteInspection = (props: string): Promise<PlannedInspectionType[]> => genericSAValidator(
    AuthRole.materialManager,
    props,
    z.string().uuid(),
    { inspectionId: props }
).then(async ([id, { assosiation }]) => prisma.$transaction(async (client) => {
    const inspection = await client.inspection.findUnique({
        where: { id }
    });
    if (inspection?.timeStart) {
        throw new SaveDataException('Inspections that have been started once can not be deleted');
    }

    await client.inspection.delete({
        where: { id }
    });

    return dbQuery.plannedInspectionListQuery(assosiation, client);
}));
