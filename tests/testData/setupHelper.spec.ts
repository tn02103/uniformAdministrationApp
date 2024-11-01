import test from "playwright/test";
import { StaticDataIdType, getStaticDataIds } from "./staticDataGenerator";
const fs = require('fs');


test.skip('generateTestIdSet', async () => {
    if (!fs.existsSync('./tests/testData/staticDataIds.json')) {
        fs.writeFileSync('./tests/testData/staticDataIds.json', '[]');
    }
    const ids: StaticDataIdType[] = require('../testData/staticDataIds.json');

    ids.push(getStaticDataIds());
    console.log("🚀 ~ test.only ~ ids.length:", ids.length)
    await fs.writeFileSync('./tests/testData/staticDataIds.json', JSON.stringify(ids, null, 4));
});
