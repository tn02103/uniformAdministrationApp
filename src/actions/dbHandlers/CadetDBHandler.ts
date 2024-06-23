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

    // Export to view
    getPersonnelList = (fk_assosiation: string, orderBy: "lastname" | "firstname", asc: boolean): Promise<PersonnelListCadet[]> =>
        prisma.$queryRawUnsafe<PersonnelListCadet[]>(`
             SELECT *
               FROM base.v_cadet_generaloverview
             WHERE fk_assosiation = '${fk_assosiation}'
              ORDER BY ${(orderBy === "lastname") ? "lastname" : "firstname"} ${asc ? "asc" : "desc"}
          `
        ).then((value) => value.map(
            (line) => ({
                ...line,
                activeDeficiencyCount: Number(line.activeDeficiencyCount), // Parse Bigints
            })
        ));


    concatCadetComment = (id: string, comment: string, client?: PrismaClient) =>
        (client ?? prisma).$executeRaw`
            UPDATE base.cadet
               SET comment = CONCAT(comment, ${comment}) 
             WHERE id = ${id}`;

}
