import { test as setup } from 'playwright/test';
import { LoginPage } from './pages/login.page';
import { cleanupData } from './testData/cleanupStatic';
var fs = require('fs');

export const userAuthFile = 'playwright/.auth/user.json';
export const inspectorAuthFile = 'playwright/.auth/inspector.json';
export const materialAuthFile = 'playwright/.auth/material.json';
export const adminAuthFile = 'playwright/.auth/admin.json';

setup.use({ storageState: { cookies: [], origins: [] } });
setup.beforeAll(async () => {
    await cleanupData();
    if (!fs.existsSync('playwright/.auth')) {
        await fs.mkdirSync('playwright/.auth', { recursive: true });
    }
    if (!fs.existsSync(userAuthFile)) {
        await fs.writeFileSync(userAuthFile, "{}");
    }
    if (!fs.existsSync(inspectorAuthFile)) {
        await fs.writeFileSync(inspectorAuthFile, "{}");
    }
    if (!fs.existsSync(materialAuthFile)) {
        await fs.writeFileSync(materialAuthFile, "{}");
    }
    if (!fs.existsSync(adminAuthFile)) {
        await fs.writeFileSync(adminAuthFile, "{}");
    }
});

setup('authenticate as user', async ({ page }) => {
    await page.context().clearCookies();
    (await page.context().storageState()).origins = [];
    await new LoginPage(page).userLogin("/de/app/cadet");
    await page.waitForURL("/de/app/cadet");
    await page.context().storageState({ path: userAuthFile });
});
setup('authenticate as inspector', async ({ page }) => {
    await page.context().clearCookies();
    (await page.context().storageState()).origins = [];
    await new LoginPage(page).inspectorLogin("/de/app/cadet");
    await page.waitForURL("/de/app/cadet");
    await page.context().storageState({ path: inspectorAuthFile });
});
setup('authenticate as material', async ({ page }) => {
    await page.context().clearCookies();
    (await page.context().storageState()).origins = [];
    await new LoginPage(page).materialLogin("/de/app/cadet");
    await page.waitForURL("/de/app/cadet");
    await page.context().storageState({ path: materialAuthFile });
});
setup('authenticate as admin', async ({ page }) => {
    await page.context().clearCookies();
    (await page.context().storageState()).origins = [];
    await new LoginPage(page).adminLogin("/de/app/cadet");
    await page.waitForURL("/de/app/cadet");
    await page.context().storageState({ path: adminAuthFile });
});
