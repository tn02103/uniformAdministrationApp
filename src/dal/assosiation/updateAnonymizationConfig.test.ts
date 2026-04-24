import { updateAnonymizationConfigSchema } from "@/zod/assosiation";

describe("updateAnonymizationConfigSchema cross-field validation", () => {
    it("should reject AFTER_DAYS mode without anonymizationDelayDays", () => {
        const result = updateAnonymizationConfigSchema.safeParse({ anonymizationMode: "AFTER_DAYS" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain("anonymizationDelayDays");
        }
    });

    it("should accept AFTER_DAYS mode with valid anonymizationDelayDays", () => {
        const result = updateAnonymizationConfigSchema.safeParse({
            anonymizationMode: "AFTER_DAYS",
            anonymizationDelayDays: 7,
        });
        expect(result.success).toBe(true);
    });

    it("should reject anonymizationDelayDays less than 1", () => {
        const result = updateAnonymizationConfigSchema.safeParse({
            anonymizationMode: "AFTER_DAYS",
            anonymizationDelayDays: 0,
        });
        expect(result.success).toBe(false);
    });

    it("should accept MANUAL mode without anonymizationDelayDays", () => {
        const result = updateAnonymizationConfigSchema.safeParse({ anonymizationMode: "MANUAL" });
        expect(result.success).toBe(true);
    });

    it("should accept IMMEDIATELY mode without anonymizationDelayDays", () => {
        const result = updateAnonymizationConfigSchema.safeParse({ anonymizationMode: "IMMEDIATELY" });
        expect(result.success).toBe(true);
    });
});
