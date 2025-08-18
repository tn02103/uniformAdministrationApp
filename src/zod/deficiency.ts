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

export const updateUniformDeficiencySchema = z.object({
    comment: z.string(),
    typeId: z.string().uuid(),
});

export type AdminDeficiencytypeFormSchema = z.infer<typeof AdminDeficiencytypeFormSchema>;
export type UpdateUniformDeficiencySchema = z.infer<typeof updateUniformDeficiencySchema>;

const nullableUUID = z.union([z.string().uuid(), z.string().max(0).transform(() => null)]).nullable().optional();

export const newCadetDeficiencyFormSchema = z.object({
    id: z.string().uuid().optional(),
    typeId: z.string().uuid(),
    description: z.string().trim(),
    comment: z.string().trim().min(1, "string.required").max(1000, "string.maxLength;value:1000"),
    uniformId: nullableUUID,
    materialId: z.union([nullableUUID, z.enum(["other"])]).nullable().optional(),
    otherMaterialId: nullableUUID,
    otherMaterialGroupId: nullableUUID,
    dateCreated: z.string().datetime().nullable().optional(),
});

export const oldDeficiencyFormSchema = z.object({
    id: z.string().uuid(),
    typeId: z.string().uuid(),
    typeName: z.string(),
    description: z.string(),
    comment: z.string(),
    dateCreated: z.date(),
    resolved: z.boolean(),
});

export const cadetInspectionFormSchema = z.object({
    cadetId: z.string().uuid(),
    uniformComplete: z.boolean(),
    oldDeficiencyList: z.array(oldDeficiencyFormSchema),
    newDeficiencyList: newCadetDeficiencyFormSchema.array(),
});

export type NewCadetDeficiencyFormSchema = z.infer<typeof newCadetDeficiencyFormSchema>;
export type OldDeficiencyFormSchema = z.infer<typeof oldDeficiencyFormSchema>;
export type CadetInspectionFormSchema = z.infer<typeof cadetInspectionFormSchema>;