import { prisma } from "@/lib/db";
import { PersonnelListCadet, cadetArgs } from "@/types/globalCadetTypes";
import { PrismaClient } from "@prisma/client";

export class CadetDBHandler {
    getCadet = (id: string, client?: PrismaClient) =>
        (client ?? prisma).cadet.findUniqueOrThrow({
            ...cadetArgs,
            where: {
                id
            }
        });

    getRestrictedPersonnelList = (fk_assosiation: string, orderBy: "lastname" | "firstname", asc: "asc" | "desc"): Promise<PersonnelListCadet[]> =>
        prisma.cadet.findMany({
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
        })

    getPersonnelList = (fk_assosiation: string, orderBy: "lastname" | "firstname", asc: boolean): Promise<PersonnelListCadet[]> =>
        prisma.$queryRawUnsafe<PersonnelListCadet[]>(`
                    SELECT c."id",
                           c."firstname",
                           c."lastname",
                           ci."fk_inspection",
                           ci."uniformComplete",
                           i."date" as "lastInspection",
                           COUNT(vadbc."id") as "activeDeficiencyCount"
                      FROM "Cadet" c
                 LEFT JOIN "CadetInspection" ci 
                        ON c."id" = ci."fk_cadet"
                       AND ci."fk_inspection" = (
                                SELECT ii."id"
                                  FROM "Inspection" ii
                                  JOIN "CadetInspection" ici 
                                    ON ii."id" = ici."fk_inspection"
                                 WHERE ici."fk_cadet" = c."id"
                              ORDER BY ii."date" desc
                                 LIMIT 1)
                 LEFT JOIN "Inspection" i
                        ON i."id" = ci."fk_inspection"
                 LEFT JOIN "v_active_deficiency_by_cadet" vadbc
                        ON vadbc."fk_cadet" = c.id
                       AND vadbc."dateResolved" IS NULL
                     WHERE c."fk_assosiation" = '${fk_assosiation}'
                       AND c."recdelete" IS NULL
                  GROUP BY c."id", c."firstname", c."lastname", ci."fk_inspection", ci."uniformComplete", i."date"
                  ORDER BY ${(orderBy === "lastname") ? "lastname" : "firstname"} ${asc ? "asc" : "desc"}`
        ).then((value) => value.map(
            (line) => ({
                ...line,
                activeDeficiencyCount: Number(line.activeDeficiencyCount), // Parse Bigints
            })
        ));


    concatCadetComment = (id: string, comment: string, client?: PrismaClient) =>
        (client ?? prisma).$executeRaw`
            UPDATE "Cadet"
               SET comment = CONCAT(comment, ${comment}) 
             WHERE id = ${id}`;


}

