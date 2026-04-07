import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import { UserAdministrationPage } from "../../_playwrightConfig/pages/admin/user/userAdministration.page";
import { adminTest, managerTest } from "../../_playwrightConfig/setup";
import { setTimeout } from "timers/promises";

type Fixture = {
    userPage: UserAdministrationPage;
};

const test = adminTest.extend<Fixture>({
    userPage: ({ page }, use) => use(new UserAdministrationPage(page)),
});

test.beforeEach(async ({ page }) => {
    await page.goto('/de/app/admin/user');
});

test.afterEach(async ({ staticData: { cleanup } }) => {
    await cleanup.user();
});

managerTest('validate manager is not authorized', async ({ page }) => {
    await page.goto('/de/app/admin/user');
    await expect(page.getByTestId('div_403Page')).toBeVisible();
});

test.describe('User administration page', () => {

    test('table shows all users and offcanvas can be opened', async ({ userPage, staticData }) => {
        const users = await staticData.data.users();

        await expect(userPage.table).toBeVisible();

        await test.step('all users are listed in the table', async () => {
            for (const user of users) {
                await expect.soft(userPage.userRow(user.username)).toBeVisible();
            }
        });

        await test.step('clicking open shows the offcanvas for that user', async () => {
            const firstUser = users[0];
            await userPage.btn_openUser(firstUser.username).click();

            await expect(userPage.offcanvas).toBeVisible();
            await expect(userPage.oc_heading(firstUser.name)).toBeVisible();
        });
    });

    test('create user', async ({ userPage, staticData: { organisationId } }) => {
        const newUser = {
            name: 'New Test User',
            username: 'newtestuser',
            email: 'newtestuser@test.com',
            password: 'Test!234',
        };

        await test.step('open create offcanvas', async () => {
            await userPage.btn_create.click();
            await expect(userPage.oc_heading_create).toBeVisible();
        });

        await test.step('fill form and submit', async () => {
            await userPage.oc_inp_name.fill(newUser.name);
            await userPage.oc_inp_username.fill(newUser.username);
            await userPage.oc_inp_email.fill(newUser.email);
            await userPage.oc_inp_password.fill(newUser.password);
            await userPage.oc_btn_create.click();
        });

        await test.step('offcanvas closes and new user appears in table', async () => {
            await userPage.offcanvas.waitFor({ state: 'hidden' });
            await expect(userPage.userRow(newUser.username)).toBeVisible();
        });

        await test.step('validate db', async () => {
            const dbUser = await prisma.user.findFirst({
                where: { organisationId, username: newUser.username },
            });
            expect(dbUser).not.toBeNull();
            expect(dbUser).toMatchObject({
                name: newUser.name,
                email: newUser.email,
                active: true,
            });
        });
    });

    // Not Jet implemented. 
    test.fixme('delete user', async ({ userPage, staticData }) => {
        const users = await staticData.data.users();
        const targetUser = users[3]; // test1 - role Nutzer, non-admin

        await test.step('open offcanvas for user', async () => {
            await userPage.btn_openUser(targetUser.username).click();
            await expect(userPage.oc_heading(targetUser.name)).toBeVisible();
        });

        await test.step('click delete and confirm in danger dialog', async () => {
            await userPage.oc_btn_delete.click();
            await expect(userPage.dangerModal.div_popup).toBeVisible();
            await userPage.dangerModal.txt_confirmation.fill(targetUser.name);
            await userPage.dangerModal.btn_save.click();
        });

        await test.step('offcanvas closes and user is removed from table', async () => {
            await userPage.offcanvas.waitFor({ state: 'hidden' });
            await expect(userPage.userRow(targetUser.username)).toBeHidden();
        });

        await test.step('validate db', async () => {
            const dbUser = await prisma.user.findUnique({ where: { id: targetUser.id } });
            expect(dbUser).toBeNull();
        });
    });

    test('update user', async ({ userPage, staticData }) => {
        const users = await staticData.data.users();
        const targetUser = users[3]; // test1 - role Nutzer, non-admin
        const updatedName = 'Updated Test Name';

        await test.step('open offcanvas and enable editing', async () => {
            await userPage.btn_openUser(targetUser.username).click();
            await expect(userPage.oc_heading(targetUser.name)).toBeVisible();
            await userPage.oc_btn_edit.click();
        });

        await test.step('change name and save', async () => {
            await userPage.oc_inp_name.fill(updatedName);
            await userPage.oc_btn_save.click();
        });

        await test.step('offcanvas shows updated name after save', async () => {
            await userPage.oc_btn_save.waitFor({ state: 'hidden' });
            await expect(userPage.oc_heading(updatedName)).toBeVisible();
            await expect(userPage.oc_inp_name).toHaveValue(updatedName);
        });

        await test.step('validate db', async () => {
            const dbUser = await prisma.user.findUnique({ where: { id: targetUser.id } });
            expect(dbUser?.name).toBe(updatedName);
        });
    });

    test('username and email cannot be duplicated', async ({ userPage, staticData }) => {
        const users = await staticData.data.users();
        const existingUser = users[0]; // test4 - admin; used as the source of existing username/email
        const targetUser = users[3];  // test1 - Nutzer; used for update duplication tests

        await test.step('create: duplicate username is rejected', async () => {
            await userPage.btn_create.click();
            await userPage.oc_inp_name.fill('New User');
            await userPage.oc_inp_username.fill(existingUser.username);
            await userPage.oc_inp_email.fill('unique@example.com');
            await userPage.oc_inp_password.fill('Test!234');
            await userPage.oc_btn_create.click();
            await expect(userPage.oc_err_username).toBeVisible();
            await userPage.oc_btn_cancel.click();
            await userPage.offcanvas.waitFor({ state: 'hidden' });
        });

        await test.step('create: duplicate email is rejected', async () => {
            await userPage.btn_create.click();
            await userPage.oc_inp_name.fill('New User');
            await userPage.oc_inp_username.fill('uniqueuser');
            await userPage.oc_inp_email.fill(existingUser.email);
            await userPage.oc_inp_password.fill('Test!234');
            await userPage.oc_btn_create.click();
            await expect(userPage.oc_err_email).toBeVisible();
            await userPage.oc_btn_cancel.click();
            await userPage.offcanvas.waitFor({ state: 'hidden' });
        });

        await test.step('update: duplicate username is rejected', async () => {
            await userPage.btn_openUser(targetUser.username).click();
            await userPage.oc_btn_edit.click();
            await userPage.oc_inp_username.fill(existingUser.username);
            await userPage.oc_btn_save.click();
            await expect(userPage.oc_err_username).toBeVisible();
            // cancel to reset back to view mode, keeping offcanvas open for next step
            await userPage.oc_btn_cancel.click();
        });

        await test.step('update: duplicate email is rejected', async () => {
            // offcanvas is still open for targetUser in view mode after the previous cancel
            await userPage.oc_btn_edit.click();
            await userPage.oc_inp_email.fill(existingUser.email);
            await userPage.oc_btn_save.click();
            await expect(userPage.oc_err_email).toBeVisible();
        });
    });
});