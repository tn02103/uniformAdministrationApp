import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { getI18n } from "@/lib/locales/config";
import Head from "next/head";
import GeneralOverviewTable from "./table";

export type GeneralOverviewCadetType = {
    id: string;
    firstname: string;
    lastname: string;
    lastInspection?: string;
    uniformComplete?: boolean;
    activeDeficiencyCount?: number;
}

const loadData = async (propertie: "lastname" | "firstname", asc: boolean): Promise<GeneralOverviewCadetType[]> => {
    const { user } = await getIronSession();
    if (!user) return [];

    if (user.role < AuthRole.inspector) {
        const ascString: "asc" | "desc" = asc ? "asc" : "desc";
        return prisma.cadet.findMany({
            select: {
                id: true,
                firstname: true,
                lastname: true,
            },
            where: {
                fk_assosiation: user.assosiation,
                recdelete: null,
            },
            orderBy: (propertie === "lastname")
                ? [{ lastname: ascString }, { firstname: ascString }]
                : [{ firstname: ascString }, { lastname: ascString }]
        });
    } else {
        return prisma.$queryRawUnsafe(`
                    SELECT c."id",
                           c."firstname",
                           c."lastname",
                           ci."fk_inspection",
                           ci."uniformComplete",
                           i."date" as "lastInspection",
                           COUNT(cd."id") as "activeDeficiencyCount"
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
                 LEFT JOIN "CadetDeficiency" cd
                        ON cd."fk_cadet" = c.id
                       AND cd."dateResolved" IS NULL
                     WHERE c."fk_assosiation" = '${user.assosiation}'
                       AND c."recdelete" IS NULL
                  GROUP BY c."id", c."firstname", c."lastname", ci."fk_inspection", ci."uniformComplete", i."date"
                  ORDER BY ${propertie === "lastname" ? "lastname" : "firstname"} ${asc ? "asc" : "desc"}`
        ).then((data) => (data as any[]).map(row => {
            return {
                ...row,
                lastInspection: row.lastInspection ? row.lastInspection.toString() : null,
                activeDeficiencyCount: Number(row.activeDeficiencyCount)
            }
        }));
    }
}

const CadetListPage = async ({ params, searchParams }: any) => {
    const t = await getI18n();
    const orderBy = searchParams.orderBy === "firstname" ? "firstname" : "lastname";
    const asc = searchParams.asc ? searchParams.asc === "true" ? true : false : true;

    return (
        <div className="container-lg content-center bg-light rounded px-md-3 px-xl-5 p-0">
            <Head>
                <title>{t('generalOverview.header')}</title>
            </Head>
            <div className="row pt-2 pb-2 m-0">
                <h1 data-testid="div_cadetListHeader" className="text-center">{t('generalOverview.header')}</h1>
            </div>
            <GeneralOverviewTable data={await loadData(orderBy, asc)} />

        </div>
    )
}

export default CadetListPage;
