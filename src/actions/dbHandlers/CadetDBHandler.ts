import { prisma } from "@/lib/db";
import { PersonnelListCadet, cadetArgs } from "@/types/globalCadetTypes";
import { Prisma, PrismaClient } from "@prisma/client";
import dayjs from "@/lib/dayjs";

export class CadetDBHandler {
    getCadet = (id: string, client?: PrismaClient) =>
        (client ?? prisma).cadet.findUniqueOrThrow({
            ...cadetArgs,
            where: {
                id
            }
        });

    getRestrictedPersonnelList = (fk_assosiation: string, orderBy: "lastname" | "firstname", asc: "asc" | "desc", exclDeregistrations?: boolean, exclInspected?: boolean): Promise<PersonnelListCadet[]> => {
        const filter: Prisma.CadetWhereInput = {}
        if (exclDeregistrations) {
            filter.deregistrations = {
                none: {
                    inspection: {
                        date: dayjs().format("YYYY-MM-DD"),
                    },
                },
            };
        }
        if (exclInspected) {
            filter.cadetInspection = {
                none: {
                    inspection: {
                        date: dayjs().format("YYYY-MM-DD"),
                    }
                }
            };
        }
        return prisma.cadet.findMany({
            select: {
                id: true,
                firstname: true,
                lastname: true,
            },
            where: {
                fk_assosiation,
                recdelete: null,
                ...filter,
            },
            orderBy: (orderBy === "lastname")
                ? [{ lastname: asc }, { firstname: asc }]
                : [{ firstname: asc }, { lastname: asc }]
        });
    };
    // Export to view
    getPersonnelList = async (fk_assosiation: string, orderBy: "lastname" | "firstname", asc: boolean, exclude?: { inspectionId: string, exclDeregistrations?: boolean, exclInspected?: boolean }): Promise<PersonnelListCadet[]> => {
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


    concatCadetComment = (id: string, comment: string, client?: PrismaClient) =>
        (client ?? prisma).$executeRaw`
            UPDATE base.cadet
               SET comment = CONCAT(comment, ${comment}) 
             WHERE id = ${id}`;

}
