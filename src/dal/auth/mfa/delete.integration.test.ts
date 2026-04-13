import { prisma } from "@/lib/db";
import { staticData, wrongOrganisation } from "../../../../vitest/setup-dal-integration";
import { removeMfaApp } from "./delete";

const APP_1_ID = "11111111-1111-4111-8111-111111111101";
const APP_2_ID = "22222222-2222-4222-8222-222222222202";

vi.mock("next/headers", () => ({
    headers: vi.fn(async () => ({ get: vi.fn().mockReturnValue(null) })),
}));
vi.mock("next/server", () => ({
    userAgent: vi.fn(() => ({})),
}));

async function cleanupApps() {
    await prisma.twoFactorApp.deleteMany({
        where: { userId: { in: [staticData.ids.userIds[0], staticData.ids.userIds[1], wrongOrganisation.ids.userIds[0]] } },
    });
}

describe("removeMfaApp", () => {
    beforeEach(async () => {
        await cleanupApps();
        await prisma.user.update({
            where: { id: staticData.ids.userIds[0] },
            data: { default2FAMethod: null },
        });
    });

    afterEach(async () => {
        await cleanupApps();
        await prisma.user.update({
            where: { id: staticData.ids.userIds[0] },
            data: { default2FAMethod: null },
        });
    });

    it("removes the app and returns { success: true }", async () => {
        await prisma.twoFactorApp.create({
            data: { id: APP_1_ID, userId: staticData.ids.userIds[0], appName: "App1", secret: "SECRET1", verifiedAt: new Date() },
        });

        const result = await removeMfaApp({ appId: APP_1_ID });

        expect(result).toEqual({ success: true });
        const deleted = await prisma.twoFactorApp.findUnique({ where: { id: APP_1_ID } });
        expect(deleted).toBeNull();
    });

    it("also removes unverified apps", async () => {
        await prisma.twoFactorApp.create({
            data: { id: APP_1_ID, userId: staticData.ids.userIds[0], appName: "App1", secret: "SECRET1", verifiedAt: null },
        });

        const result = await removeMfaApp({ appId: APP_1_ID });

        expect(result).toEqual({ success: true });
        const deleted = await prisma.twoFactorApp.findUnique({ where: { id: APP_1_ID } });
        expect(deleted).toBeNull();
    });

    it("reassigns default to the most recently verified remaining app when deleted app was the default", async () => {
        await prisma.twoFactorApp.createMany({
            data: [
                { id: APP_1_ID, userId: staticData.ids.userIds[0], appName: "App1", secret: "S1", verifiedAt: new Date("2025-01-01") },
                { id: APP_2_ID, userId: staticData.ids.userIds[0], appName: "App2", secret: "S2", verifiedAt: new Date("2025-02-01") },
            ],
        });
        await prisma.user.update({
            where: { id: staticData.ids.userIds[0] },
            data: { default2FAMethod: APP_1_ID },
        });

        await removeMfaApp({ appId: APP_1_ID });

        const user = await prisma.user.findUnique({
            where: { id: staticData.ids.userIds[0] },
            select: { default2FAMethod: true },
        });
        expect(user?.default2FAMethod).toBe(APP_2_ID);
    });

    it("resets default to 'email' when deleted app was the default and no other verified apps remain", async () => {
        await prisma.twoFactorApp.create({
            data: { id: APP_1_ID, userId: staticData.ids.userIds[0], appName: "App1", secret: "S1", verifiedAt: new Date() },
        });
        await prisma.user.update({
            where: { id: staticData.ids.userIds[0] },
            data: { default2FAMethod: APP_1_ID },
        });

        await removeMfaApp({ appId: APP_1_ID });

        const user = await prisma.user.findUnique({
            where: { id: staticData.ids.userIds[0] },
            select: { default2FAMethod: true },
        });
        expect(user?.default2FAMethod).toBe("email");
    });

    it("does not update default2FAMethod when the deleted app was not the default", async () => {
        await prisma.twoFactorApp.createMany({
            data: [
                { id: APP_1_ID, userId: staticData.ids.userIds[0], appName: "App1", secret: "S1", verifiedAt: new Date("2025-01-01") },
                { id: APP_2_ID, userId: staticData.ids.userIds[0], appName: "App2", secret: "S2", verifiedAt: new Date("2025-02-01") },
            ],
        });
        await prisma.user.update({
            where: { id: staticData.ids.userIds[0] },
            data: { default2FAMethod: APP_2_ID },
        });

        await removeMfaApp({ appId: APP_1_ID });

        const user = await prisma.user.findUnique({
            where: { id: staticData.ids.userIds[0] },
            select: { default2FAMethod: true },
        });
        expect(user?.default2FAMethod).toBe(APP_2_ID);
    });

    it("throws when app not found", async () => {
        await expect(removeMfaApp({ appId: APP_1_ID }))
            .rejects.toThrow("Two-factor app not found");
    });

    it("throws when app belongs to a different user (org isolation)", async () => {
        // App belongs to a different user in the same org
        await prisma.twoFactorApp.create({
            data: { id: APP_1_ID, userId: staticData.ids.userIds[1], appName: "App1", secret: "S1", verifiedAt: new Date() },
        });
        // Also clean up for this user in afterEach is handled by cleanupApps

        await expect(removeMfaApp({ appId: APP_1_ID }))
            .rejects.toThrow("Two-factor app does not belong to the current user");
    });
});
