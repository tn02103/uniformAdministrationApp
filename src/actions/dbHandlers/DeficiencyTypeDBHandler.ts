import { prisma } from "@/lib/db";
import { AdminDeficiencyType } from "@/types/deficiencyTypes";
import { AdminDeficiencytypeFormSchema } from "@/zod/deficiency";
import { Prisma } from "@prisma/client";

export class DeficiencyTypeDBHandler {

    getDeficiencyAdmintypeList = (fk_assosiation: string, client?: Prisma.TransactionClient): Promise<AdminDeficiencyType[]> =>
        (client ?? prisma).$queryRaw<AdminDeficiencyType[]>`
             SELECT dt.id,
                    dt.name,
                    dt.dependend,
                    dt.relation,
                    dt.recdelete,
                    dt.recdelete_user as recdeleteUser,
                    SUM(CASE WHEN d.date_resolved IS NULL AND d.id IS NOT NULL THEN 1 ELSE 0 END) active,
                    COUNT(d.date_resolved) resolved
               FROM inspection.deficiency_type dt
          LEFT JOIN inspection.deficiency d ON dt.id = d.fk_deficiency_type
              WHERE dt.fk_assosiation = ${fk_assosiation}
           GROUP BY dt.id
           ORDER BY dt.recdelete DESC, dt.name ASC
        `.then((data) =>
            data.map((t) => ({
                ...t,
                active: Number(t.active),
                resolved: Number(t.resolved)
            }))
        );


    update = (id: string, data: AdminDeficiencytypeFormSchema, client: Prisma.TransactionClient) =>
        client.deficiencyType.update({
            where: { id },
            data
        });
    create = (data: AdminDeficiencytypeFormSchema, fk_assosiation: string, client: Prisma.TransactionClient) =>
        client.deficiencyType.create({
            data: {
                ...data,
                fk_assosiation
            }
        });
    markDeleted = (id: string, username: string, client: Prisma.TransactionClient) =>
        client.deficiencyType.update({
            where: { id },
            data: {
                recdelete: new Date(),
                recdeleteUser: username,
            }
        });
}