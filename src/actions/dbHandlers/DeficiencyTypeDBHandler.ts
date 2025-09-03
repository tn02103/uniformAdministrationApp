import { prisma } from "@/lib/db";
import { AdminDeficiencyType } from "@/types/deficiencyTypes";
import { AdminDeficiencytypeFormSchema } from "@/zod/deficiency";
import { Prisma } from "@prisma/client";

export class DeficiencyTypeDBHandler {

    getDeficiencyAdmintypeList = (organisationId: string, client?: Prisma.TransactionClient): Promise<AdminDeficiencyType[]> =>
        (client ?? prisma).$queryRaw<AdminDeficiencyType[]>`
             SELECT dt.id,
                    dt.name,
                    dt.dependent,
                    dt.relation,
                    dt.disabled_date as "disabledDate",
                    dt.disabled_user as "disabledUser",
                    SUM(CASE WHEN d.date_resolved IS NULL AND d.id IS NOT NULL THEN 1 ELSE 0 END) active,
                    COUNT(d.date_resolved) resolved
               FROM inspection.deficiency_type dt
          LEFT JOIN inspection.deficiency d ON dt.id = d.fk_deficiency_type
              WHERE dt.organisationId = ${organisationId}
           GROUP BY dt.id
           ORDER BY dt.disabled_date DESC, dt.name ASC
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
    create = (data: AdminDeficiencytypeFormSchema, organisationId: string, client: Prisma.TransactionClient) =>
        client.deficiencyType.create({
            data: {
                ...data,
                organisationId
            }
        });
    markDeleted = (id: string, username: string, client: Prisma.TransactionClient) =>
        client.deficiencyType.update({
            where: { id },
            data: {
                disabledDate: new Date(),
                disabledUser: username,
            }
        });
}