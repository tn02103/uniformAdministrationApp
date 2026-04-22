import { Prisma } from "@/prisma/client";
import { cadetLableArgs } from "./globalCadetTypes";

export const plannedInspectionTypeArgs = {
    select: {
        id: true,
        name: true,
        date: true,
        timeEnd: true,
        timeStart: true,
        deregistrations: {
            where: {
                cadet: {
                    status: 'ACTIVE',
                },
            },
            include: {
                cadet: {
                    ...cadetLableArgs,
                },
            },
            orderBy: [
                { cadet: { firstname: "asc" } },
                { cadet: { lastname: "asc" } },
            ],
        },
    }
} satisfies Prisma.InspectionFindManyArgs;
export type PlannedInspectionType = Prisma.InspectionGetPayload<typeof plannedInspectionTypeArgs>;
