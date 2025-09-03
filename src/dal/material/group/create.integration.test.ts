import { runServerActionTest } from "@/dal/_helper/testHelper";
import { create } from "./create";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { uuidValidationPattern } from "@/lib/validations";
import { prisma } from "@/lib/db";

const staticData = new StaticData(0);
beforeEach(() => prisma.materialGroup.update({
    where: { id: staticData.ids.materialGroupIds[1] },
    data: { description: "Gruppe-1" }
}));
afterEach(() => staticData.cleanup.materialConfig());
it('create working', async () => {
    const { success, result } = await runServerActionTest(create());
    expect(success).toBeTruthy();
    expect(result).toStrictEqual(expect.objectContaining({
        id: expect.stringMatching(uuidValidationPattern),
        description: 'Gruppe-2',
        sortOrder: 4,
        multitypeAllowed: false,
        organisationId: staticData.organisationId,
        issuedDefault: null,
        recdelete: null,
        recdeleteUser: null,
    }));
});


