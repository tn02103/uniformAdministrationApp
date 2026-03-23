"use server"

import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { PersonnelListCadet } from "@/types/globalCadetTypes";
import { z } from "zod";
import { getInspectionState } from "../inspection/state";
import { CadetWhereInput } from "@/prisma/models";

const getPersonnelListPropSchema = z.object({
    orderBy: z.enum(['lastname', 'firstname']),
    asc: z.boolean(),
    include: z.object({
        deregistered: z.boolean(),
        inspected: z.boolean(),
    }).partial(),
});
type getPersonnelListPropSchema = z.infer<typeof getPersonnelListPropSchema>;
export const getPersonnelListOverviewData = async (props: getPersonnelListPropSchema): Promise<PersonnelListCadet[]> => genericSAValidator(
    AuthRole.user,
    props,
    getPersonnelListPropSchema,
).then(async ([{ organisationId, role }, { orderBy, asc, include }]) => {
    const inspectionState = await getInspectionState();
    if (role < AuthRole.inspector) {
        return getRestrictedPersonnelList(
            organisationId,
            orderBy,
            asc ? "asc" : "desc",
        );
    } else {
        return getPersonnelList(
            organisationId,
            orderBy,
            asc,
            inspectionState?.active ? {
                inspectionId: inspectionState.id,
                exclDeregistrations: !include.deregistered,
                exclInspected: !include.inspected
            } : undefined
        );
    }
});

const getRestrictedPersonnelList = (organisationId: string, orderBy: "lastname" | "firstname", asc: "asc" | "desc"): Promise<PersonnelListCadet[]> => {
    return prisma.cadet.findMany({
        select: {
            id: true,
            firstname: true,
            lastname: true,
        },
        where: {
            organisationId,
            recdelete: null,
        },
        orderBy: (orderBy === "lastname")
            ? [{ lastname: asc }, { firstname: asc }]
            : [{ firstname: asc }, { lastname: asc }]
    });
};
// Export to view
const getPersonnelList = async (organisationId: string, orderBy: "lastname" | "firstname", asc: boolean, exclude?: { inspectionId: string, exclDeregistrations?: boolean, exclInspected?: boolean }): Promise<PersonnelListCadet[]> => {
    const getAsc = (asc: boolean): "asc" | "desc" => asc ? "asc" : "desc";

    const cadetWhereClause: CadetWhereInput = {};
    if (exclude?.exclDeregistrations) {
        cadetWhereClause.deregistrations = {
            none: { fk_inspection: exclude.inspectionId }
        };
    }

    if (exclude?.exclInspected) {
        cadetWhereClause.cadetInspection = {
            none: { fk_inspection: exclude.inspectionId }
        };
    }

    const orderByClause = orderBy === "lastname"
        ? [{ lastname: getAsc(asc) }, { firstname: getAsc(asc) }]
        : [{ firstname: getAsc(asc) }, { lastname: getAsc(asc) }];

    return prisma.vCadetGeneraloverview.findMany({
        where: {
            organisationId,
            Cadet: cadetWhereClause,
        },
        orderBy: orderByClause,
    }).then(list => list.map(item => ({
        id: item.id,
        firstname: item.firstname,
        lastname: item.lastname,
        lastInspection: item.lastInspection ? new Date(item.lastInspection) : undefined,
        activeDeficiencyCount: Number(item.activeDeficiencyCount),
        uniformComplete: item.uniformComplete ?? undefined,
    })));
}
