import { Page, test as setup } from 'playwright/test';
import { LoginPage } from './pages/login.page';
import { cleanupData } from './testData/cleanupStatic';
import { AuthRole } from '@/lib/AuthRoles';
import { StaticDataLoader } from './testData/staticDataLoader';
import { uuid } from 'uuidv4';
var fs = require('fs');

export const userAuthFile = 'playwright/.auth/0/user.json';
export const inspectorAuthFile = 'playwright/.auth/0/inspector.json';
export const materialAuthFile = 'playwright/.auth/0/material.json';
export const adminAuthFile = 'playwright/.auth/0/admin.json';

setup.use({ storageState: { cookies: [], origins: [] } });

export const getAuthFile = (role: AuthRole, index: number) => {
    const getRoleName = () => {
        switch (role) {
            case AuthRole.admin: return "admin";
            case AuthRole.materialManager: return "material";
            case AuthRole.inspector: return "inspector";
            case AuthRole.user: return "user";
        }
    }

    return `playwright/.auth/${index}/${getRoleName()}.json`;
}

/*setup.beforeAll(async () => {
    await cleanupData();

    // TODO replace 4 with amount of workers
    for (let i = 0; i < 4; i++) {
        if (!fs.existsSync(`playwright/.auth/${i}`)) {
            await fs.mkdirSync(`playwright/.auth/${i}`, { recursive: true });
        }

        if (!fs.existsSync(getAuthFile(AuthRole.user, i))) {
            await fs.writeFileSync(getAuthFile(AuthRole.user, i), "{}");
        }
        if (!fs.existsSync(getAuthFile(AuthRole.inspector, i))) {
            await fs.writeFileSync(getAuthFile(AuthRole.inspector, i), "{}");
        }
        if (!fs.existsSync(getAuthFile(AuthRole.materialManager, i))) {
            await fs.writeFileSync(getAuthFile(AuthRole.materialManager, i), "{}");
        }
        if (!fs.existsSync(getAuthFile(AuthRole.admin, i))) {
            await fs.writeFileSync(getAuthFile(AuthRole.admin, i), "{}");
        }
    }
});*/

export type authenticatedFixture = { page: Page, staticData: StaticDataLoader }
export const dataFixture = setup.extend<{ staticData: StaticDataLoader }>({
    staticData: async ({ }, use) => {
        const i = Number(process.env.TEST_PARALLEL_INDEX ?? 0);
        console.log("worker using index ", i);
        await cleanupData(i);

        const staticData = new StaticDataLoader(i);
        await use(staticData);
    },
});

export const adminTest = dataFixture.extend<authenticatedFixture>({
    page: async ({ page, staticData }, use) => {
        const body = {
            username: 'test4',
            assosiation: staticData.fk_assosiation,
            password: process.env.TEST_USER_PASSWORD as string,
            deviceId: uuid(),
        };

        const response = await page.request.post('http://localhost:3021/api/auth/login', { data: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
        if (response.status() !== 200)
            throw Error("Failed to authenticate");

        await page.goto('/de/app/admin/uniform');
        use(page);
    },
});
export const managerTest = dataFixture.extend<authenticatedFixture>({
    page: async ({ page, staticData }, use) => {
        const body = {
            username: 'test3',
            assosiation: staticData.fk_assosiation,
            password: process.env.TEST_USER_PASSWORD as string,
            deviceId: uuid(),
        };

        const response = await page.request.post('http://localhost:3021/api/auth/login', { data: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
        if (response.status() !== 200)
            throw Error("Failed to authenticate");

        await page.goto('/de/app/admin/uniform');
        use(page);
    },
});
export const inspectorTest = dataFixture.extend<authenticatedFixture>({
    page: async ({ page, staticData }, use) => {
        const body = {
            username: 'test2',
            assosiation: staticData.fk_assosiation,
            password: process.env.TEST_USER_PASSWORD as string,
            deviceId: uuid(),
        };

        const response = await page.request.post('http://localhost:3021/api/auth/login', { data: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
        if (response.status() !== 200)
            throw Error("Failed to authenticate");

        await page.goto('/de/app/admin/uniform');
        use(page);
    },
});

export const userTest = dataFixture.extend<authenticatedFixture>({
    page: async ({ page, staticData }, use) => {
        const body = {
            username: 'test1',
            assosiation: staticData.fk_assosiation,
            password: process.env.TEST_USER_PASSWORD as string,
            deviceId: uuid(),
        };

        const response = await page.request.post('http://localhost:3021/api/auth/login', { data: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
        if (response.status() !== 200)
            throw Error("Failed to authenticate");

        await page.goto('/de/app/admin/uniform');
        use(page);
    },
});


setup.skip('authenticate as user', async ({ page }) => {
    await page.context().clearCookies();
    (await page.context().storageState()).origins = [];
    await new LoginPage(page).userLogin();
    await page.waitForURL("/de/app/cadet");
    await page.context().storageState({ path: userAuthFile });
});
setup.skip('authenticate as inspector', async ({ page }) => {
    await page.context().clearCookies();
    (await page.context().storageState()).origins = [];
    await new LoginPage(page).inspectorLogin();
    await page.waitForURL("/de/app/cadet");
    await page.context().storageState({ path: inspectorAuthFile });
});
setup.skip('authenticate as material', async ({ page }) => {
    await page.context().clearCookies();
    (await page.context().storageState()).origins = [];
    await new LoginPage(page).materialLogin();
    await page.waitForURL("/de/app/cadet");
    await page.context().storageState({ path: materialAuthFile });
});
setup.skip('authenticate as admin', async ({ page }) => {
    await page.context().clearCookies();
    (await page.context().storageState()).origins = [];
    await new LoginPage(page).adminLogin();
    await page.waitForURL("/de/app/cadet");
    await page.context().storageState({ path: adminAuthFile });
});
