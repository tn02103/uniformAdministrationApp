import { prisma } from "@/lib/db";
import { Deficiency } from "@/types/deficiencyTypes";
import { PrismaClient, PrismaPromise } from "@prisma/client";

export class CadetInspectionDBHandler {
    getActiveInspection = (fk_assosiation: string) => prisma.inspection.findFirst({
        where: {
            active: true,
            fk_assosiation,
        }
    });

    getDBCadetInspection = (fk_cadet: string, fk_inspection: string) => prisma.cadetInspection.findUnique({
        where: {
            fk_inspection_fk_cadet: {
                fk_inspection, fk_cadet
            }
        }
    });

    getUnresolvedDeficienciesByCadet = (fk_cadet: string) =>
        prisma.$queryRaw`
            SELECT * FROM "v_active_deficiency_by_cadet" 
             WHERE fk_cadet = ${fk_cadet}
          ORDER BY "dateCreated"
        `;

    getPreviouslyUnresolvedDeficiencies = (cadetId: string, activeInspectionId: string, date: Date): PrismaPromise<Deficiency[]> => prisma.$queryRaw`
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
        ORDER BY vdgl."dateCreated"
        
    `

    getCadetDeficienciesFromInspection = (cadetId: string, activeInspectionId: string): PrismaPromise<Deficiency[]> => prisma.$queryRaw`
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
    getUniformLabel = (id: string, fk_assosiation: string) => prisma.uniform.findUniqueOrThrow({
        where: {
            id,
            AND: { type: { fk_assosiation } }
        },
        include: {
            type: true,
        }
    }).then(d => `${d.type.name}-${d.number}`);

    getMaterialLabel = (id: string, fk_assosiation: string) => prisma.material.findUniqueOrThrow({
        where: {
            id,
            AND: { materialGroup: { fk_assosiation } },
        },
        include: { materialGroup: true }
    }).then(d => `${d.materialGroup.description}-${d.typename}`);

    upsertCadetInspection = (cadetId: string, inspectionId: string, uniformComplete: boolean, client: PrismaClient) => client.cadetInspection.upsert({
        where: {
            fk_inspection_fk_cadet: {
                fk_inspection: inspectionId,
                fk_cadet: cadetId,
            }
        },
        update: {
            uniformComplete: uniformComplete
        },
        create: {
            fk_cadet: cadetId,
            fk_inspection: inspectionId,
            uniformComplete: uniformComplete,
        }
    });

    resolveDeficiencies = (idsToResolve: string[], inspectionId: string, username: string, fk_assosiation: string, client: PrismaClient) => client.deficiency.updateMany({
        where: {
            id: { in: idsToResolve },
            DeficiencyType: { fk_assosiation }
        },
        data: {
            dateResolved: new Date(),
            userResolved: username,
            fk_inspection_resolved: inspectionId
        }
    });

    unresolveDeficiencies = (idsToUnsolve: string[], fk_assosiation: string, client: PrismaClient) => client.deficiency.updateMany({
        where: {
            id: { in: idsToUnsolve },
            DeficiencyType: { fk_assosiation }
        },
        data: {
            dateResolved: null,
            userResolved: null,
            fk_inspection_resolved: null,
        }
    });

    upsertDeficiency = (deficiency: Deficiency, username: string, fk_assosiation: string, client: PrismaClient, inspectionId?: string) => client.deficiency.upsert({
        where: {
            id: deficiency.id ?? "",
            AND: { DeficiencyType: { fk_assosiation } }
        },
        create: {
            fk_deficiencyType: deficiency.typeId,
            description: deficiency.description,
            comment: deficiency.comment,
            userCreated: username,
            userUpdated: username,
            fk_inspection_created: inspectionId,
        },
        update: {
            description: deficiency.description,
            comment: deficiency.comment,
            userUpdated: username,
            dateUpdated: new Date(),
        }
    });

    upsertDeficiencyUniform = (deficiencyId: string, fk_uniform: string, client: PrismaClient) => client.deficiencyUniform.upsert({
        where: { deficiencyId },
        create: {
            deficiencyId,
            fk_uniform
        },
        update: {
            fk_uniform
        }
    });

    upsertDeficiencyCadet = (
        deficiencyId: string,
        { fk_cadet, fk_material, fk_uniform }: {
            fk_cadet: string,
            fk_material?: string,
            fk_uniform?: string,
        },
        client: PrismaClient
    ) => client.deficiencyCadet.upsert({
        where: { deficiencyId },
        create: {
            deficiencyId,
            fk_cadet,
            fk_material,
            fk_uniform
        },
        update: {
            fk_material,
            fk_uniform,
        }
    });

    deleteNewDeficiencies = (idList: string[], fk_assosiation: string, client: PrismaClient) => client.deficiency.deleteMany({
        where: {
            id: {
                in: idList
            },
            DeficiencyType: { fk_assosiation }
        }
    });
}
