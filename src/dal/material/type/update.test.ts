import { runServerActionTest } from "@/dal/_helper/testHelper";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { update } from "./update";

const staticData = new StaticData(0);
const materialId = staticData.ids.materialIds[5];
const defaultProps = {
    id: materialId,
    data: {
        typename: 'NewTypename1',
        actualQuantity: 204,
        targetQuantity: 99,
    }
}

afterEach(() => staticData.cleanup.materialConfig());
it('should save data', async () => {
    const { success } = await runServerActionTest(update(defaultProps));
    expect(success).toBeTruthy();

    const dbData = await prisma.material.findUnique({
        where: { id: materialId },
    });
    expect(dbData).not.toBeNull();
    expect(dbData).toEqual(expect.objectContaining({
        ...defaultProps.data,
        id: materialId,
        fk_materialGroup: staticData.ids.materialGroupIds[1],
        sortOrder: 1,
        recdelete: null,
        recdeleteUser: null,
    }));
});

it('should prevent duplicated names', async () => {
    const props = { ...defaultProps, data: { ...defaultProps.data, typename: "Typ2-1" } };
    const { success, result } = await runServerActionTest(update(props));
    expect(success).toBeFalsy();
    expect(result.error).toBeDefined();
    expect(result.error.formElement).toBe('typename');
    expect(result.error.message).toBe('custom.material.typename.duplication');
});

it('should allowed duplicated names with deleted type', async () => {
    const props = { ...defaultProps, data: { ...defaultProps.data, typename: "Typ2-4" } };
    const { success } = await runServerActionTest(update(props));
    expect(success).toBeTruthy();

    const dbData = await prisma.material.findUnique({
        where: { id: materialId },
    });
    expect(dbData).not.toBeNull();
    expect(dbData?.typename).toEqual('Typ2-4');
});
