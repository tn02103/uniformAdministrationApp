import { Page, test as setup, APIRequestContext } from 'playwright/test';
import { v4 as uuid } from "uuid";
import { StaticData } from './testData/staticDataLoader';

setup.use({ storageState: { cookies: [], origins: [] } });
export type authenticatedFixture = { page: Page, staticData: StaticData }

async function loginWithRetry(request: APIRequestContext, body: object, maxRetries = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const response = await request.post('http://localhost:3021/api/auth/login', {
            data: JSON.stringify(body),
            headers: { 'content-type': 'application/json' },
        });
        if (response.status() === 200) return;

        const responseText = await response.text();
        if (attempt === maxRetries) {
            throw Error(`Failed to authenticate (status ${response.status()}) after ${maxRetries} attempts, response: ${responseText}`);
        }
        console.warn(`Auth attempt ${attempt}/${maxRetries} failed (status ${response.status()}), retrying in ${attempt}s...`);
        await new Promise(r => setTimeout(r, 1000 * attempt));
    }
}

export const dataFixture = setup.extend<object, { staticData: StaticData }>({
    staticData: [async ({ }, use) => {
        const i = process.env.TEST_PARALLEL_INDEX;
        if (!i) throw new Error("Could not get TEST_PARALLEL_INDEX: " + i);

        const index = Number(i);
        const staticData = new StaticData(index);
        await staticData.resetData();

        await use(staticData);
        if (index >= 0) {
            await staticData.cleanup.removeAssosiation();
        }
    }, { scope: "worker" }],
});

export const adminTest = dataFixture.extend<authenticatedFixture>({
    page: async ({ page, staticData }, use) => {
        await loginWithRetry(page.request, {
            username: 'test4',
            assosiation: staticData.fk_assosiation,
            password: process.env.TEST_USER_PASSWORD ?? "Test!234" as string,
            deviceId: uuid(),
        });
        await use(page);
    },
});
export const managerTest = dataFixture.extend<authenticatedFixture>({
    page: async ({ page, staticData }, use) => {
        await loginWithRetry(page.request, {
            username: 'test3',
            assosiation: staticData.fk_assosiation,
            password: process.env.TEST_USER_PASSWORD ?? "Test!234" as string,
            deviceId: uuid(),
        });
        await use(page);
    },
});
export const inspectorTest = dataFixture.extend<authenticatedFixture>({
    page: async ({ page, staticData }, use) => {
        await loginWithRetry(page.request, {
            username: 'test2',
            assosiation: staticData.fk_assosiation,
            password: process.env.TEST_USER_PASSWORD ?? "Test!234" as string,
            deviceId: uuid(),
        });
        await use(page);
    },
});

export const userTest = dataFixture.extend<authenticatedFixture>({
    page: async ({ page, staticData }, use) => {
        await loginWithRetry(page.request, {
            username: 'test1',
            assosiation: staticData.fk_assosiation,
            password: process.env.TEST_USER_PASSWORD ?? "Test!234" as string,
            deviceId: uuid(),
        });
        await use(page);
    },
});
