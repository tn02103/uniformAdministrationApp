import { prisma } from "@/lib/db";
import { StaticData } from "../../../tests/_playwrightConfig/testData/staticDataLoader";
import { runServerActionTest } from "../_helper/testHelper";
import { deleteUnit } from "./delete";

const {ids, cleanup} = new StaticData(0); 

afterEach(async () => cleanup.storageUnits());
it('deletes a storage unit', async () => {
    const { success, result } = await runServerActionTest(deleteUnit(ids.storageUnitIds[0]));
    expect(success).toBeTruthy();
    expect(result).not.toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                id: ids.storageUnitIds[0],
            })
        ])
    );

    const dbList = await prisma.storageUnit.findMany({
        where: {
            organisationId: ids.organisationId,
            id: ids.storageUnitIds[0],
        }
    });
    expect(dbList.length).toBe(0);
});
