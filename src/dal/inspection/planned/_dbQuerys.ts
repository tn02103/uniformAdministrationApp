
import { plannedInspectionTypeArgs } from "@/types/inspectionTypes";
import { Prisma } from "@prisma/client";

export class PlannedInspectionDBQuery {
    plannedInspectionListQuery = (fk_assosiation: string, client: Prisma.TransactionClient) =>
        client.inspection.findMany({
            ...plannedInspectionTypeArgs,
            where: {
                fk_assosiation,
                OR: [
                    { date: { gte: new Date() } },
                    { timeStart: null },
                    { timeEnd: null },
                ]
            },
            orderBy: { date: "asc" },
        });
}
