import { Page, test as setup } from 'playwright/test';
import { v4 as uuid } from "uuid";
import { StaticData } from './testData/staticDataLoader';
import { LoginFormType } from '@/zod/auth';

setup.use({ storageState: { cookies: [], origins: [] } });
export type authenticatedFixture = { page: Page, staticData: StaticData }

export const dataFixture = setup.extend<object, { staticData: StaticData }>({
    staticData: [async ({ }, use) => {
        const i = process.env.TEST_PARALLEL_INDEX;
        if (!i) throw new Error("Could not get TEST_PARALLEL_INDEX: " + i);

        const index = Number(i);
        const staticData = new StaticData(index);
        await staticData.resetData();

        await use(staticData);
        if (index >= 0) {
            await staticData.cleanup.removeOrganisation();
        }
    }, { scope: "worker" }],
});

export const adminTest = dataFixture.extend<authenticatedFixture>({
    page: async ({ page, staticData }, use) => {
        const body: LoginFormType = {
            identifier: 'test4@test.com',
            organisationId: staticData.organisationId,
            password: process.env.TEST_USER_PASSWORD?? "Test!234" as string,
        };

        const response = await page.request.post('http://localhost:3021/api/auth/login', { data: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
        if (response.status() !== 200)
            throw Error("Failed to authenticate");

        use(page);
    },
});
export const managerTest = dataFixture.extend<authenticatedFixture>({
    page: async ({ page, staticData }, use) => {
        const body: LoginFormType = {
            identifier: 'test3@test.com',
            organisationId: staticData.organisationId,
            password: process.env.TEST_USER_PASSWORD?? "Test!234" as string,
        };

        const response = await page.request.post('http://localhost:3021/api/auth/login', { data: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
        if (response.status() !== 200)
            throw Error("Failed to authenticate");

        use(page);
    },
});
export const inspectorTest = dataFixture.extend<authenticatedFixture>({
    page: async ({ page, staticData }, use) => {
        const body: LoginFormType = {
            identifier: 'test2@test.com',
            organisationId: staticData.organisationId,
            password: process.env.TEST_USER_PASSWORD?? "Test!234" as string,
        };

        const response = await page.request.post('http://localhost:3021/api/auth/login', { data: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
        if (response.status() !== 200)
            throw Error("Failed to authenticate");

        use(page);
    },
});

export const userTest = dataFixture.extend<authenticatedFixture>({
    page: async ({ page, staticData }, use) => {
        const body: LoginFormType = {
            identifier: 'test1@test.com',
            organisationId: staticData.organisationId,
            password: process.env.TEST_USER_PASSWORD?? "Test!234" as string,
        };

        const response = await page.request.post('http://localhost:3021/api/auth/login', { data: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
        if (response.status() !== 200)
            throw Error("Failed to authenticate");

        use(page);
    },
});
