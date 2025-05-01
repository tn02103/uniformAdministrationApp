import { z } from "zod";
import { customErrorMap } from "./customZod/customErrorMap";

z.setErrorMap(customErrorMap);
export const uniformNumberSchema = z.number().min(1, "uniform.number.min").max(16_000_000, "uniform.number.max");
export const uniformFormSchema = z.object({
    id: z.string().uuid(),
    number: uniformNumberSchema,
    generation: z.string().nonempty().uuid(),
    size: z.string().nonempty().uuid(),
    comment: z.string(),
    active: z.boolean(),
});
export type UniformFormType = z.infer<typeof uniformFormSchema>;
