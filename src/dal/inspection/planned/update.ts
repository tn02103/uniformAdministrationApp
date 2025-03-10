"use server";

import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { plannedInspectionFormShema } from "@/zod/inspection";
import { z } from "zod";
import { PlannedInspectionDBQuery } from "./_dbQuerys";
import SaveDataException from "@/errors/SaveDataException";
import dayjs from "dayjs";

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
).then(async ([{ assosiation }, { id, data }]) => prisma.$transaction(async (client) => {
    const inspList = await client.inspection.findMany({
        where: {
            fk_assosiation: assosiation,
            id: { not: id }
        }
    });
    if (inspList.find(i => i.name === data.name)) {
        throw new SaveDataException('Could not save Inspection. Name is duplicated');
    }
    if (inspList.find(i => dayjs(i.date).isSame(data.date, "day"))) {
        throw new SaveDataException('Could not save Inspection. Date is duplicated');
    }

    const inspection = await client.inspection.findUnique({ where: { id } });
    if (inspection?.timeStart) {
        throw new SaveDataException('Could not save Inspection. Inspection started');
    }
    await client.inspection.update({
        where: { id },
        data,
    });

    return dbQuery.plannedInspectionListQuery(assosiation, client);
}));
