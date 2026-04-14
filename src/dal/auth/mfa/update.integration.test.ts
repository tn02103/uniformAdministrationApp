import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { staticData } from "../../../../vitest/setup-dal-integration";
import { setDefaultMfaMethod, toggleUserMfa } from "./update";

const APP_1_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const APP_2_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

vi.mock("next/headers", () => ({
    headers: vi.fn(async () => ({ get: vi.fn().mockReturnValue(null) })),
}));
vi.mock("next/server", () => ({
    userAgent: vi.fn(() => ({})),
}));

async function cleanupApps() {
    await prisma.twoFactorApp.deleteMany({
        where: { userId: staticData.ids.userIds[0] },
    });
}

async function resetUserMfaState() {
    await prisma.user.update({
        where: { id: staticData.ids.userIds[0] },
        data: { twoFAEnabled: false, default2FAMethod: null },
    });
}

async function resetOrgConfig() {
    await prisma.organisationConfiguration.update({
        where: { organisationId: staticData.ids.organisationId },
        data: { twoFactorAuthRule: "optional" },
    });
}

describe("setDefaultMfaMethod", () => {
    beforeEach(async () => {
        await cleanupApps();
        await resetUserMfaState();
    });

    afterEach(async () => {
        await cleanupApps();
        await resetUserMfaState();
    });

    it("sets default method to 'email'", async () => {
        await setDefaultMfaMethod({ method: "email" });

        const user = await prisma.user.findUnique({
            where: { id: staticData.ids.userIds[0] },
            select: { default2FAMethod: true },
        });
        expect(user?.default2FAMethod).toBe("email");
    });

    it("sets default method to a verified app UUID", async () => {
        await prisma.twoFactorApp.create({
            data: { id: APP_1_ID, userId: staticData.ids.userIds[0], appName: "App1", secret: "S1", verifiedAt: new Date() },
        });

        await setDefaultMfaMethod({ method: APP_1_ID });

        const user = await prisma.user.findUnique({
            where: { id: staticData.ids.userIds[0] },
            select: { default2FAMethod: true },
        });
        expect(user?.default2FAMethod).toBe(APP_1_ID);
    });

    it("throws when app UUID does not exist", async () => {
        await expect(setDefaultMfaMethod({ method: APP_1_ID }))
            .rejects.toThrow("Invalid 2FA method");
    });

    it("throws when app is not verified (verifiedAt is null)", async () => {
        await prisma.twoFactorApp.create({
            data: { id: APP_1_ID, userId: staticData.ids.userIds[0], appName: "App1", secret: "S1", verifiedAt: null },
        });

        await expect(setDefaultMfaMethod({ method: APP_1_ID }))
            .rejects.toThrow("Invalid 2FA method");
    });

    it("throws when app belongs to a different user", async () => {
        await prisma.twoFactorApp.create({
            data: { id: APP_2_ID, userId: staticData.ids.userIds[1], appName: "App2", secret: "S2", verifiedAt: new Date() },
        });

        await expect(setDefaultMfaMethod({ method: APP_2_ID }))
            .rejects.toThrow("Invalid 2FA method");

        // Clean up
        await prisma.twoFactorApp.deleteMany({ where: { userId: staticData.ids.userIds[1] } });
    });
});

describe("toggleUserMfa", () => {
    afterEach(async () => {
        await resetUserMfaState();
        await resetOrgConfig();
        delete global.__ROLE__;
    });

    it("enables MFA and sets twoFAEnabled to true", async () => {
        await toggleUserMfa({ enabled: true });

        const user = await prisma.user.findUnique({
            where: { id: staticData.ids.userIds[0] },
            select: { twoFAEnabled: true },
        });
        expect(user?.twoFAEnabled).toBe(true);
    });

    it("disables MFA when org rule is optional: sets twoFAEnabled=false and default2FAMethod=null", async () => {
        await prisma.user.update({
            where: { id: staticData.ids.userIds[0] },
            data: { twoFAEnabled: true, default2FAMethod: "email" },
        });

        await toggleUserMfa({ enabled: false });

        const user = await prisma.user.findUnique({
            where: { id: staticData.ids.userIds[0] },
            select: { twoFAEnabled: true, default2FAMethod: true },
        });
        expect(user?.twoFAEnabled).toBe(false);
        expect(user?.default2FAMethod).toBeNull();
    });

    it("blocks disabling MFA when org rule is required", async () => {
        await prisma.organisationConfiguration.update({
            where: { organisationId: staticData.ids.organisationId },
            data: { twoFactorAuthRule: "required" },
        });
        await prisma.user.update({
            where: { id: staticData.ids.userIds[0] },
            data: { twoFAEnabled: true },
        });

        await expect(toggleUserMfa({ enabled: false }))
            .rejects.toThrow("organisation requires two-factor authentication");

        const user = await prisma.user.findUnique({
            where: { id: staticData.ids.userIds[0] },
            select: { twoFAEnabled: true },
        });
        expect(user?.twoFAEnabled).toBe(true);
    });

    it("blocks disabling MFA when org rule is administrators and user is admin", async () => {
        global.__ROLE__ = AuthRole.admin;
        await prisma.organisationConfiguration.update({
            where: { organisationId: staticData.ids.organisationId },
            data: { twoFactorAuthRule: "administrators" },
        });
        // Update the session user (userIds[0]) to be an admin for this test
        await prisma.user.update({
            where: { id: staticData.ids.userIds[0] },
            data: { twoFAEnabled: true, role: AuthRole.admin },
        });

        await expect(toggleUserMfa({ enabled: false }))
            .rejects.toThrow("administrators are required");

        // Restore user role
        await prisma.user.update({
            where: { id: staticData.ids.userIds[0] },
            data: { role: AuthRole.materialManager },
        });
    });

    it("allows disabling MFA when org rule is administrators and user is not admin", async () => {
        await prisma.organisationConfiguration.update({
            where: { organisationId: staticData.ids.organisationId },
            data: { twoFactorAuthRule: "administrators" },
        });
        await prisma.user.update({
            where: { id: staticData.ids.userIds[0] },
            data: { twoFAEnabled: true, default2FAMethod: "email" },
        });

        await toggleUserMfa({ enabled: false });

        const user = await prisma.user.findUnique({
            where: { id: staticData.ids.userIds[0] },
            select: { twoFAEnabled: true, default2FAMethod: true },
        });
        expect(user?.twoFAEnabled).toBe(false);
        expect(user?.default2FAMethod).toBeNull();
    });
});
