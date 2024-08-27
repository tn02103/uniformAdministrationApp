"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { PlannedInspectionFormShema, plannedInspectionFormShema } from "@/zod/inspection";
import { z } from "zod";
import { genericSAValidatiorV2, genericSAValidator } from "../validations";
import { Prisma } from "@prisma/client";
import { Fredericka_the_Great } from "next/font/google";


const plannedInspectionTypeArgs = Prisma.validator<Prisma.InspectionFindManyArgs>()({
    include: {
        deregistrations: true,
    }
});
export type PlannedInspectionType = Prisma.InspectionGetPayload<typeof plannedInspectionTypeArgs>;

/**
 * Returns a list of all Inspections that are in the future, have not been active, or were not closed corectly.
 * @returns list of Inspections
 */
export const getPlannedInspectionList = (): Promise<PlannedInspectionType[]> => genericSAValidatiorV2(
    AuthRole.materialManager, true, {}
).then(async ({ assosiation }) => plannedInspectionListQuery(assosiation, prisma));

const plannedInspectionListQuery = (fk_assosiation: string, client: Prisma.TransactionClient) =>
    client.inspection.findMany({
        ...plannedInspectionTypeArgs,
        where: {
            fk_assosiation,
            OR: [
                { date: { gte: new Date() } },
                { timeStart: null },
                { timeEnd: null },
            ]
        },
        orderBy: { date: "asc" },
    });

/**
 * Used to create a new Inspection. 
 * Date must bei gte today
 * @requires AuthRole.materialManager
 * @param props PlannedInspectionFormSchema includes Name and Date
 * @returns 
 */
export const createInspection = (props: PlannedInspectionFormShema) => genericSAValidator(
    AuthRole.materialManager,
    props,
    plannedInspectionFormShema,
    {}
).then(async ([data, user]) => prisma.$transaction(async (client) => {
    const insp = await client.inspection.findFirst({
        where: {
            name: data.name,
            fk_assosiation: user.assosiation,
        }
    });
    if (insp) {
        throw new Error('Could not create inspection. Name already in use');
    }

    await client.inspection.create({
        data: {
            ...data,
            fk_assosiation: user.assosiation,
        }
    });
    return plannedInspectionListQuery(user.assosiation, client);
}));

const updatePlannedInspectionPropSchema = z.object({
    id: z.string().uuid(),
    data: plannedInspectionFormShema,
});
type updatePlannedInspectionPropSchema = z.infer<typeof updatePlannedInspectionPropSchema>;
/**
 * Updates Name and Date of an planned Inspection. 
 * Inspection must not been started
 * @requires AuthRole.materialManager
 * @param props id & data of plannedInspectionFormSchema,
 * @returns 
 */
export const updatePlannedInspection = (props: updatePlannedInspectionPropSchema) => genericSAValidator(
    AuthRole.materialManager,
    props,
    updatePlannedInspectionPropSchema,
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

    return plannedInspectionListQuery(assosiation, client);
}));

/**
 * Used to delete Inspection. Only posible for inspection, that werent active
 * @requires AuthRole.materialManager
 * @param props props is the id of inspection
 * @returns 
 */
export const deleteInspection = (props: string) => genericSAValidator(
    AuthRole.materialManager,
    props,
    z.string().uuid(),
    { inspectionId: props }
).then(async ([id, { assosiation }]) => prisma.$transaction(async (client) => {
    const inspection = await client.inspection.findUnique({
        where: { id }
    });
    if (inspection?.timeStart) {
        throw new Error('Inspections that have been started once can not be deleted');
    }

    await client.inspection.delete({
        where: { id }
    });

    return plannedInspectionListQuery(assosiation, client);
}));

