import test from "playwright/test";
import { uuid } from "uuidv4";
import { StaticDataIdType } from "../testData/staticDataGenerator";
import { StaticData } from "../testData/staticDataLoader";

const fs = require('fs');
const uuidArray = (i: number) => Array(i).fill("").map(() => uuid());


export type DataFixtureType = {
    staticData: StaticData;
}
const dataFixture = test.extend<{}, { staticData: StaticData }>({
    staticData: [async ({ }, use) => {
        const i = Number(process.env.TEST_PARALLEL_INDEX ?? 0);     

        const staticData = new StaticData(i);
        await staticData.resetData();

        await use(staticData);
        if (i > 0) {
            staticData.cleanup.removeAssosiation();
        }
    }, { scope: "worker" }],
});
