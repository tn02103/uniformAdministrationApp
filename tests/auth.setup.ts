import { Page, test as setup } from 'playwright/test';
import { uuid } from 'uuidv4';
import { cleanupData } from './testData/cleanupStatic';
import { StaticDataLoader } from './testData/staticDataLoader';

setup.use({ storageState: { cookies: [], origins: [] } });

export type authenticatedFixture = { page: Page, staticData: StaticDataLoader }
export const dataFixture = setup.extend<{ staticData: StaticDataLoader }>({
    staticData: async ({ }, use) => {
        const i = Number(process.env.TEST_PARALLEL_INDEX ?? 0);
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

        use(page);
    },
});
