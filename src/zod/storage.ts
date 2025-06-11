import { z } from 'zod';
import { customErrorMap } from './customZod/customErrorMap';

z.setErrorMap(customErrorMap);

export const storageUnitFormSchema = z.object({
    name: z.string().min(1).max(20),
    description: z.string().max(100).nullable().optional(),
    isReserve: z.boolean(),
    capacity: z.number().max(100).nullable().optional(),
});

export type StorageUnitFormType = z.infer<typeof storageUnitFormSchema>;
