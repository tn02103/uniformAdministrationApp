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
    .min(8, "custom.auth.password.requirements")
    .regex(passwordValidationPattern, "custom.auth.password.requirements"); 

export const ChangePasswordFormSchema = z.object({
    currentPassword: z.string({ message: "string.required" }).min(1, "string.required"),
    newPassword: newPasswordSchema,
    confirmPassword: z.string({ message: "string.required" }).min(1, "string.required"),
}).superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "custom.auth.password.mismatch",
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

export const ForgotPasswordSchema = z.object({
    organisationId: z.string({ message: "string.required" }).uuid(),
    email: z.string({ message: "string.required" }).email("string.emailValidation"),
});
export type ForgotPasswordType = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
    token: z.string({ message: "string.required" }).min(1, "string.required"),
    newPassword: z.string({ message: "string.required" })
        .min(8, "lengthRequired:value:8")
        .regex(/[A-Z]/, "string.uppercaseRequired")
        .regex(/[a-z]/, "string.lowercaseRequired")
        .regex(/[0-9]/, "string.numberRequired"),
});
export type ResetPasswordType = z.infer<typeof ResetPasswordSchema>;

export const ResetPasswordFormSchema = ResetPasswordSchema.extend({
    confirmPassword: z.string({ message: "string.required" }).min(1, "string.required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "resetPassword.error.passwordMismatch",
    path: ["confirmPassword"],
});
export type ResetPasswordFormType = z.infer<typeof ResetPasswordFormSchema>;
