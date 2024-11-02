"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { cadetLableArgs } from "@/types/globalCadetTypes";
import { PlannedInspectionFormShema, plannedInspectionFormShema } from "@/zod/inspection";
import { Prisma } from "@prisma/client";
import { TypeOf, z } from "zod";
import { genericSAValidatiorV2, genericSAValidator } from "../validations";
import SaveDataException from "@/errors/SaveDataException";
import dayjs from "dayjs";


const plannedInspectionTypeArgs = Prisma.validator<Prisma.InspectionFindManyArgs>()({
    include: {
        deregistrations: {
            include: {
                cadet: cadetLableArgs
            },
        },
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
    if (dayjs().isAfter(data.date, "day")) {
        throw new SaveDataException("Could not create Inspection. Date is in the past");
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

const updateCadetRegistrationPropShema = z.object({
    cadetId: z.string().uuid(),
    inspectionId: z.string().uuid(),
    deregister: z.boolean(),
});
type updateCadetRegistrationPropShema = z.infer<typeof updateCadetRegistrationPropShema>
export const updateCadetRegistrationForInspection = (props: updateCadetRegistrationPropShema) => genericSAValidator(
    AuthRole.materialManager,
    props,
    updateCadetRegistrationPropShema,
    { cadetId: props.cadetId, inspectionId: props.inspectionId }
).then(([data,]) => prisma.$transaction(async (client) => {
    const deregistration = await client.deregistration.findUnique({
        where: {
            fk_cadet_fk_inspection: {
                fk_cadet: data.cadetId,
                fk_inspection: data.inspectionId
            }
        }
    });

    if (data.deregister) {
        if (deregistration) return true;

        return client.deregistration.create({
            data: {
                fk_cadet: data.cadetId,
                fk_inspection: data.inspectionId,
            }
        });
    } else {
        if (!deregistration) return true;

        return client.deregistration.delete({
            where: {
                fk_cadet_fk_inspection: {
                    fk_cadet: data.cadetId,
                    fk_inspection: data.inspectionId,
                }
            }
        });
    }
}))