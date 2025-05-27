import { z } from "zod";
import { descriptionSchema } from "./global";


export const materialGroupFormSchema = z.object({
    description: descriptionSchema(z.string().min(1, "string.required").max(20, "string.maxLength;value:20")),
    issuedDefault: z.number({ message: "number.pattern" }).min(0, "number.positiv").max(200, "number.max;value:200").nullable(),
    multitypeAllowed: z.boolean(),
});
export type MaterialGroupFormType = z.infer<typeof materialGroupFormSchema>;

export const materialTypeFormSchema = z.object({
    typename: descriptionSchema(z.string().min(1, "string.required").max(20, "string.maxLength;value:20")),
    actualQuantity: z.number({ message: "number.pattern" }).min(0, "number.positiv"),
    targetQuantity: z.number({ message: "number.pattern" }).min(0, "number.positiv"),
});
export type MaterialTypeFormType = z.infer<typeof materialTypeFormSchema>;