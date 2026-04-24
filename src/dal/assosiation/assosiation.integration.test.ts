import { AuthRole } from "@/lib/AuthRoles";
import { staticData, wrongAssosiation } from "../../../vitest/setup-dal-integration";
import { getAnonymizationConfig } from "./getAnonymizationConfig";
import { updateAnonymizationConfig } from "./updateAnonymizationConfig";
import { prisma } from "@/lib/db";

afterEach(async () => {
    // Reset assosiation configuration to static data defaults after each test
    await prisma.assosiationConfiguration.update({
        where: { assosiationId: staticData.fk_assosiation },
        data: {
            returnProcessEnabled: staticData.data.assosiationConfiguration.returnProcessEnabled,
            anonymizationMode: staticData.data.assosiationConfiguration.anonymizationMode,
            anonymizationDelayDays: staticData.data.assosiationConfiguration.anonymizationDelayDays,
        },
    });
});

describe("getAnonymizationConfig", () => {

    beforeAll(() => {
        global.__ROLE__ = AuthRole.admin;
        global.__ASSOSIATION__ = staticData.fk_assosiation;
    });
    afterAll(() => {
        delete global.__ROLE__;
        delete global.__ASSOSIATION__;
    });

    it("should return the anonymization configuration for the session org", async () => {
        const result = await getAnonymizationConfig();

        expect(result).toEqual({
            returnProcessEnabled: staticData.data.assosiationConfiguration.returnProcessEnabled,
            anonymizationMode: staticData.data.assosiationConfiguration.anonymizationMode,
            anonymizationDelayDays: staticData.data.assosiationConfiguration.anonymizationDelayDays,
        });
    });

    it("should return the correct org's config when session switches to a different org", async () => {
        global.__ASSOSIATION__ = wrongAssosiation.fk_assosiation;

        const result = await getAnonymizationConfig();

        expect(result).toEqual({
            returnProcessEnabled: wrongAssosiation.data.assosiationConfiguration.returnProcessEnabled,
            anonymizationMode: wrongAssosiation.data.assosiationConfiguration.anonymizationMode,
            anonymizationDelayDays: wrongAssosiation.data.assosiationConfiguration.anonymizationDelayDays,
        });

        global.__ASSOSIATION__ = staticData.fk_assosiation;
    });

    it("should reject requests with insufficient role", async () => {
        global.__ROLE__ = AuthRole.user;

        await expect(getAnonymizationConfig()).rejects.toThrow();

        global.__ROLE__ = AuthRole.admin;
    });
});

describe("updateAnonymizationConfig", () => {

    beforeAll(() => {
        global.__ROLE__ = AuthRole.admin;
        global.__ASSOSIATION__ = staticData.fk_assosiation;
    });
    afterAll(() => {
        delete global.__ROLE__;
        delete global.__ASSOSIATION__;
    });

    it("should update returnProcessEnabled", async () => {
        const result = await updateAnonymizationConfig({ returnProcessEnabled: true });

        expect(result.returnProcessEnabled).toBe(true);

        const dbRecord = await prisma.assosiationConfiguration.findUniqueOrThrow({
            where: { assosiationId: staticData.fk_assosiation },
            select: { returnProcessEnabled: true },
        });
        expect(dbRecord.returnProcessEnabled).toBe(true);
    });

    it("should update anonymizationMode to AFTER_DAYS with valid delay", async () => {
        const result = await updateAnonymizationConfig({
            anonymizationMode: "AFTER_DAYS",
            anonymizationDelayDays: 10,
        });

        expect(result.anonymizationMode).toBe("AFTER_DAYS");
        expect(result.anonymizationDelayDays).toBe(10);
    });

    it("should update anonymizationMode to IMMEDIATELY without delay", async () => {
        const result = await updateAnonymizationConfig({ anonymizationMode: "IMMEDIATELY" });

        expect(result.anonymizationMode).toBe("IMMEDIATELY");
    });

    it("should reject AFTER_DAYS mode without anonymizationDelayDays", async () => {
        await expect(
            updateAnonymizationConfig({ anonymizationMode: "AFTER_DAYS" })
        ).rejects.toThrow();
    });

    it("should only update the session org's config and not affect another org", async () => {
        await updateAnonymizationConfig({ returnProcessEnabled: true });

        const otherOrgRecord = await prisma.assosiationConfiguration.findUniqueOrThrow({
            where: { assosiationId: wrongAssosiation.fk_assosiation },
            select: { returnProcessEnabled: true },
        });
        expect(otherOrgRecord.returnProcessEnabled).toBe(
            wrongAssosiation.data.assosiationConfiguration.returnProcessEnabled
        );
    });

    it("should reject requests with insufficient role", async () => {
        global.__ROLE__ = AuthRole.materialManager;

        await expect(updateAnonymizationConfig({ anonymizationMode: "MANUAL" })).rejects.toThrow();

        global.__ROLE__ = AuthRole.admin;
    });
});
