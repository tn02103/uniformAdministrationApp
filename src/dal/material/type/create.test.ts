import { runServerActionTest } from "@/dal/_helper/testHelper";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { create } from "./create";
import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";

const { ids, cleanup } = new StaticData(0);
const defaultProps = {
    groupId: ids.materialGroupIds[1],
    data: {
        typename: "NewType1",
        actualQuantity: 300,
        targetQuantity: 100,
    }
}

afterEach(() => cleanup.materialConfig());
it('should work', async () => {

    const { success } = await runServerActionTest(create(defaultProps));
    expect(success).toBeTruthy();

    const dbData = await prisma.material.findFirst({
        where: {
            fk_materialGroup: defaultProps.groupId,
            typename: defaultProps.data.typename,
        }
    });
    expect(dbData).not.toBeNull();
    dbData?.recdelete
    expect(dbData).toEqual(expect.objectContaining({
        ...defaultProps.data,
        id: expect.stringMatching(uuidValidationPattern),
        fk_materialGroup: defaultProps.groupId,
        recdelete: null,
        recdeleteUser: null,
        sortOrder: 3
    }));
});
it('should prevent name duplication', async () => {
    const props = { ...defaultProps, data: { ...defaultProps.data, typename: "Typ2-2" } };
    const { success, result } = await runServerActionTest(create(props));
    expect(success).toBeFalsy();
    expect(result.error).toBeDefined();
    expect(result.error.formElement).toEqual('typename');
    expect(result.error.message).toBe('custom.material.typename.duplication');
});
it('should succed with name duplication from deleted type', async () => {
    const props = { ...defaultProps, data: { ...defaultProps.data, typename: "Typ2-4" } };
    const { success } = await runServerActionTest(create(props));
    expect(success).toBeTruthy();
    const dbData = await prisma.material.findFirst({
        where: {
            fk_materialGroup: defaultProps.groupId,
            typename: 'Typ2-4',
            id: { not: ids.materialIds[10] }
        }
    });
    expect(dbData).not.toBeNull();
});
it('should prevent creation when group is marked as deleted', async () => {
    const props = {
        groupId: ids.materialGroupIds[3],
        data: { ...defaultProps.data, typename: "Typ4-2" }
    };
    const { success } = await runServerActionTest(create(props));
    expect(success).toBeFalsy();
});
