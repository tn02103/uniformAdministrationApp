import { TypeOf, z } from "zod";

export const uniformNumberSchema = z.number().min(1, "uniform.number.min").max(16_000_000, "uniform.number.max");
export const uniformFormSchema = z.object({
    id: z.string().uuid(),
    number: uniformNumberSchema,
    generation: z.string().uuid().nullable().optional(),
    size: z.string().uuid().nullable().optional(),
    comment: z.string(),
    active: z.boolean(),
});
export type UniformFormType = z.infer<typeof uniformFormSchema>;
