import { User } from "@prisma/client";
import { expect } from "playwright/test";
import t from "../../../public/locales/de";
import { UserAdministrationPage } from "../../_playwrightConfig/pages/admin/user/userAdministration.page";
import { adminTest, managerTest } from "../../_playwrightConfig/setup";


type Fixture = {
    userPage: UserAdministrationPage;
    users: User[];
}
const test = adminTest.extend<Fixture>({
    userPage: ({ page }, use) => use(new UserAdministrationPage(page)),
    users: async ({ staticData }, use) => use(await staticData.data.users() as User[]),
});
test.beforeEach(async ({ page }) => {
    await page.goto('/de/app/admin/user');
})

managerTest('validate Manager not authorized', async ({ page }) => {
    await page.goto('/de/app/admin/user');
    await expect(page.getByTestId('div_403Page')).toBeVisible();
});
test('validate Data', async ({ page, userPage, users }) => {
    await Promise.all(
        users.map(async (user) =>
            test.step(user.username, async () => {
                await expect(userPage.div_user(user.id)).toBeVisible();
                await Promise.all([
                    expect.soft(userPage.txt_user_username(user.id)).toHaveValue(user.username),
                    expect.soft(userPage.txt_user_name(user.id)).toHaveValue(user.name),
                    expect.soft(userPage.div_user_role(user.id)).toContainText(t.common.user.authRole[user.role as 1 | 2 | 3 | 4]),
                    expect.soft(userPage.div_user_active(user.id)).toContainText(t.common.user.active[user.active ? "true" : "false"]),
                ]);
            })
        )
    );
});

test('validate Displaysizes', async ({ page, userPage, users }) => {
    await test.step('Displaysize xxl', async () => {
        await page.setViewportSize({ height: 800, width: 1500 });

        await Promise.all([
            expect.soft(userPage.div_user(users[0].id)).toBeVisible(),
            expect.soft(userPage.txt_user_username(users[0].id)).toBeVisible(),
            expect.soft(userPage.txt_user_name(users[0].id)).toBeVisible(),
            expect.soft(userPage.div_user_role(users[0].id)).toBeVisible(),
            expect.soft(userPage.div_user_active(users[0].id)).toBeVisible(),
            expect.soft(userPage.btn_user_menu(users[0].id)).toBeVisible(),
        ]);
    });
    await test.step('Displaysize xl', async () => {
        await page.setViewportSize({ height: 800, width: 1300 });

        await Promise.all([
            expect.soft(userPage.div_user(users[0].id)).toBeVisible(),
            expect.soft(userPage.txt_user_username(users[0].id)).toBeVisible(),
            expect.soft(userPage.txt_user_name(users[0].id)).toBeVisible(),
            expect.soft(userPage.div_user_role(users[0].id)).toBeVisible(),
            expect.soft(userPage.div_user_active(users[0].id)).toBeVisible(),
            expect.soft(userPage.btn_user_menu(users[0].id)).toBeVisible(),
        ]);
    });
    await test.step('Displaysize lg', async () => {
        await page.setViewportSize({ height: 800, width: 1000 });

        await Promise.all([
            expect.soft(userPage.div_user(users[0].id)).toBeVisible(),
            expect.soft(userPage.txt_user_username(users[0].id)).toBeVisible(),
            expect.soft(userPage.txt_user_name(users[0].id)).toBeVisible(),
            expect.soft(userPage.div_user_role(users[0].id)).toBeVisible(),
            expect.soft(userPage.div_user_active(users[0].id)).toBeVisible(),
            expect.soft(userPage.btn_user_menu(users[0].id)).toBeVisible(),
        ]);
    });
    await test.step('Displaysize md', async () => {
        await page.setViewportSize({ height: 800, width: 800 });

        await Promise.all([
            expect.soft(userPage.div_user(users[0].id)).toBeVisible(),
            expect.soft(userPage.txt_user_username(users[0].id)).toBeVisible(),
            expect.soft(userPage.txt_user_name(users[0].id)).toBeVisible(),
            expect.soft(userPage.div_user_role(users[0].id)).toBeVisible(),
            expect.soft(userPage.div_user_active(users[0].id)).toBeVisible(),
            expect.soft(userPage.btn_user_menu(users[0].id)).toBeVisible(),
        ]);
    });
    await test.step('Displaysize sm', async () => {
        await page.setViewportSize({ height: 800, width: 600 });

        await Promise.all([
            expect.soft(userPage.div_user(users[0].id)).toBeVisible(),
            expect.soft(userPage.txt_user_username(users[0].id)).toBeVisible(),
            expect.soft(userPage.txt_user_name(users[0].id)).toBeVisible(),
            expect.soft(userPage.div_user_role(users[0].id)).not.toBeVisible(),
            expect.soft(userPage.div_user_active(users[0].id)).toBeVisible(),
            expect.soft(userPage.btn_user_menu(users[0].id)).toBeVisible(),
        ]);
    });
    await test.step('Displaysize xs', async () => {
        await page.setViewportSize({ height: 800, width: 500 });

        await Promise.all([
            expect.soft(userPage.div_user(users[0].id)).toBeVisible(),
            expect.soft(userPage.txt_user_username(users[0].id)).toBeVisible(),
            expect.soft(userPage.txt_user_name(users[0].id)).toBeVisible(),
            expect.soft(userPage.div_user_role(users[0].id)).not.toBeVisible(),
            expect.soft(userPage.div_user_active(users[0].id)).not.toBeVisible(),
            expect.soft(userPage.btn_user_menu(users[0].id)).toBeVisible(),
        ]);
    });
});
