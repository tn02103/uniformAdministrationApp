"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { genericSAValidatior, genericSAValidatiorV2 } from "../validations";
import { prisma } from "@/lib/db";
import { CadetInspection, Deficiency } from "@/types/deficiencyTypes";
import { PrismaPromise } from "@prisma/client";
import { uuidValidationPattern } from "@/lib/validations";



export const getUnresolvedDeficienciesByCadet = async (cadetId: string): Promise<Deficiency[]> => genericSAValidatiorV2(
    AuthRole.inspector,
    uuidValidationPattern.test(cadetId),
    { cadetId }
).then(async ({ assosiation }) => prisma.$queryRaw`
    SELECT * FROM "v_active_deficiency_by_cadet" 
     WHERE fk_cadet = ${cadetId}
     ORDER BY "dateCreated"
     
`);

export const getCadetInspection = async (cadetId: string): Promise<CadetInspection | null> => genericSAValidatiorV2(
    AuthRole.inspector,
    uuidValidationPattern.test(cadetId),
    { cadetId }
).then(async ({ assosiation }) => {
    const activeInspection = await prisma.inspection.findFirst({
        where: {
            active: true,
            fk_assosiation: assosiation,
        }
    });
    if (!activeInspection)
        return null;

    const data = await prisma.$transaction([
        prisma.cadetInspection.findFirst({
            where: {
                fk_cadet: cadetId,
                fk_inspection: activeInspection.id,
            },
        }),
        // unresolved deficiencies from previous inspections
        getPreviouslyUnresolvedDeficiencies(cadetId, activeInspection.id, activeInspection.date),
        // new deficiencies from this inspection
        getCadetDeficienciesFromInspection(cadetId, activeInspection.id),
    ]);
    if (!data[0]) return null;
    return {
        id: data[0]!.id,
        uniformComplete: data[0]!.uniformComplete,
        oldCadetDeficiencies: data[1] as Deficiency[],
        newCadetDeficiencies: data[2],
    }
})


// PRISMA CALLS
const getPreviouslyUnresolvedDeficiencies = (cadetId: string, activeInspectionId: string, date: Date): PrismaPromise<Deficiency[]> => prisma.$queryRaw`
        SELECT vdgl."id",
                dt."id" as "typeId",
                dt."name" as "typeName",
                vdgl."description",
                vdgl."comment",
                vdgl."dateCreated",
                vdgl."userCreated",
                vdgl."dateUpdated",
                vdgl."userUpdated",
                vdgl."dateResolved",
                vdgl."userResolved",
                vdgl."fk_cadet",
                vdgl."fk_uniform",
                vdgl."fk_material"
           FROM "v_deficiency_genericList" as vdgl
          JOIN "DeficiencyType" dt
            ON dt.id = vdgl."fk_deficiencyType"
         WHERE ((vdgl."fk_inspection_created" IS NULL AND vdgl."dateCreated" < ${date})
                OR (vdgl."fk_inspection_created" != ${activeInspectionId}))
           AND (vdgl."dateResolved" IS NULL
                OR vdgl."fk_inspection_resolved" = ${activeInspectionId})
        AND vdgl.fk_cadet = ${cadetId}
    `

const getCadetDeficienciesFromInspection = (cadetId: string, activeInspectionId: string): PrismaPromise<Deficiency[]> => prisma.$queryRaw`
     SELECT vdgl."id",
            dt."id" as "typeId",
            dt."name" as "typeName",
            vdgl."description",
            vdgl."comment",
            vdgl."dateCreated",
            vdgl."userCreated",
            vdgl."dateUpdated",
            vdgl."userUpdated",
            vdgl."dateResolved",
            vdgl."userResolved",
            vdgl."fk_cadet",
            vdgl."fk_uniform",
            vdgl."fk_material"
       FROM "v_deficiency_genericList" as vdgl
       JOIN "DeficiencyType" dt
         ON dt.id = vdgl."fk_deficiencyType"
      WHERE vdgl."fk_inspection_created" = ${activeInspectionId}
        AND vdgl."fk_cadet" = ${cadetId}
`