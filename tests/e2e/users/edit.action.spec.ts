import { prisma } from "@/lib/db";
import { User } from "@prisma/client";
import bcrypt from 'bcrypt';
import { ViewportSize, expect } from "playwright/test";
import german from "../../../public/locales/de";
import { viewports } from "../../_playwrightConfig/global/helper";
import { newNameValidationTests, passwordTests, usernameTests } from "../../_playwrightConfig/global/testSets";
import { UserAdministrationPage } from "../../_playwrightConfig/pages/admin/user/userAdministration.page";
import { adminTest } from "../../_playwrightConfig/setup";

type Fixture = {
    userPage: UserAdministrationPage;
    users: User[];
}
const test = adminTest.extend<Fixture>({
    userPage: ({ page }, use) => use(new UserAdministrationPage(page)),
    users: async ({ staticData }, use) => use(await staticData.data.users() as User[]),
});
test.beforeEach(async ({ page }) => {
    await page.goto('de/app/admin/user');
})
test.afterEach(async ({ staticData: { cleanup } }) => {
    await cleanup.user();
});

test('validate visibleItems', async ({ page, userPage, staticData: { ids } }) => {
    const userId = ids.userIds[0]
    await test.step('normal', async () => {
        await Promise.all([
            expect(userPage.txt_user_username(userId)).toBeVisible(),
            expect(userPage.txt_user_name(userId)).toBeVisible(),
            expect(userPage.div_user_role(userId)).toBeVisible(),
            expect(userPage.div_user_active(userId)).toBeVisible(),
            expect(userPage.sel_user_role(userId)).not.toBeVisible(),
            expect(userPage.sel_user_active(userId)).not.toBeVisible(),

            expect(userPage.txt_user_username(userId)).toBeDisabled(),
            expect(userPage.txt_user_name(userId)).toBeDisabled(),
            expect(userPage.txt_user_username(userId)).toHaveClass('form-control-plaintext'),
            expect(userPage.txt_user_name(userId)).toHaveClass('form-control-plaintext'),

            expect(userPage.btn_user_cancel(userId)).not.toBeVisible(),
            expect(userPage.btn_user_save(userId)).not.toBeVisible(),
            expect(userPage.btn_user_menu(userId)).toBeVisible(),
        ]);
    });
    await test.step('editable', async () => {
        await userPage.btn_user_menu(userId).click();
        await userPage.btn_user_menu_edit(userId).click();

        await Promise.all([
            expect(userPage.txt_user_username(userId)).toBeVisible(),
            expect(userPage.txt_user_name(userId)).toBeVisible(),
            expect(userPage.div_user_role(userId)).not.toBeVisible(),
            expect(userPage.div_user_active(userId)).not.toBeVisible(),
            expect(userPage.sel_user_role(userId)).toBeVisible(),
            expect(userPage.sel_user_active(userId)).toBeVisible(),

            expect(userPage.txt_user_username(userId)).toBeDisabled(),
            expect(userPage.txt_user_name(userId)).toBeEnabled(),
            expect(userPage.txt_user_username(userId)).not.toHaveClass('form-control-plaintext'),
            expect(userPage.txt_user_name(userId)).not.toHaveClass('form-control-plaintext'),

            expect(userPage.btn_user_cancel(userId)).toBeVisible(),
            expect(userPage.btn_user_save(userId)).toBeVisible(),
            expect(userPage.btn_user_menu(userId)).not.toBeVisible(),
        ]);
    });
    await test.step('editable mobile', async () => {
        await page.setViewportSize(viewports.xs);

        await Promise.all([
            expect(userPage.txt_user_username(userId)).toBeVisible(),
            expect(userPage.txt_user_name(userId)).toBeVisible(),
            expect(userPage.sel_user_role(userId)).toBeVisible(),
            expect(userPage.sel_user_active(userId)).toBeVisible(),
        ]);
    });
    await test.step('new', async () => {
        await userPage.btn_create.click();
        await Promise.all([
            expect(userPage.txt_user_username("new")).toBeVisible(),
            expect(userPage.txt_user_name("new")).toBeVisible(),
            expect(userPage.sel_user_role("new")).toBeVisible(),
            expect(userPage.sel_user_active("new")).toBeVisible(),

            expect(userPage.txt_user_username("new")).toBeEnabled(),
            expect(userPage.txt_user_name("new")).toBeEnabled(),
            expect(userPage.txt_user_username("new")).not.toHaveClass('form-control-plaintext'),
            expect(userPage.txt_user_name("new")).not.toHaveClass('form-control-plaintext'),

            expect(userPage.btn_user_cancel("new")).toBeVisible(),
            expect(userPage.btn_user_save("new")).toBeVisible(),
        ]);
    });
});

