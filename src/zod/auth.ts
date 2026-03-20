import { passwordValidationPattern } from "@/lib/validations";
import { z } from "zod";

export const LoginFormSchema = z.object({
    organisationId: z.string({ message: "string.required" }).uuid(),
    email: z.string({ message: "string.required" }).email("string.emailValidation"),
    password: z.string({ message: "string.required" }).min(1, "string.required"),
    secondFactor: z.object({
        token: z.string().min(6, "lengthRequired:value:6").max(6, "lengthRequired:value:6").regex(/^\d+$/, "string.numeric"),
        method: z.union([z.string().uuid(), z.enum(["email"])])
    }).optional(),
});
export type LoginFormType = z.infer<typeof LoginFormSchema>;

export const twoFactorAppName = z.string().min(1, "string.required").max(20, "string.max;value:20");

export const twoFactorCodeSchema = z.string()
    .min(6, "lengthRequired:value:6")
    .max(6, "lengthRequired:value:6")
    .regex(/^\d+$/, "string.numeric");
export const TwoFactorFormSchema = z.object({
    token: twoFactorCodeSchema,
});

export type TwoFactorFormType = z.infer<typeof TwoFactorFormSchema>;

const newPasswordSchema = z.string({ message: "string.required" })
    .min(8, "string.minLength;value:8")
    .regex(passwordValidationPattern, "string.passwordPattern");

export const ChangePasswordFormSchema = z.object({
    currentPassword: z.string({ message: "string.required" }).min(1, "string.required"),
    newPassword: newPasswordSchema,
    confirmPassword: z.string({ message: "string.required" }).min(1, "string.required"),
}).superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "string.passwordMismatch",
            path: ["confirmPassword"],
        });
    }
});
export type ChangePasswordFormType = z.infer<typeof ChangePasswordFormSchema>;

export const ChangePasswordDALSchema = z.object({
    currentPassword: z.string({ message: "string.required" }).min(1, "string.required"),
    newPassword: newPasswordSchema,
});
export type ChangePasswordDALType = z.infer<typeof ChangePasswordDALSchema>;