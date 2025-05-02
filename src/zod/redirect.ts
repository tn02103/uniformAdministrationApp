import { z } from "zod";

export const RedirectFormSchema = z.object({
    target: z.string().url(),
    code: z.string().regex(/^[a-zA-Z0-9-]{1,30}$/, "Invalid redirect code"),
    active: z.boolean().optional(),
});

export type RedirectFormType = z.infer<typeof RedirectFormSchema>
