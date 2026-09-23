import { z } from "zod";
import { customErrorMap } from "./customZod/customErrorMap";
z.setErrorMap(customErrorMap);

export const createResignationProcessSchema = z.object({
    cadetId: z.string().uuid(),
    resignationProcessTemplateId: z.string().uuid(),
    inspectorComment: z.string().optional(),
    preCheckedItemIds: z.array(z.string().uuid()).optional(),
    finished: z.boolean().optional(),
    selectedUniformIds: z.array(z.string().uuid()).optional(),
    selectedMaterialIds: z.array(z.string().uuid()).optional(),
});
export type CreateResignationProcessInput = z.infer<typeof createResignationProcessSchema>;

export const returnCadetDirectlySchema = z.object({
    cadetId: z.string().uuid(),
    selectedUniformIds: z.array(z.string().uuid()).optional(),
    selectedMaterialIds: z.array(z.string().uuid()).optional(),
});
export type ReturnCadetDirectlyInput = z.infer<typeof returnCadetDirectlySchema>;

export const completeChecklistItemSchema = z.object({
    resignationProcessId: z.string().uuid(),
    checklistItemId: z.string().uuid(),
    completed: z.boolean(),
});
export type CompleteChecklistItemInput = z.infer<typeof completeChecklistItemSchema>;

export const completeChecklistSchema = z.object({
    resignationProcessId: z.string().uuid(),
});
export type CompleteChecklistInput = z.infer<typeof completeChecklistSchema>;

export const resignationProcessModalFormSchema = z.object({
    templateId: z.string().uuid(),
    items: z.record(z.string().uuid(), z.boolean()),
    uniformItems: z.record(z.string().uuid(), z.boolean()),
    materialItems: z.record(z.string().uuid(), z.boolean()),
    notes: z.string().optional(),
});
export type ResignationProcessModalFormType = z.infer<typeof resignationProcessModalFormSchema>;

export const createResignationProcessTemplateSchema = z.object({
    name: z.string().min(1).max(100),
    defaultProcess: z.boolean().optional(),
});
export type CreateResignationProcessTemplateInput = z.infer<typeof createResignationProcessTemplateSchema>;

export const updateResignationProcessTemplateSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100).optional(),
    defaultProcess: z.boolean().optional(),
});
export type UpdateResignationProcessTemplateInput = z.infer<typeof updateResignationProcessTemplateSchema>;

export const deleteResignationProcessTemplateSchema = z.object({
    id: z.string().uuid(),
});
export type DeleteResignationProcessTemplateInput = z.infer<typeof deleteResignationProcessTemplateSchema>;

export const createReturnChecklistTemplateSchema = z.object({
    resignationProcessTemplateId: z.string().uuid(),
    label: z.string().min(1).max(100),
});
export type CreateReturnChecklistTemplateInput = z.infer<typeof createReturnChecklistTemplateSchema>;

export const updateReturnChecklistTemplateSchema = z.object({
    id: z.string().uuid(),
    label: z.string().min(1).max(100),
});
export type UpdateReturnChecklistTemplateInput = z.infer<typeof updateReturnChecklistTemplateSchema>;

export const deleteReturnChecklistTemplateSchema = z.object({
    id: z.string().uuid(),
});
export type DeleteReturnChecklistTemplateInput = z.infer<typeof deleteReturnChecklistTemplateSchema>;

export const changeReturnChecklistTemplateSortOrderSchema = z.object({
    checklistItemId: z.string().uuid(),
    newPosition: z.number().int().min(0),
});
export type ChangeReturnChecklistTemplateSortOrderInput = z.infer<typeof changeReturnChecklistTemplateSortOrderSchema>;

export const resignationProcessTemplateNameSchema = createResignationProcessTemplateSchema.pick({ name: true });
export type ResignationProcessTemplateNameInput = z.infer<typeof resignationProcessTemplateNameSchema>;
