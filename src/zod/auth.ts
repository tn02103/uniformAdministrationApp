import { AuthRole } from "@/lib/AuthRoles";
import { z } from "zod";
import { ZOD_ERROR } from "./global";

export const LoginFormSchema = z.object({
    organisationId: z.string({ message: ZOD_ERROR.STRING.REQUIRED }).uuid(),
    email: z.string({ message: ZOD_ERROR.STRING.REQUIRED }).email(ZOD_ERROR.STRING.EMAIL),
    password: z.string({ message: ZOD_ERROR.STRING.REQUIRED }).min(1, ZOD_ERROR.STRING.REQUIRED),
});
export type LoginFormType = z.infer<typeof LoginFormSchema>;

const zodFormBoolean = z.union([z.string().regex(/^(true|false)$/), z.boolean()]);
export const UserFormSchema = z.object({
    id: z.string({message: ZOD_ERROR.STRING.REQUIRED}).uuid().optional(),
    email: z.string({message: ZOD_ERROR.STRING.REQUIRED}).email(ZOD_ERROR.STRING.EMAIL),
    name: z.string({message: ZOD_ERROR.STRING.REQUIRED}).min(1, ZOD_ERROR.STRING.REQUIRED).max(20, ZOD_ERROR.STRING.MAX_LENGTH(20)),
    role: z.preprocess((val) => Number(val), z.nativeEnum(AuthRole)),
    active: zodFormBoolean,
});

export type UserFormType = z.infer<typeof UserFormSchema>;