import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import german from "../../../public/locales/de";
import { ProfilePage } from "../../_playwrightConfig/pages/profile/profile.page";
import { adminTest } from "../../_playwrightConfig/setup";

type Fixture = { profilePage: ProfilePage };

const test = adminTest.extend<Fixture>({
    profilePage: ({ page }, use) => use(new ProfilePage(page)),
});

test.beforeEach(async ({ page, staticData: { index } }) => {
    await page.goto(`/de/test${index}/profile`);
});

test.afterEach(async ({ staticData: { cleanup } }) => {
    await cleanup.user();
});

test("shows all sections with correct account info and devices", async ({ profilePage, staticData }) => {
    const users = await staticData.data.users();
    const adminUser = users[0];

    await expect(profilePage.div_accountInfo).toBeVisible();
    await expect(profilePage.div_accountInfo).toContainText(adminUser.name);
    await expect(profilePage.div_accountInfo).toContainText(adminUser.username);
    await expect(profilePage.div_accountInfo).toContainText(`Testautomatisation-${staticData.index}`);

    await expect(profilePage.mfaSection.div_section).toBeVisible();

    await expect(profilePage.div_devicesSection).toBeVisible();
    await expect(profilePage.div_devicesSection).toContainText("Admin Desktop Chrome");
    await expect(profilePage.div_devicesSection).toContainText("Admin Mobile Safari");
});

test.describe("MFA actions", () => {
    test("enable MFA: updates DB and shows disable toggle", async ({ profilePage, staticData: { ids } }) => {
        await profilePage.mfaSection.btn_toggle.click();

        // Wait for the UI to reflect the change before querying the DB
        await expect(profilePage.mfaSection.btn_toggle).toContainText(german.profile.twoFactor.disableToggle);
        const user = await prisma.user.findUnique({
            where: { id: ids.userIds[0] },
            select: { twoFAEnabled: true },
        });
        expect(user?.twoFAEnabled).toBe(true);
    });

    test("disable MFA: confirm warning → updates DB and shows enable toggle", async ({ profilePage, staticData: { index, ids } }) => {
        await prisma.user.update({
            where: { id: ids.userIds[0] },
            data: { twoFAEnabled: true },
        });
        await profilePage.page.reload();

        await profilePage.mfaSection.btn_toggle.click();
        await profilePage.mfaSection.btn_warningConfirm.click();

        // Wait for the UI to reflect the change before querying the DB
        await expect(profilePage.mfaSection.btn_toggle).toContainText(german.profile.twoFactor.enableToggle);
        const user = await prisma.user.findUnique({
            where: { id: ids.userIds[0] },
            select: { twoFAEnabled: true },
        });
        expect(user?.twoFAEnabled).toBe(false);
    });

    test("remove TOTP app: confirm warning → app deleted from DB and empty-state shown", async ({ profilePage, staticData: { index, ids } }) => {
        const app = await prisma.twoFactorApp.create({
            data: {
                userId: ids.userIds[0],
                appName: "Test App",
                secret: "TESTSECRETABCDEFGH",
                verifiedAt: new Date(),
            },
        });

        try {
            await profilePage.page.reload();

            await profilePage.mfaSection.appDeleteButton("Test App").click();
            await profilePage.mfaSection.btn_warningConfirm.click();

            // Wait for the UI to reflect deletion before querying the DB
            await expect(profilePage.mfaSection.txt_noApps).toBeVisible();
            const deleted = await prisma.twoFactorApp.findUnique({ where: { id: app.id } });
            expect(deleted).toBeNull();
        } finally {
            // Guard: ensure no leftover apps block cleanup.user() (ON DELETE RESTRICT)
            await prisma.twoFactorApp.deleteMany({ where: { userId: ids.userIds[0] } });
        }
    });

    test("change default MFA method: updates DB", async ({ profilePage, staticData: { index, ids } }) => {
        const app = await prisma.twoFactorApp.create({
            data: {
                userId: ids.userIds[0],
                appName: "My TOTP App",
                secret: "TESTSECRETABCDEFGH",
                verifiedAt: new Date(),
            },
        });
        await prisma.user.update({
            where: { id: ids.userIds[0] },
            data: { twoFAEnabled: true, default2FAMethod: "email" },
        });

        try {
            await profilePage.page.reload();

            await profilePage.mfaSection.sel_defaultMethod.selectOption(app.id);
            // wait for server action to complete and write to DB
            await expect(profilePage.page.locator('.Toastify__toast--success')).toBeVisible();

            const user = await prisma.user.findUnique({
                where: { id: ids.userIds[0] },
                select: { default2FAMethod: true },
            });
            expect(user?.default2FAMethod).toBe(app.id);
        } finally {
            await prisma.twoFactorApp.deleteMany({ where: { userId: ids.userIds[0] } });
        }
    });
});

test.describe("MFA backend enforcement", () => {
    test("toggle button is hidden when org rule is 'required'", async ({ profilePage, staticData: { index, organisationId } }) => {
        await prisma.organisationConfiguration.update({
            where: { organisationId },
            data: { twoFactorAuthRule: "required" },
        });
        try {
            await profilePage.page.goto(`/de/test${index}/profile`);
            await expect(profilePage.mfaSection.btn_toggle).toBeHidden();
        } finally {
            await prisma.organisationConfiguration.update({
                where: { organisationId },
                data: { twoFactorAuthRule: "optional" },
            });
        }
    });
});