test('user formValidations', async ({ page, userPage, staticData: { ids } }) => {
    await userPage.btn_create.click();

    for (const [mobile, view] of [[false, viewports.xxl], [true, viewports.xs]]) {
        await page.setViewportSize(view as ViewportSize);
        await test.step(`username ${mobile ? "mobile" : "desktop"}`, async () => {
            for (const set of usernameTests) {
                await test.step(set.testValue, async () => {
                    await userPage.txt_user_username("new").fill(set.testValue);

                    if (set.valid) {
                        await expect(userPage.err_user_username("new", mobile as boolean)).not.toBeVisible();
                    } else {
                        await expect(userPage.err_user_username("new", mobile as boolean)).toBeVisible();
                    }
                });
            }
        });
        await test.step(`name ${mobile ? "mobile" : "desktop"}`, async () => {
            const testSets = newNameValidationTests({ minLength: 1, maxLength: 20 });
            for (const set of testSets) {
                await test.step(set.testValue, async () => {
                    await userPage.txt_user_name("new").fill(set.testValue);

                    if (set.valid) {
                        await expect(userPage.err_user_name("new", mobile as boolean)).not.toBeVisible();
                    } else {
                        await expect(userPage.err_user_name("new", mobile as boolean)).toBeVisible();
                    }
                });
            }
        });
    }
});
test('password formValidation', async ({ userPage, staticData: { ids } }) => {
    await userPage.openUserPasswordModal(ids.userIds[0]);
    for (const set of passwordTests) {
        await test.step(set.testValue, async () => {
            await userPage.passwordPopup.txt_password.fill(set.testValue);
            await userPage.passwordPopup.div_header.click();

            if (set.valid) {
                await expect.soft(userPage.passwordPopup.err_password).not.toBeVisible();
            } else {
                await expect.soft(userPage.passwordPopup.err_password).toBeVisible();
            }
        });
    }
    await userPage.passwordPopup.txt_password.fill('TestPassword1');

    await test.step('confirmation: required', async () => {
        await userPage.passwordPopup.txt_confirmationPassword.fill('');
        await userPage.passwordPopup.btn_save.click();

        await expect(userPage.passwordPopup.err_confirmationPassword).toBeVisible();
    });

    await test.step('confirmation: different Passwords', async () => {
        await userPage.passwordPopup.txt_confirmationPassword.fill('TestPassword2');
        await userPage.passwordPopup.btn_save.click();

        await expect.soft(userPage.passwordPopup.err_confirmation).toBeVisible();
    });
});
test('cancel function', async ({ userPage, staticData: { ids, index } }) => {
    await test.step('change data and cancel', async () => {
        await userPage.btn_user_menu(ids.userIds[0]).click();
        await userPage.btn_user_menu_edit(ids.userIds[0]).click();

        await userPage.txt_user_name(ids.userIds[0]).fill('Test Changed');
        await userPage.sel_user_active(ids.userIds[0]).selectOption('false');
        await userPage.sel_user_role(ids.userIds[0]).selectOption('2');
        await userPage.btn_user_cancel(ids.userIds[0]).click();
    });

    await test.step('validate ui', async () => {
        await expect(userPage.txt_user_username(ids.userIds[0])).toHaveValue('test4');
        await expect(userPage.txt_user_name(ids.userIds[0])).toHaveValue(`Test ${index} Admin`);
        await expect(userPage.div_user_active(ids.userIds[0])).toContainText(german.common.user.active.true);
        await expect(userPage.div_user_role(ids.userIds[0])).toContainText(german.common.user.authRole[4]);
    });
});

