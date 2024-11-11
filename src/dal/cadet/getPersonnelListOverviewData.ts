import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { PersonnelListCadet } from "@/types/globalCadetTypes";
import { z } from "zod";
import { getInspectionState } from "../inspection/state";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const getPersonnelListPropShema = z.object({
    orderBy: z.enum(['lastname', 'firstname']),
    asc: z.boolean(),
    include: z.object({
        deregistered: z.boolean(),
        inspected: z.boolean(),
    }).partial(),
});
type getPersonnelListPropShema = z.infer<typeof getPersonnelListPropShema>;
export const getPersonnelListOverviewData = (props: getPersonnelListPropShema): Promise<PersonnelListCadet[]> => genericSAValidator(
    AuthRole.user,
    props,
    getPersonnelListPropShema,
).then(async ([{ orderBy, asc, include }, { assosiation, role }]) => {
    const inspectionState = await getInspectionState();
    if (role < AuthRole.inspector) {
        return getRestrictedPersonnelList(
            assosiation,
            orderBy,
            asc ? "asc" : "desc",
        );
    } else {
        return getPersonnelList(
            assosiation,
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

const getRestrictedPersonnelList = (fk_assosiation: string, orderBy: "lastname" | "firstname", asc: "asc" | "desc"): Promise<PersonnelListCadet[]> => {
    return prisma.cadet.findMany({
        select: {
            id: true,
            firstname: true,
            lastname: true,
        },
        where: {
            fk_assosiation,
            recdelete: null,
        },
        orderBy: (orderBy === "lastname")
            ? [{ lastname: asc }, { firstname: asc }]
            : [{ firstname: asc }, { lastname: asc }]
    });
};
// Export to view
const getPersonnelList = async (fk_assosiation: string, orderBy: "lastname" | "firstname", asc: boolean, exclude?: { inspectionId: string, exclDeregistrations?: boolean, exclInspected?: boolean }): Promise<PersonnelListCadet[]> => {
    let joins = "";
    let where = "";
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
    const sql = `
        SELECT v.*
          FROM base.v_cadet_generaloverview v
               ${joins}
         WHERE fk_assosiation = '${fk_assosiation}'
               ${where}
      ORDER BY ${(orderBy === "lastname") ? "lastname" : "firstname"} ${asc ? "asc" : "desc"}
    `;

    return prisma.$queryRawUnsafe<PersonnelListCadet[]>(sql)
        .then((value) => value.map(
            (line) => ({
                ...line,
                activeDeficiencyCount: Number(line.activeDeficiencyCount), // Parse Bigints
            })
        ));
}