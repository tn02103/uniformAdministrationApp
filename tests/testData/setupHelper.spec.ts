import test from "playwright/test";
import { v4 as uuid } from "uuid";
import { StaticDataIdType } from "../setup";
import StaticDataIds from "./staticDataIds.json";
import { StaticData } from "./staticDataLoader";
const fs = require('fs');


const uuidArray = (i: number) => Array(i).fill("").map(() => uuid());

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
    console.log("🚀 ~ test.only ~ ids.length:", ids.length)
    await fs.writeFileSync('tests/testData/staticDataIds.json', JSON.stringify(ids, null, 4));
});
