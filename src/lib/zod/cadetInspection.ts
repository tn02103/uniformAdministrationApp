import { Deficiency } from "@/types/deficiencyTypes";
import { z } from "zod";

export type NewDeficiencyFormType = Deficiency & {
    fk_uniform?: string;
    fk_material?: string;
    materialId?: string;
    materialGroup?: string;
    materialType?: string;
}

const newDeficiencyFormShema = z.object({
    id: z.string().uuid(),
    typeId: z.string().uuid(),
    description: z.string(),
    comment: z.string(),
    fk_uniform: z.string().uuid().optional(),
    fk_material: z.string().uuid().optional(),
    materialId: z.string().uuid().optional(),
    materialGroup: z.string().uuid().optional(),
    materialType: z.string().uuid().optional(),
});
export const CadetInspectionFormShema = z.object({
    oldDeficiencyList: z.object({}).catchall(z.boolean()),
    newDeficiencyList: z.array(newDeficiencyFormShema),
});