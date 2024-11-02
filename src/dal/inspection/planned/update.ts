"use server";

import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { plannedInspectionFormShema } from "@/zod/inspection";
import { z } from "zod";
import { PlannedInspectionDBQuery } from "./_dbQuerys";

const dbQuery = new PlannedInspectionDBQuery();

// Zod
const propSchema = z.object({
    id: z.string().uuid(),
    data: plannedInspectionFormShema,
});
type propSchema = z.infer<typeof propSchema>;

/**
 * Updates Name and Date of an planned Inspection. 
 * Inspection must not been started
 * @requires AuthRole.materialManager
 * @param props id & data of plannedInspectionFormSchema,
 * @returns 
 */
export const updatePlannedInspection = (props: propSchema) => genericSAValidator(
    AuthRole.materialManager,
    props,
    propSchema,
    { inspectionId: props.id }
).then(async ([{ id, data }, { assosiation }]) => prisma.$transaction(async (client) => {
    const nameDuplication = await client.inspection.findFirst({
        where: {
            fk_assosiation: assosiation,
            name: data.name,
            id: { not: id }
        }
    });
    if (nameDuplication) {
        throw new Error('Could not save Inspection. Name is duplicated')
    }

    const inspection = await client.inspection.findUnique({ where: { id } });
    if (inspection?.timeStart) {
        throw new Error('Name and Date of Inspections that have been started can not be updated');
    }
    await client.inspection.update({
        where: { id },
        data,
    });

    return dbQuery.plannedInspectionListQuery(assosiation, client);
}));
