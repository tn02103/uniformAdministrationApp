import { AuthRole } from "@/lib/AuthRoles";
import { z } from "zod";

export const userNameSchema = z.string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])?$/, 'user.username.pattern');
export const nameSchema = z.string()
    .trim()
    .min(1)
    .max(100)
    .refine(v => /^[\p{L}\p{M} \-'.]{1,100}$/u.test(v), 'user.name.pattern');


export const UserFormSchema = z.object({
    username: userNameSchema,
    email: z.string().email().max(100),
    name: nameSchema,
    role: z.nativeEnum(AuthRole),
    active: z.boolean(),
});
export type UserFormInput = z.infer<typeof UserFormSchema>;
export const UpdateUserDALSchema = UserFormSchema.extend({
    id: z.string().uuid(),
});
export type UpdateUserDALInput = z.infer<typeof UpdateUserDALSchema>;

export const AdminTriggerPasswordResetSchema = z.object({
    id: z.string().uuid(),
});
export type AdminTriggerPasswordResetInput = z.infer<typeof AdminTriggerPasswordResetSchema>;

export const DeleteUserSchema = z.object({
    id: z.string().uuid(),
});
export type DeleteUserInput = z.infer<typeof DeleteUserSchema>;
