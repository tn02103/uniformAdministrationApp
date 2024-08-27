import moment from "moment";
import z from "zod"

export const plannedInspectionFormShema = z.object({
    name: z.string().min(1, 'string.required').max(20, ''),
    date: z.date().min(moment.utc().startOf('day').toDate(), "date.minToday"),
});
export type PlannedInspectionFormShema = z.infer<typeof plannedInspectionFormShema>;
