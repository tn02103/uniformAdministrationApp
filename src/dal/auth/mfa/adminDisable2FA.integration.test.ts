import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { staticData, wrongOrganisation } from "../../../../vitest/setup-dal-integration";
import { adminDisableUserTwoFA } from "./adminDisable2FA";

const APP_D1_ID = "c1000000-0000-4000-8000-000000000001";

vi.mock("next/headers", () => ({
    headers: vi.fn(async () => ({ get: vi.fn().mockReturnValue(null) })),
}));
vi.mock("next/server", () => ({
    userAgent: vi.fn(() => ({})),
}));

const targetUserId = staticData.ids.userIds[1];

async function resetUserMfaState() {
    await prisma.user.update({
        where: { id: targetUserId },
        data: { twoFAEnabled: false, default2FAMethod: null },
    });
}

describe("adminDisableUserTwoFA", () => {
    beforeAll(() => {
        global.__ROLE__ = AuthRole.admin;
    });

    afterAll(() => {
        delete global.__ROLE__;
    });

    afterEach(async () => {
        await resetUserMfaState();
        await prisma.twoFactorApp.deleteMany({ where: { id: APP_D1_ID } });
    });

    it("sets twoFAEnabled=false and default2FAMethod=null, returns { success: true }", async () => {
        await prisma.user.update({
            where: { id: targetUserId },
            data: { twoFAEnabled: true, default2FAMethod: "email" },
        });

        const result = await adminDisableUserTwoFA({ userId: targetUserId });

        expect(result).toEqual({ success: true });

        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { twoFAEnabled: true, default2FAMethod: true },
        });
        expect(user?.twoFAEnabled).toBe(false);
        expect(user?.default2FAMethod).toBeNull();
    });

    it("does NOT delete TwoFactorApp records", async () => {
        await prisma.twoFactorApp.create({
            data: { id: APP_D1_ID, userId: targetUserId, appName: "DisableTest1", secret: "S1", verifiedAt: new Date() },
        });
        await prisma.user.update({
            where: { id: targetUserId },
            data: { twoFAEnabled: true, default2FAMethod: APP_D1_ID },
        });

        await adminDisableUserTwoFA({ userId: targetUserId });

        const app = await prisma.twoFactorApp.findUnique({ where: { id: APP_D1_ID } });
        expect(app).not.toBeNull();
    });

    it("rejects when caller is not an admin", async () => {
        global.__ROLE__ = AuthRole.materialManager;

        await expect(adminDisableUserTwoFA({ userId: targetUserId }))
            .rejects.toThrow();

        global.__ROLE__ = AuthRole.admin;
    });

    it("rejects when target userId belongs to a different organisation (cross-org)", async () => {
        const wrongOrgUserId = wrongOrganisation.ids.userIds[0];

        await expect(adminDisableUserTwoFA({ userId: wrongOrgUserId }))
            .rejects.toThrow();
    });
});
