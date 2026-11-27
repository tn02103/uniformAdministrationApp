import dayjs from "dayjs";
import { z } from "zod";

export const plannedInspectionFormShema = z.object({
    name: z.string().min(1, 'string.required').max(20, ''),
    date: z.string().superRefine((value, ctx) => {
        if (!dayjs(value).isValid()) {
            ctx.addIssue({
                code: "custom",
                message: 'custom.inspection.dateInvalid'
            });
        } else if (dayjs(value).isBefore(dayjs(), "day")) {
            ctx.addIssue({
                code: "custom",
                message: 'date.minIncluded#today'
            });
        }
    })
});
export type PlannedInspectionFormShema = z.infer<typeof plannedInspectionFormShema>;

export const getClosedInspectionReportSchema = z.object({
    inspectionId: z.string().uuid(),
});
export type GetClosedInspectionReportInput = z.infer<typeof getClosedInspectionReportSchema>;

export const getInspectionsByCadetSchema = z.object({
    cadetId: z.string().uuid(),
});
export type GetInspectionsByCadetInput = z.infer<typeof getInspectionsByCadetSchema>;
