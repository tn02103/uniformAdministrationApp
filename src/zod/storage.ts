import { z } from 'zod';

export const storageUnitFormSchema = z.object({
    name: z.string().min(1, "string.required").max(20, "string.maxLength;value:20"),
    description: z.string().max(50, "string.maxLength;value:50").nullable().optional(),
    isReserve: z.boolean(),
    capacity: z.number().max(100,"number.max;value:100").nullable().optional(),
});
;
export type StorageUnitFormType = z.infer<typeof storageUnitFormSchema>;
