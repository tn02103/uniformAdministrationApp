import { Page, test as setup } from 'playwright/test';
import { v4 as uuid } from "uuid";
import StaticDataIds from './testData/staticDataIds.json';
import { StaticData } from './testData/staticDataLoader';
import { StaticDataIdType, getStaticDataIds } from './testData/staticDataGenerator';
const fs = require('fs');

setup.use({ storageState: { cookies: [], origins: [] } });

const uuidArray = (i: number) => Array(i).fill("").map(() => uuid());


export type authenticatedFixture = { page: Page, staticData: StaticData }

export const dataFixture = setup.extend<{}, { staticData: StaticData }>({
    staticData: [async ({ }, use) => {
        const i = process.env.TEST_PARALLEL_INDEX;
        if (!i) throw new Error("Could not get TEST_PARALLEL_INDEX: " + i);

        const index = Number(i);

        while (index >= StaticDataIds.length) {
            const ids: StaticDataIdType[] = StaticDataIds;
            ids.push(getStaticDataIds());
            await fs.writeFileSync('tests/testData/staticDataIds.json', JSON.stringify(ids, null, 4));
        }

        const staticData = new StaticData(index);
        await staticData.resetData();

        await use(staticData);
        if (index > 0) {
            await staticData.cleanup.removeAssosiation();
        }
    }, { scope: "worker" }],
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
