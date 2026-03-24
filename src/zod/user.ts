import { AuthRole } from "@/lib/AuthRoles";
import { z } from "zod";

export const CreateUserSchema = z.object({
    username: z.string().min(2).max(6).regex(/^[\w\d]+$/),
    name: z.string().max(20).regex(/^[\w \xC0-\xFF]+$/),
    role: z.nativeEnum(AuthRole),
    active: z.boolean(),
    password: z.string().min(8),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
    userId: z.string().uuid(),
    name: z.string().max(20).regex(/^[\w \xC0-\xFF]+$/),
    role: z.nativeEnum(AuthRole),
    active: z.boolean(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export const ChangePasswordSchema = z.object({
    userId: z.string().uuid(),
    password: z.string().min(8),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const DeleteUserSchema = z.object({
    userId: z.string().uuid(),
});
export type DeleteUserInput = z.infer<typeof DeleteUserSchema>;
