import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import german from "../../../public/locales/de";
import { UserAdministrationPage } from "../../_playwrightConfig/pages/admin/user/userAdministration.page";
import { adminTest } from "../../_playwrightConfig/setup";

const t = german;

type Fixture = { userPage: UserAdministrationPage };

const test = adminTest.extend<Fixture>({
    userPage: ({ page }, use) => use(new UserAdministrationPage(page)),
});

// Target user for 2FA management: test3 (manager, userIds[1])
// The admin (test4) manages test3's 2FA settings from the user offcanvas.
const TARGET_USERNAME = 'test3';

test.beforeEach(async ({ page, staticData: { index } }) => {
    await page.goto(`/de/test${index}/admin/user`);
});

test.afterEach(async ({ staticData: { ids, cleanup } }) => {
    // Remove any leftover TOTP apps before user cleanup (FK constraint)
    await prisma.twoFactorApp.deleteMany({ where: { userId: ids.userIds[1] } });
    await cleanup.user();
});

test.describe('Admin 2FA Management — UserOffcanvas', () => {

    test('view 2FA section: shows status, default method, and TOTP app with verified badge', async ({ userPage, staticData: { ids } }) => {
        // Arrange: give test3 a verified TOTP app and enable 2FA
        const app = await prisma.twoFactorApp.create({
            data: {
                userId: ids.userIds[1],
                appName: 'Work App',
                secret: 'TESTSECRETABCDEFGH',
                verifiedAt: new Date(),
            },
        });
        await prisma.user.update({
            where: { id: ids.userIds[1] },
            data: { twoFAEnabled: true, default2FAMethod: 'email' },
        });

        try {
            // Open offcanvas for test3
            await userPage.btn_openUser(TARGET_USERNAME).click();
            await expect(userPage.offcanvas).toBeVisible();

            // 2FA section heading
            await expect(
                userPage.offcanvas.getByRole('heading', { name: t.admin.user.twoFA.sectionTitle })
            ).toBeVisible();

            // Status badge: enabled
            await expect(
                userPage.offcanvas.getByText(t.admin.user.twoFA.statusEnabled)
            ).toBeVisible();

            // Default method label
            await expect(
                userPage.offcanvas.getByText(t.admin.user.twoFA.defaultMethod, { exact: false })
            ).toBeVisible();

            // TOTP app listed with name and verified badge
            await expect(
                userPage.offcanvas.getByText(app.appName)
            ).toBeVisible();
            await expect(
                userPage.offcanvas.getByText(t.admin.user.twoFA.appVerified)
            ).toBeVisible();
        } finally {
            await prisma.twoFactorApp.deleteMany({ where: { userId: ids.userIds[1] } });
        }
    });

    test('remove TOTP app: confirm dialog → app disappears from list', async ({ userPage, staticData: { ids } }) => {
        // Arrange: create a TOTP app for test3
        const app = await prisma.twoFactorApp.create({
            data: {
                userId: ids.userIds[1],
                appName: 'Phone App',
                secret: 'TESTSECRETABCDEFGH',
                verifiedAt: new Date(),
            },
        });

        try {
            // Open the offcanvas
            await userPage.btn_openUser(TARGET_USERNAME).click();
            await expect(userPage.offcanvas).toBeVisible();

            // Wait for the app list to appear
            await expect(userPage.offcanvas.getByText(app.appName)).toBeVisible();

            // Click the remove button for this app
            const appRow = userPage.offcanvas.locator('div.list-group-item').filter({ hasText: app.appName });
            await expect(appRow).toBeVisible();
            await appRow.getByRole('button', { name: t.admin.user.twoFA.removeApp }).click();

            // Confirm in the message modal
            const modal = userPage.page.getByTestId('div_messageModal_popup');
            await expect(modal).toBeVisible();
            await modal.getByTestId('btn_save').click();

            // Toast success
            await expect(
                userPage.page.locator('.Toastify__toast--success')
            ).toBeVisible();

            // App is gone from the list
            await expect(userPage.offcanvas.getByText(app.appName)).toBeHidden();

            // Verify DB deletion
            const deleted = await prisma.twoFactorApp.findUnique({ where: { id: app.id } });
            expect(deleted).toBeNull();
        } finally {
            await prisma.twoFactorApp.deleteMany({ where: { userId: ids.userIds[1] } });
        }
    });

    test('force-disable 2FA: confirm dialog → success toast and status badge changes to disabled', async ({ userPage, staticData: { ids } }) => {
        // Arrange: enable 2FA for test3 (no TOTP app required)
        await prisma.user.update({
            where: { id: ids.userIds[1] },
            data: { twoFAEnabled: true, default2FAMethod: 'email' },
        });

        // Open the offcanvas
        await userPage.btn_openUser(TARGET_USERNAME).click();
        await expect(userPage.offcanvas).toBeVisible();

        // Verify 2FA is shown as enabled
        await expect(
            userPage.offcanvas.getByText(t.admin.user.twoFA.statusEnabled)
        ).toBeVisible();

        // Click the force-disable button
        await userPage.offcanvas.getByRole('button', { name: t.admin.user.twoFA.forceDisable }).click();

        // Confirm in the message modal
        const modal = userPage.page.getByTestId('div_messageModal_popup');
        await expect(modal).toBeVisible();
        await modal.getByTestId('btn_save').click();

        // Toast success
        await expect(
            userPage.page.locator('.Toastify__toast--success')
        ).toBeVisible();

        // Verify DB state
        const updated = await prisma.user.findUnique({
            where: { id: ids.userIds[1] },
            select: { twoFAEnabled: true, default2FAMethod: true },
        });
        expect(updated?.twoFAEnabled).toBe(false);
        expect(updated?.default2FAMethod).toBeNull();
    });
});
