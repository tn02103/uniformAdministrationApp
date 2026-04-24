import { z } from "zod";

export const updateAnonymizationConfigSchema = z.object({
    returnProcessEnabled: z.boolean().optional(),
    anonymizationMode: z.enum(["MANUAL", "AFTER_DAYS", "IMMEDIATELY"]).optional(),
    anonymizationDelayDays: z.number().int().min(1).optional(),
}).superRefine((data, ctx) => {
    if (data.anonymizationMode === "AFTER_DAYS" && (data.anonymizationDelayDays === undefined || data.anonymizationDelayDays < 1)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "anonymizationDelayDays must be >= 1 when mode is AFTER_DAYS",
            path: ["anonymizationDelayDays"],
        });
    }
});

export type UpdateAnonymizationConfigInput = z.infer<typeof updateAnonymizationConfigSchema>;
