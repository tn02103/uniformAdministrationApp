import { z } from "zod";
import { customErrorMap } from "./customZod/customErrorMap";

z.setErrorMap(customErrorMap);
export const uniformNumberSchema = z.number().min(1, "uniform.number.min").max(16_000_000, "uniform.number.max");
export const getUniformFormSchema = (usingGeneration: boolean = false, usingSizes: boolean = false) => z.object({
    id: z.string().uuid(),
    number: uniformNumberSchema,
    generation: usingGeneration ? z.string().nonempty().uuid() : z.string().uuid().nullable().optional(),
    size: usingSizes ? z.string().nonempty().uuid() : z.string().uuid().nullable().optional(),
    comment: z.string(),
    active: z.boolean(),
})
const schema = getUniformFormSchema();
export type UniformFormType = z.infer<typeof schema>;
