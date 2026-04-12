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

test.describe("Profile page rendering", () => {
    test("renders all three sections", async ({ profilePage }) => {
        await expect(profilePage.div_accountInfo).toBeVisible();
        await expect(profilePage.twoFactorSection.div_section).toBeVisible();
        await expect(profilePage.div_devicesSection).toBeVisible();
    });

    test("account info shows name, username, role and organisation", async ({ profilePage, staticData }) => {
        const users = await staticData.data.users();
        const adminUser = users[0]; // test4 – Administrator

        await expect(profilePage.div_accountInfo).toContainText(adminUser.name);
        await expect(profilePage.div_accountInfo).toContainText(adminUser.username);
        await expect(profilePage.div_accountInfo).toContainText(german.common.user.authRole[4]);
        await expect(profilePage.div_accountInfo).toContainText(`Testautomatisation-${staticData.index}`);
    });

    test("devices section lists the admin user's trusted devices", async ({ profilePage }) => {
        await expect(profilePage.div_devicesSection).toContainText("Admin Desktop Chrome");
        await expect(profilePage.div_devicesSection).toContainText("Admin Mobile Safari");
    });
});

test.describe("Two-factor section", () => {
    test("shows 'Aktivieren' button when 2FA is disabled and org rule is optional", async ({ profilePage }) => {
        await expect(profilePage.twoFactorSection.btn_toggle).toBeVisible();
        await expect(profilePage.twoFactorSection.btn_toggle).toContainText(german.profile.twoFactor.enableToggle);
    });

    test("toggle button is hidden when org twoFactorAuthRule is 'required'", async ({ page, staticData: { index, organisationId } }) => {
        await prisma.organisationConfiguration.update({
            where: { organisationId },
            data: { twoFactorAuthRule: "required" },
        });
        try {
            await page.goto(`/de/test${index}/profile`);
            const profilePage = new ProfilePage(page);
            await expect(profilePage.twoFactorSection.btn_toggle).not.toBeVisible();
        } finally {
            // Restore the org config regardless of test outcome
            await prisma.organisationConfiguration.update({
                where: { organisationId },
                data: { twoFactorAuthRule: "optional" },
            });
        }
    });

    test("clicking 'Deaktivieren' shows warning confirmation dialog", async ({ page, staticData: { index, ids } }) => {
        await prisma.user.update({
            where: { id: ids.userIds[0] },
            data: { twoFAEnabled: true },
        });

        await page.goto(`/de/test${index}/profile`);
        const profilePage = new ProfilePage(page);

        await expect(profilePage.twoFactorSection.btn_toggle).toContainText(german.profile.twoFactor.disableToggle);
        await profilePage.twoFactorSection.btn_toggle.click();

        await expect(profilePage.twoFactorSection.div_warningModal).toBeVisible();
        await expect(profilePage.twoFactorSection.div_warningModal).toContainText(
            german.profile.twoFactor.confirmDisable.header
        );
    });

    test("cancelling the deactivation warning keeps 2FA enabled", async ({ page, staticData: { index, ids } }) => {
        await prisma.user.update({
            where: { id: ids.userIds[0] },
            data: { twoFAEnabled: true },
        });

        await page.goto(`/de/test${index}/profile`);
        const profilePage = new ProfilePage(page);

        await profilePage.twoFactorSection.btn_toggle.click();
        await profilePage.twoFactorSection.btn_warningCancel.click();

        await expect(profilePage.twoFactorSection.div_warningModal).toBeHidden();
        // Toggle still reads "Deaktivieren" – 2FA is still enabled
        await expect(profilePage.twoFactorSection.btn_toggle).toContainText(german.profile.twoFactor.disableToggle);
    });

    test("clicking delete on a TOTP app shows warning confirmation dialog", async ({ page, staticData: { index, ids } }) => {
        await prisma.twoFactorApp.create({
            data: {
                userId: ids.userIds[0],
                appName: "Test App",
                secret: "TESTSECRETABCDEFGH",
                verifiedAt: new Date(),
            },
        });

        try {
            await page.goto(`/de/test${index}/profile`);
            const profilePage = new ProfilePage(page);

            await profilePage.twoFactorSection.appDeleteButton("Test App").click();

            await expect(profilePage.twoFactorSection.div_warningModal).toBeVisible();
            await expect(profilePage.twoFactorSection.div_warningModal).toContainText(
                german.profile.twoFactor.confirmRemoveApp.header
            );
        } finally {
            // Must delete before cleanup.user() fires (ON DELETE RESTRICT)
            await prisma.twoFactorApp.deleteMany({
                where: { userId: ids.userIds[0] },
            });
        }
    });
});
