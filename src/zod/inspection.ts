import dayjs from "@/lib/dayjs";
import z from "zod"
import { customErrorMap } from "./customZod/customErrorMap";

z.setErrorMap(customErrorMap);
export const plannedInspectionFormShema = z.object({
    name: z.string().min(1, 'string.required').max(20, ''),
    date: z.string().refine(
        (value) => dayjs(value).isValid() && !dayjs(value).isBefore(dayjs(), "day"),
        (value) => dayjs(value).isValid()
            ? { message: 'date.minIncluded#today' }
            : { message: 'custom.inspection.dateInvalid', }
    )
});
export type PlannedInspectionFormShema = z.infer<typeof plannedInspectionFormShema>;
