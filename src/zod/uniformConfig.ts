import { z } from "zod";
import { descriptionSchema, nameSchema } from "./global";
import { customErrorMap } from "./customZod/customErrorMap";

z.setErrorMap(customErrorMap);

export const uniformTypeFormSchema = z.object({
    name: z.string().min(1).max(10),
    acronym: z.string().length(2).regex(/^[A-Z]*$/, "string.noSpecialChars"),
    issuedDefault: z.number({ message: 'number.pattern' }).min(0, 'number.positiv').max(10, "number.max;value:10"),
    usingGenerations: z.boolean(),
    usingSizes: z.boolean(),
    fk_defaultSizelist: z.string().uuid().nullable().optional(),
});
export type UniformTypeFormType = z.infer<typeof uniformTypeFormSchema>;

export const uniformGenerationFormSchema = z.object({
    name: descriptionSchema(z.string().min(1, 'string.required').max(20, "string.maxLength;value:20")),
    outdated: z.boolean(),
    fk_sizelist: z.string().uuid().nullable(),
});
export type UniformGenerationFormType = z.infer<typeof uniformGenerationFormSchema>;
