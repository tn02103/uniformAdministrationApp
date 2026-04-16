import { passwordValidationPattern } from "@/lib/validations";
import { z } from "zod";
import { customErrorMap } from "./customZod/customErrorMap";
z.setErrorMap(customErrorMap);

// ####### BASE SCHEMAS #######
const requiredString = z.string({ message: "string.required" }).trim().min(1, "string.required");

export const emailSchema = z.string().min(1, "string.required").email("string.email");

const newPasswordSchema = requiredString.regex(passwordValidationPattern, "custom.auth.password.requirements");
const passwordConfirmationRefine = (data: { newPassword: string; confirmPassword: string }, ctx: z.RefinementCtx) => {
    if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "custom.auth.password.mismatch",
            path: ["confirmPassword"],
        });
    }
};

export const twoFactorAppName = z.string().min(1, "string.required").max(20, "string.max;value:20");
export const twoFactorCodeSchema = z.string()
    .min(6, "lengthRequired:value:6")
    .max(6, "lengthRequired:value:6")
    .regex(/^\d+$/, "string.numeric");

// ####### EXPORT FORM-SCHEMAS #######
// LOGIN
export const LoginFormSchema = z.object({
    organisationId: requiredString.uuid(),
    identifier: requiredString,
    password: requiredString,
    secondFactor: z.object({
        token: twoFactorCodeSchema,
        method: z.union([z.string().uuid(), z.enum(["email"])])
    }).optional(),
});
export type LoginFormType = z.infer<typeof LoginFormSchema>;

// SELF SERVICE PASSWORD CHANGE
export const SelfServiceChangePasswordFormSchema = z.object({
    currentPassword: requiredString,
    newPassword: newPasswordSchema,
    confirmPassword: requiredString,
}).superRefine(passwordConfirmationRefine);
export type SelfServiceChangePasswordFormType = z.infer<typeof SelfServiceChangePasswordFormSchema>;

export const SelfServiceChangePasswordDALSchema = z.object({
    currentPassword: requiredString,
    newPassword: newPasswordSchema,
});
export type SelfServiceChangePasswordDALType = z.infer<typeof SelfServiceChangePasswordDALSchema>;

// FORGOT PASSWORD & RESET PASSWORD
export const ForgotPasswordSchema = z.object({
    organisationId: requiredString.uuid(),
    email: requiredString.email("string.emailValidation"),
});
export type ForgotPasswordType = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordDALSchema = z.object({
    token: requiredString,
    newPassword: newPasswordSchema,
});
export type ResetPasswordDALType = z.infer<typeof ResetPasswordDALSchema>;
export const ResetPasswordFormSchema = ResetPasswordDALSchema.extend({
    confirmPassword: requiredString,
}).superRefine(passwordConfirmationRefine);
export type ResetPasswordFormType = z.infer<typeof ResetPasswordFormSchema>;

// FORCED PASSWORD CHANGE (after admin reset)
export const ForcedChangePasswordFormSchema = z.object({
    newPassword: newPasswordSchema,
    confirmPassword: requiredString,
}).superRefine(passwordConfirmationRefine);
export type ForcedChangePasswordFormType = z.infer<typeof ForcedChangePasswordFormSchema>;

export const ForcedChangePasswordDALSchema = z.object({
    newPassword: newPasswordSchema,
});
export type ForcedChangePasswordDALType = z.infer<typeof ForcedChangePasswordDALSchema>;

// TWO FACTOR AUTHENTICATION
export const TwoFactorFormSchema = z.object({
    token: twoFactorCodeSchema,
});
export type TwoFactorFormType = z.infer<typeof TwoFactorFormSchema>;

// MFA DAL
export const mfaMethodSchema = z.union([z.literal("email"), z.string().uuid()]);
export type MfaMethod = z.infer<typeof mfaMethodSchema>;

export const removeMfaAppSchema = z.object({
    appId: z.string().uuid(),
});
export type RemoveMfaAppInput = z.infer<typeof removeMfaAppSchema>;

export const setDefaultMfaMethodSchema = z.object({
    method: mfaMethodSchema,
});
export type SetDefaultMfaMethodInput = z.infer<typeof setDefaultMfaMethodSchema>;

export const toggleUserMfaSchema = z.object({
    enabled: z.boolean(),
});
export type ToggleUserMfaInput = z.infer<typeof toggleUserMfaSchema>;
