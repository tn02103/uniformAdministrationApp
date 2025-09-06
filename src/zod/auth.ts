import { z } from "zod";

export const LoginFormSchema = z.object({
    organisationId: z.string({ message: "string.required" }).uuid(),
    email: z.string({ message: "string.required" }).email("string.emailValidation"),
    password: z.string({ message: "string.required" }).min(1, "string.required"),
});
export type LoginFormType = z.infer<typeof LoginFormSchema>;
