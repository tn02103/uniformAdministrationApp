import { z } from "zod";

// ##### ADMIN OVERVIEW SCHEMAS #####
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

// ##### GLOBAL COMPONENTS #######

const nullableUUID = z.union([z.string().uuid(), z.string().max(0).transform(() => null)]).nullable().optional();
export const deficiencyDescriptionSchema = z.string().max(30, "string.maxLength;value:30").regex(/^[\w\s.,;:\-/\xC0-\xFF]*$/, "string.noSpecialChars");
export const deficiencyCommentSchema = z.string().max(1000, "string.maxLength;value:1000").regex(/^[\w\s.,;:!?'"()\-/\xC0-\xFF]*$/, "string.noSpecialChars");

export const baseDeficiencySchema = z.object({
    typeId: z.string().uuid(),
    description: deficiencyDescriptionSchema.nullable().optional(),
    comment: deficiencyCommentSchema,
    cadetId: nullableUUID,
    uniformId: nullableUUID,
    materialId: nullableUUID,
});
type BaseDeficiencySchema = z.infer<typeof baseDeficiencySchema>;

type TypelistItem = {
    id: string;
    dependent: string;
    relation: string | null;
}
const getSuperRefinement = (deficiencyTypeList: TypelistItem[], pathPrefix: string[]) => {
    return function (data: BaseDeficiencySchema, ctx: z.RefinementCtx) {
        if (data.typeId === "") {
            ctx.addIssue({
                code: "custom",
                message: "string.required",
                path: [...pathPrefix, "typeId"],
            });
        }

        const selectedType = deficiencyTypeList?.find(type => type.id === data.typeId);

        if (selectedType?.dependent === "uniform" || selectedType?.relation === "uniform") {
            if (!data.uniformId || data.uniformId.trim() === "") {
                ctx.addIssue({
                    code: "custom",
                    message: "string.required",
                    path: [...pathPrefix, "uniformId"],
                });
            }
        }
        if (selectedType?.dependent === "cadet" && selectedType?.relation === "material") {
            if (!data.materialId || data.materialId.trim() === "") {
                ctx.addIssue({
                    code: "custom",
                    message: "string.required",
                    path: [...pathPrefix, "materialId"],
                });
            }
        }
        if (selectedType?.dependent === "cadet" && selectedType?.relation === null) {
            if (!data.description || data.description?.trim() === "") {
                ctx.addIssue({
                    code: "custom",
                    message: "string.required",
                    path: [...pathPrefix, "description"],
                });
            }
        }

        if (!data.comment || data.comment.trim() === "") {
            ctx.addIssue({
                code: "custom",
                message: "string.required",
                path: [...pathPrefix, "comment"],
            });
        }
    };
}

// ##### CADET INSPECTION SCHEMAS #####
export const getNewCadetDeficiencyFormSchema = (typeList: TypelistItem[], pathPrefix: string[]) => baseDeficiencySchema.extend({
    id: z.string().uuid().optional(),
    dateCreated: z.string().regex(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})?$/, "string.invalidDate").nullable().optional(),
}).superRefine(getSuperRefinement(typeList, pathPrefix));

export const oldDeficiencyFormSchema = z.object({
    id: z.string().uuid(),
    typeId: z.string().uuid(),
    typeName: z.string(),
    description: deficiencyDescriptionSchema,
    comment: deficiencyCommentSchema,
    dateCreated: z.date(),
    resolved: z.boolean(),
});

export const getCadetInspectionFormSchema = (typeList: TypelistItem[], pathPrefix: string[] = []) => z.object({
    cadetId: z.string().uuid(),
    uniformComplete: z.boolean(),
    oldDeficiencyList: z.array(oldDeficiencyFormSchema),
    newDeficiencyList: getNewCadetDeficiencyFormSchema(typeList, [...pathPrefix, "newDeficiencyList"]).array(),
});

export type NewCadetDeficiencyFormSchema = z.infer<ReturnType<typeof getNewCadetDeficiencyFormSchema>>;
export type OldDeficiencyFormSchema = z.infer<typeof oldDeficiencyFormSchema>;
export type CadetInspectionFormSchema = z.infer<ReturnType<typeof getCadetInspectionFormSchema>>;

/// ##### CREATE/UPDATE DEFICIENCY SCHEMAS #####
export const createDeficiencySchema = (typeList: TypelistItem[]) => baseDeficiencySchema.superRefine(getSuperRefinement(typeList, []));
export type CreateDeficiencyInput = z.infer<ReturnType<typeof createDeficiencySchema>>;

export const updateDeficiencySchema = z.object({
    description: deficiencyDescriptionSchema.optional(),
    comment: deficiencyCommentSchema,
});
export type UpdateDeficiencyInput = z.infer<typeof updateDeficiencySchema>;