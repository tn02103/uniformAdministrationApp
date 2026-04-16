import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { staticData, wrongOrganisation } from "../../../../vitest/setup-dal-integration";
import { adminRemoveTwoFactorApp } from "./adminReset2FA";

const APP_R1_ID = "b1000000-0000-4000-8000-000000000001";
const APP_R2_ID = "b1000000-0000-4000-8000-000000000002";
const APP_R3_ID = "b1000000-0000-4000-8000-000000000003";
const APP_R4_ID = "b1000000-0000-4000-8000-000000000004";

vi.mock("next/headers", () => ({
    headers: vi.fn(async () => ({ get: vi.fn().mockReturnValue(null) })),
}));
vi.mock("next/server", () => ({
    userAgent: vi.fn(() => ({})),
}));

const targetUserId = staticData.ids.userIds[1];

async function cleanupApps() {
    await prisma.twoFactorApp.deleteMany({
        where: { id: { in: [APP_R1_ID, APP_R2_ID, APP_R3_ID, APP_R4_ID] } },
    });
}

async function resetUserMfaState() {
    await prisma.user.update({
        where: { id: targetUserId },
        data: { default2FAMethod: null, twoFAEnabled: false },
    });
}

describe("adminRemoveTwoFactorApp", () => {
    beforeAll(() => {
        global.__ROLE__ = AuthRole.admin;
    });

    afterAll(() => {
        delete global.__ROLE__;
    });

    beforeEach(async () => {
        await cleanupApps();
        await resetUserMfaState();
    });

    afterEach(async () => {
        await cleanupApps();
        await resetUserMfaState();
    });

    it("removes the app and returns { success: true }", async () => {
        await prisma.twoFactorApp.create({
            data: { id: APP_R1_ID, userId: targetUserId, appName: "AdminReset1", secret: "S1", verifiedAt: new Date() },
        });

        const result = await adminRemoveTwoFactorApp({ userId: targetUserId, appId: APP_R1_ID });

        expect(result).toEqual({ success: true });
        const deleted = await prisma.twoFactorApp.findUnique({ where: { id: APP_R1_ID } });
        expect(deleted).toBeNull();
    });

    it("reassigns default to most recently verified remaining app when deleted app was the default", async () => {
        await prisma.twoFactorApp.createMany({
            data: [
                { id: APP_R1_ID, userId: targetUserId, appName: "AdminReset1", secret: "S1", verifiedAt: new Date("2025-01-01") },
                { id: APP_R2_ID, userId: targetUserId, appName: "AdminReset2", secret: "S2", verifiedAt: new Date("2025-02-01") },
                { id: APP_R3_ID, userId: targetUserId, appName: "AdminReset3", secret: "S3", verifiedAt: new Date("2025-06-01") },
                { id: APP_R4_ID, userId: targetUserId, appName: "AdminReset4", secret: "S4", verifiedAt: new Date("2025-04-01") },
            ],
        });
        await prisma.user.update({
            where: { id: targetUserId },
            data: { default2FAMethod: APP_R1_ID },
        });

        await adminRemoveTwoFactorApp({ userId: targetUserId, appId: APP_R1_ID });

        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { default2FAMethod: true },
        });
        expect(user?.default2FAMethod).toBe(APP_R3_ID); // App_R3 is most recently verified
    });

    it("resets default to 'email' when deleted app was the default and no other verified apps remain", async () => {
        await prisma.twoFactorApp.create({
            data: { id: APP_R1_ID, userId: targetUserId, appName: "AdminReset1", secret: "S1", verifiedAt: new Date() },
        });
        await prisma.user.update({
            where: { id: targetUserId },
            data: { default2FAMethod: APP_R1_ID },
        });

        await adminRemoveTwoFactorApp({ userId: targetUserId, appId: APP_R1_ID });

        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { default2FAMethod: true },
        });
        expect(user?.default2FAMethod).toBe("email");
    });

    it("does not update default2FAMethod when deleted app was not the default", async () => {
        await prisma.twoFactorApp.createMany({
            data: [
                { id: APP_R1_ID, userId: targetUserId, appName: "AdminReset1", secret: "S1", verifiedAt: new Date("2025-01-01") },
                { id: APP_R2_ID, userId: targetUserId, appName: "AdminReset2", secret: "S2", verifiedAt: new Date("2025-02-01") },
            ],
        });
        await prisma.user.update({
            where: { id: targetUserId },
            data: { default2FAMethod: APP_R2_ID },
        });

        await adminRemoveTwoFactorApp({ userId: targetUserId, appId: APP_R1_ID });

        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { default2FAMethod: true },
        });
        expect(user?.default2FAMethod).toBe(APP_R2_ID);
    });

    it("throws when app not found", async () => {
        await expect(adminRemoveTwoFactorApp({ userId: targetUserId, appId: APP_R1_ID }))
            .rejects.toThrow("Two-factor app not found");
    });

    it("throws when appId belongs to a different user", async () => {
        // Create app under userIds[0] (the admin/caller), not the target user
        await prisma.twoFactorApp.create({
            data: { id: APP_R1_ID, userId: staticData.ids.userIds[0], appName: "AdminReset1", secret: "S1", verifiedAt: new Date() },
        });

        await expect(adminRemoveTwoFactorApp({ userId: targetUserId, appId: APP_R1_ID }))
            .rejects.toThrow("Two-factor app not found");

        await prisma.twoFactorApp.deleteMany({ where: { userId: staticData.ids.userIds[0] } });
    });

    it("rejects when caller is not an admin", async () => {
        global.__ROLE__ = AuthRole.materialManager;

        await expect(adminRemoveTwoFactorApp({ userId: targetUserId, appId: APP_R1_ID }))
            .rejects.toThrow();

        global.__ROLE__ = AuthRole.admin;
    });

    it("rejects when target userId belongs to a different organisation (cross-org)", async () => {
        const wrongOrgUserId = wrongOrganisation.ids.userIds[0];

        await expect(adminRemoveTwoFactorApp({ userId: wrongOrgUserId, appId: APP_R1_ID }))
            .rejects.toThrow();
    });
});
