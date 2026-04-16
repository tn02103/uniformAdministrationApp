import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { staticData, wrongOrganisation } from "../../../../vitest/setup-dal-integration";
import { adminGetUserTwoFactorApps } from "./adminGetApps";

const APP_A1_ID = "a1000000-0000-4000-8000-000000000001";
const APP_A2_ID = "a1000000-0000-4000-8000-000000000002";

vi.mock("next/headers", () => ({
    headers: vi.fn(async () => ({ get: vi.fn().mockReturnValue(null) })),
}));
vi.mock("next/server", () => ({
    userAgent: vi.fn(() => ({})),
}));

const targetUserId = staticData.ids.userIds[1];

async function cleanupApps() {
    await prisma.twoFactorApp.deleteMany({
        where: { id: { in: [APP_A1_ID, APP_A2_ID] } },
    });
}

describe("adminGetUserTwoFactorApps", () => {
    beforeAll(() => {
        global.__ROLE__ = AuthRole.admin;
    });

    afterAll(() => {
        delete global.__ROLE__;
    });

    beforeEach(async () => {
        await cleanupApps();
    });

    afterEach(async () => {
        await cleanupApps();
    });

    it("returns all apps registered for the target user", async () => {
        await prisma.twoFactorApp.createMany({
            data: [
                { id: APP_A1_ID, userId: targetUserId, appName: "AdminGetApp1", secret: "S1", verifiedAt: new Date("2025-01-01") },
                { id: APP_A2_ID, userId: targetUserId, appName: "AdminGetApp2", secret: "S2", verifiedAt: null },
            ],
        });

        const result = await adminGetUserTwoFactorApps({ userId: targetUserId });

        const ids = result.map((a) => a.id);
        expect(ids).toContain(APP_A1_ID);
        expect(ids).toContain(APP_A2_ID);
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("appName");
        expect(result[0]).toHaveProperty("createdAt");
        expect(result[0]).toHaveProperty("verifiedAt");
    });

    it("returns an empty array when the user has no apps", async () => {
        const result = await adminGetUserTwoFactorApps({ userId: targetUserId });
        expect(result).toEqual([]);
    });

    it("rejects when caller is not an admin", async () => {
        global.__ROLE__ = AuthRole.materialManager;

        await expect(adminGetUserTwoFactorApps({ userId: targetUserId }))
            .rejects.toThrow();

        global.__ROLE__ = AuthRole.admin;
    });

    it("rejects when target userId belongs to a different organisation", async () => {
        const wrongOrgUserId = wrongOrganisation.ids.userIds[0];

        await expect(adminGetUserTwoFactorApps({ userId: wrongOrgUserId }))
            .rejects.toThrow();
    });
});
