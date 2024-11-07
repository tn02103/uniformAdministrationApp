import test from "playwright/test";
import { StaticDataIdType, getStaticDataIds } from "./staticDataGenerator";
import { StaticData } from "./staticDataLoader";
const fs = require('fs');

test.skip('', async () => {
    const staticData = new StaticData(0);
    await staticData.fill.all();
    await staticData.cleanup.removeAssosiation();
})

test.skip('fillDB with static data', async () => {
    const staticData = new StaticData(0);
    await staticData.resetData();
    console.log("finished");
});

test.skip('generateTestIdSet', async () => {
    if (!fs.existsSync('./tests/testData/staticDataIds.json')) {
        fs.writeFileSync('./tests/testData/staticDataIds.json', '[]');
    }
    const ids: StaticDataIdType[] = require('../testData/staticDataIds.json');

    ids.push(getStaticDataIds());
    console.log("🚀 ~ test.only ~ ids.length:", ids.length)
    await fs.writeFileSync('tests/_playwrightConfig/testData/staticDataIds.json', JSON.stringify(ids, null, 4));
});
