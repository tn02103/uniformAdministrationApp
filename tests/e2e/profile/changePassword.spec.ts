import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { expect } from "playwright/test";
import german from "../../../public/locales/de";
import { ProfilePage } from "../../_playwrightConfig/pages/profile/profile.page";
import { adminTest } from "../../_playwrightConfig/setup";

type Fixture = { profilePage: ProfilePage };

const test = adminTest.extend<Fixture>({
    profilePage: ({ page }, use) => use(new ProfilePage(page)),
});

const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? "Test!234";
const NEW_PASSWORD = "NewPassword1";

test.beforeEach(async ({ page, staticData: { index } }) => {
    await page.goto(`/de/test${index}/profile`);
});

test.afterEach(async ({ staticData: { cleanup } }) => {
    await cleanup.user();
});

test.describe("Change Password", () => {
    test('cancel closes the modal', async ({ profilePage }) => {
        await profilePage.openChangePasswordModal();

        await profilePage.changePasswordModal.btn_cancel.click();

        await expect(profilePage.changePasswordModal.div_modal).toBeHidden();
    });

    test('shows currentPassword error when wrong current password is submitted', async ({ profilePage }) => {
        await profilePage.openChangePasswordModal();

        await test.step('submit with incorrect current password', async () => {
            await profilePage.changePasswordModal.fill('WrongPassword1!', NEW_PASSWORD, NEW_PASSWORD);
            await profilePage.changePasswordModal.btn_submit.click();
        });

        await test.step('validate server error on currentPassword field', async () => {
            await expect(profilePage.changePasswordModal.err_currentPassword).toBeVisible();
            await expect(profilePage.changePasswordModal.err_currentPassword).toContainText(
                german.common.error.custom.auth.invalidCurrentPassword
            );
            await expect(profilePage.changePasswordModal.div_modal).toBeVisible();
        });
    });

    test('successfully changes password', async ({ page, profilePage, staticData: { ids } }) => {
        await profilePage.openChangePasswordModal();

        await test.step('submit valid form', async () => {
            await profilePage.changePasswordModal.fill(TEST_PASSWORD, NEW_PASSWORD, NEW_PASSWORD);
            await profilePage.changePasswordModal.btn_submit.click();
        });

        await test.step('validate modal closes and success toast appears', async () => {
            await expect(profilePage.changePasswordModal.div_modal).toBeHidden();
            await expect(page.locator('.Toastify__toast--success')).toBeVisible();
        });

        await test.step('validate password updated in database', async () => {
            const dbUser = await prisma.user.findUniqueOrThrow({
                where: { id: ids.userIds[0] },
                select: { password: true },
            });
            expect(await bcrypt.compare(NEW_PASSWORD, dbUser.password)).toBeTruthy();
        });
    });
});