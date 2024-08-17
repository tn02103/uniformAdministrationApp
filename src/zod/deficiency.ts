import { z } from "zod";

export const AdminDeficiencytypeFormSchema = z.object({
    name: z.string()
        .trim()
        .min(1, "string.required")
        .max(20, "string.maxLength;value:20")
        .regex(/^[\w \/\-_\xC0-\xFF]*$/, "string.noSpecialChars"),
    dependent: z.enum(["uniform", "cadet"]),
    relation: z.enum(["uniform", "material"]).nullable(),
})

export type AdminDeficiencytypeFormSchema = z.infer<typeof AdminDeficiencytypeFormSchema>;