import dayjs from "@/lib/dayjs";
import z from "zod"
import { customErrorMap } from "./customZod/customErrorMap";

z.setErrorMap(customErrorMap);
export const plannedInspectionFormShema = z.object({
    name: z.string().min(1, 'string.required').max(20, ''),
    date: z.date().min(dayjs.utc().startOf('day').toDate(), "date.minToday"),
});
export type PlannedInspectionFormShema = z.infer<typeof plannedInspectionFormShema>;
