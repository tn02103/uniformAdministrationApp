import { Page, test as setup } from 'playwright/test';
import { v4 as uuid } from "uuid";
import StaticDataIds from './testData/staticDataIds.json';
import { StaticData } from './testData/staticDataLoader';
const fs = require('fs');

setup.use({ storageState: { cookies: [], origins: [] } });

const uuidArray = (i: number) => Array(i).fill("").map(() => uuid());

export type StaticDataIdType = {
    fk_assosiation: string;
    userIds: string[];
    cadetIds: string[];
    deficiencyIds: string[];
    deficiencyTypeIds: string[];
    inspectionIds: string[];
    materialGroupIds: string[];
    materialIds: string[];
    sizeIds: string[];
    sizelistIds: string[];
    uniformGenerationIds: string[];
    uniformIds: string[][];
    uniformTypeIds: string[];
    dynamic: {
        inspectionId: string;
        firstInspection: {
            id: string;
            newDefIds: string[];
        };
        seccondInspection: {
            newDefId: string;
        }
    }
};

export type authenticatedFixture = { page: Page, staticData: StaticData }

export const dataFixture = setup.extend<{}, { staticData: StaticData }>({
    staticData: [async ({ }, use) => {
        const i = Number(process.env.TEST_PARALLEL_INDEX ?? 0);

        while (i >= StaticDataIds.length) {
            const ids: StaticDataIdType[] = StaticDataIds;
            ids.push({
                fk_assosiation: uuid(),
                userIds: uuidArray(5),
                cadetIds: uuidArray(10),
                sizeIds: uuidArray(21),
                sizelistIds: uuidArray(4),
                uniformTypeIds: uuidArray(5),
                uniformGenerationIds: uuidArray(7),
                uniformIds: [87, 16, 66, 13].map((value) => uuidArray(value)),
                materialGroupIds: uuidArray(4),
                materialIds: uuidArray(10),
                deficiencyTypeIds: uuidArray(5),
                deficiencyIds: uuidArray(14),
                inspectionIds: uuidArray(2),
                dynamic: {
                    inspectionId: uuid(),
                    firstInspection: {
                        id: uuid(),
                        newDefIds: uuidArray(5),
                    },
                    seccondInspection: {
                        newDefId: uuid(),
                    }
                }
            });
            await fs.writeFileSync('tests/testData/staticDataIds.json', JSON.stringify(ids, null, 4));
        }

        const staticData = new StaticData(i);
        await staticData.resetData();

        await use(staticData);
        if (i > 0) {
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
