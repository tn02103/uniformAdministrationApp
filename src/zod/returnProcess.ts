import { z } from "zod";

export const createReturnProcessSchema = z.object({
    cadetId: z.string().uuid(),
    returnProcessTemplateId: z.string().uuid(),
    inspectorComment: z.string().optional(),
    preCheckedItemIds: z.array(z.string().uuid()).optional(),
});
export type CreateReturnProcessInput = z.infer<typeof createReturnProcessSchema>;

export const returnCadetDirectlySchema = z.object({
    cadetId: z.string().uuid(),
});
export type ReturnCadetDirectlyInput = z.infer<typeof returnCadetDirectlySchema>;

export const completeChecklistItemSchema = z.object({
    returnProcessId: z.string().uuid(),
    checklistItemId: z.string().uuid(),
    completed: z.boolean(),
});
export type CompleteChecklistItemInput = z.infer<typeof completeChecklistItemSchema>;

export const completeChecklistSchema = z.object({
    returnProcessId: z.string().uuid(),
});
export type CompleteChecklistInput = z.infer<typeof completeChecklistSchema>;

export const returnProcessModalFormSchema = z.object({
    templateId: z.string(),
    items: z.record(z.string(), z.boolean()),
});
export type ReturnProcessModalFormType = z.infer<typeof returnProcessModalFormSchema>;

export const createReturnProcessTemplateSchema = z.object({
    name: z.string().min(1).max(100),
    defaultProcess: z.boolean().optional(),
});
export type CreateReturnProcessTemplateInput = z.infer<typeof createReturnProcessTemplateSchema>;

export const updateReturnProcessTemplateSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100).optional(),
    defaultProcess: z.boolean().optional(),
});
export type UpdateReturnProcessTemplateInput = z.infer<typeof updateReturnProcessTemplateSchema>;

export const deleteReturnProcessTemplateSchema = z.object({
    id: z.string().uuid(),
});
export type DeleteReturnProcessTemplateInput = z.infer<typeof deleteReturnProcessTemplateSchema>;

export const createReturnChecklistTemplateSchema = z.object({
    returnProcessTemplateId: z.string().uuid(),
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
