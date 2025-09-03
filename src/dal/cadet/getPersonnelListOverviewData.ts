"use server"

import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { PersonnelListCadet } from "@/types/globalCadetTypes";
import { z } from "zod";
import { getInspectionState } from "../inspection/state";

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
    
    let joins = "";
    let where = "";
    let order = "";
    if (exclude?.exclDeregistrations) {
        joins += `
            LEFT JOIN inspection.deregistration d 
                   ON d.fk_cadet = v.id
                  AND d.fk_inspection = '${exclude.inspectionId}'
        `;
        where += `
            AND d.fk_cadet IS NULL
        `;
    }
    if (exclude?.exclInspected) {
        joins += `
            LEFT JOIN inspection.cadet_inspection ci
                   ON ci.fk_cadet = v.id
                  AND ci.fk_inspection = '${exclude.inspectionId}'
        `;
        where += `
            AND ci.id IS NULL
        `;
    }
    if (orderBy === "lastname") {
        order = `lastname ${getAsc(asc)}, firstname ${getAsc(asc)}`;
    } else {
        order = `firstname ${getAsc(asc)}, lastname ${getAsc(asc)}`;
    }


    const sql = `
        SELECT v.*
          FROM base.v_cadet_generaloverview v
               ${joins}
         WHERE organisationId = '${organisationId}'
               ${where}
      ORDER BY ${order}
    `;

    return prisma.$queryRawUnsafe<PersonnelListCadet[]>(sql)
        .then((value) => value.map(
            (line) => ({
                ...line,
                activeDeficiencyCount: Number(line.activeDeficiencyCount), // Parse Bigints
            })
        ));
}
