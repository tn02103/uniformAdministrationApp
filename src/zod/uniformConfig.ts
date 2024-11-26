import { z } from "zod";
import { nameSchema } from "./global";

export const uniformTypeFormSchema = z.object({
    id: z.string().uuid(),
    name: nameSchema.min(1, "string.required").max(10, "string.maxLength;value:10"),
    acronym: z.string().regex(/^[A-Z]*$/, "string.noSpecialChars").min(2, 'string.lengthRequired;value:2').max(2, 'string.lengthRequired;value:2'),
    issuedDefault: z.number({message: 'number.pattern'}).min(0, 'number.positiv').max(10, "number.max;value:10"),
    usingGenerations: z.boolean(),
    usingSizes: z.boolean(),
    fk_defaultSizelist: z.string().uuid().nullable(),
});
export type UniformTypeFormType = z.infer<typeof uniformTypeFormSchema>;
