"use server";

import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { PlannedInspectionFormShema, plannedInspectionFormShema } from "@/zod/inspection";
import { PlannedInspectionDBQuery } from "./_dbQuerys";
import SaveDataException from "@/errors/SaveDataException";
import dayjs from "@/lib/dayjs";


const dbQuery = new PlannedInspectionDBQuery();

/**
 * Used to create a new Inspection. 
 * Date must bei gte today
 * @requires AuthRole.materialManager
 * @param props PlannedInspectionFormSchema includes Name and Date
 * @returns 
 */
export const createInspection = async (props: PlannedInspectionFormShema) => genericSAValidator(
    AuthRole.materialManager,
    props,
    plannedInspectionFormShema,
    {}
).then(async ([user,data]) => prisma.$transaction(async (client) => {
    const inspList = await client.inspection.findMany({
        where: {
            fk_assosiation: user.assosiation,
        }
    });
    if (inspList.find(i => i.name === data.name)) {
        throw new SaveDataException('Could not create inspection. Name already in use');
    }
    if (inspList.find(i => dayjs(i.date).isSame(data.date, "day"))) {
        throw new SaveDataException("Could not create Inspection. Date already in use");
    }

    await client.inspection.create({
        data: {
            ...data,
            fk_assosiation: user.assosiation,
        }
    });
    return dbQuery.plannedInspectionListQuery(user.assosiation, client);
}));
