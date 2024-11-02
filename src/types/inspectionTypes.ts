import { Prisma } from "@prisma/client";
import { cadetLableArgs } from "./globalCadetTypes";

export const plannedInspectionTypeArgs = Prisma.validator<Prisma.InspectionFindManyArgs>()({
    include: {
        deregistrations: {
            include: {
                cadet: cadetLableArgs
            },
        },
    }
});
export type PlannedInspectionType = Prisma.InspectionGetPayload<typeof plannedInspectionTypeArgs>;
