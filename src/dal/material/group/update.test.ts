import { runServerActionTest } from "@/dal/_helper/testHelper";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { update } from "./update";

const staticData = new StaticData(0);
const defaultProps = {
    id: staticData.ids.materialGroupIds[0],
    data: {
        description: 'new Description',
        issuedDefault: 7,
        multitypeAllowed: true,
    }
}

afterEach(() => staticData.cleanup.materialConfig());
it('valid update call', async () => {
    const { success, result } = await runServerActionTest(update(defaultProps));
    expect(success).toBeTruthy();

    const dbData = await prisma.materialGroup.findUnique({
        where: { id: defaultProps.id }
    });
    expect(dbData).not.toBeNull();
    expect(dbData?.description).toBe(defaultProps.data.description);
    expect(dbData!.issuedDefault).toBe(defaultProps.data.issuedDefault);
    expect(dbData!.multitypeAllowed).toBe(defaultProps.data.multitypeAllowed);
});
it('should prevent duplication error', async () => {
    const props = { ...defaultProps, data: { ...defaultProps.data, description: "Gruppe3" } };
    const { success, result } = await runServerActionTest(update(props));
    expect(success).toBeFalsy();
    expect(result.error).toBeDefined();
    expect(result.error.formElement).toBe('description');
    expect(result.error.message).toBe('custom.material.groupname.duplication');
});
it('should succeed duplication with deleted group', async () => {
    const props = { ...defaultProps, data: { ...defaultProps.data, description: "Gruppe4" } };
    const { success, result } = await runServerActionTest(update(props));
    expect(success).toBeTruthy();
});