test.describe('save function', async () => {
    [true, false].map((mobile) =>
        test(mobile ? "mobile" : "desktop", async ({ page, userPage, staticData: { ids } }) => {
            await page.setViewportSize(mobile ? viewports.sm : viewports.xxl);

            await test.step('change data', async () => {
                await userPage.btn_user_menu(ids.userIds[0]).click();
                await userPage.btn_user_menu_edit(ids.userIds[0]).click();

                await userPage.txt_user_name(ids.userIds[0]).fill('Test Changed');
                await userPage.sel_user_role(ids.userIds[0]).selectOption('2');
                await userPage.sel_user_active(ids.userIds[0]).selectOption('false');
                await userPage.btn_user_save(ids.userIds[0]).click();
                await expect(page.locator('.Toastify__toast--success')).toBeVisible();
            });

            await test.step('validate ui', async () => {
                await expect(userPage.txt_user_name(ids.userIds[0])).toHaveValue('Test Changed');
                if (!mobile) {
                    await expect(userPage.div_user_role(ids.userIds[0])).toContainText(german.common.user.authRole['2']);
                    await expect(userPage.div_user_active(ids.userIds[0])).toContainText(german.common.user.active.false);
                }
            });
            await test.step('validate db', async () => {
                const dbUser = await prisma.user.findUniqueOrThrow({
                    where: { id: ids.userIds[0] }
                });

                expect(dbUser).toStrictEqual(expect.objectContaining({
                    username: 'test4',
                    name: 'Test Changed',
                    role: 2,
                    active: false
                }));
            });
        })
    );
});
test('changePassword', async ({ userPage, staticData: { ids, index } }) => {
    await test.step('change Password', async () => {
        await userPage.openUserPasswordModal(ids.userIds[0]);

        await expect(userPage.passwordPopup.div_header).toHaveText(german.modals.changePassword.header.change.replace('{user}', `Test ${index} Admin`));

        await userPage.passwordPopup.txt_password.fill('newPassword123');
        await userPage.passwordPopup.txt_confirmationPassword.fill('newPassword123');
        await userPage.passwordPopup.btn_save.click();
        await expect(userPage.passwordPopup.div_popup).not.toBeVisible();
    });
    await test.step('validate db', async () => {
        const dbUser = await prisma.user.findUniqueOrThrow({
            where: { id: ids.userIds[0] }
        });

        expect(await bcrypt.compare("newPassword123", dbUser.password)).toBeTruthy();
    });
});
test('create new user', async ({ userPage, page, staticData: { fk_assosiation } }) => {
    await test.step('fill Data', async () => {
        await userPage.btn_create.click();

        await expect(userPage.div_user("new")).toBeVisible();
        await userPage.txt_user_username("new").fill('test9');
        await userPage.txt_user_name('new').fill('Test newUser');
        await userPage.sel_user_role('new').selectOption('3');
        await userPage.sel_user_active('new').selectOption('true');
        await userPage.btn_user_save('new').click();
    });

    await test.step('set Password and save', async () => {
        await expect(userPage.passwordPopup.div_popup).toBeVisible();
        await userPage.passwordPopup.txt_password.fill('TestPassword1');
        await userPage.passwordPopup.txt_confirmationPassword.fill('TestPassword1');

        await userPage.passwordPopup.btn_save.click();
        await expect(userPage.passwordPopup.div_popup).not.toBeVisible();
    });

    await test.step('validate ui and db', async () => {
        const dbUser = await prisma.user.findFirst({
            where: { username: 'test9', fk_assosiation }
        });

        await expect(dbUser).not.toBeNull();

        await expect(userPage.div_user(dbUser!.id)).toBeVisible();
        await expect(userPage.txt_user_username(dbUser!.id)).toHaveValue('test9');
        await expect(userPage.txt_user_name(dbUser!.id)).toHaveValue('Test newUser');
        await expect(userPage.div_user_role(dbUser!.id)).toContainText(german.common.user.authRole['3']);
        await expect(userPage.div_user_active(dbUser!.id)).toContainText(german.common.user.active.true);

        await expect(dbUser).toStrictEqual(expect.objectContaining({
            username: 'test9',
            name: 'Test newUser',
            role: 3,
            active: true,
        }));
    });
});
