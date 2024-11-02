import { Prisma } from "@prisma/client";
import { cadetLableArgs } from "./globalCadetTypes";

export const plannedInspectionTypeArgs = Prisma.validator<Prisma.InspectionFindManyArgs>()({
    select: {
        id: true,
        name: true,
        date: true,
        timeEnd: true,
        timeStart: true,
        deregistrations: {
            where: {
                cadet: {
                    recdelete: null,
                    active: true,
                }
            },
            include: {
                cadet: {
                    ...cadetLableArgs,
                }
            }
        }
    }
});
export type PlannedInspectionType = Prisma.InspectionGetPayload<typeof plannedInspectionTypeArgs>;
