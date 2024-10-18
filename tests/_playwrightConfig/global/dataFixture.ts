import test from "playwright/test";
import { uuid } from "uuidv4";
import { StaticDataIdType } from "../testData/staticDataGenerator";
import StaticDataIds from '../testData/staticDataIds.json';
import { StaticData } from "../testData/staticDataLoader";

const fs = require('fs');
const uuidArray = (i: number) => Array(i).fill("").map(() => uuid());


export type DataFixtureType = {
    staticData: StaticData;
}
export const dataFixture = test.extend<{}, { staticData: StaticData }>({
    staticData: [async ({ }, use) => {
        const i = Number(process.env.TEST_PARALLEL_INDEX ?? 0);

        while (i >= StaticDataIds.length) {
            const ids: StaticDataIdType[] = StaticDataIds;
            ids.push({
                fk_assosiation: uuid(),
                cadetIds: uuidArray(10),
                userIds: uuidArray(5),
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
            staticData.cleanup.removeAssosiation();
        }
    }, { scope: "worker" }],
});
