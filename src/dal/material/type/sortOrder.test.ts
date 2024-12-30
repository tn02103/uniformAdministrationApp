import { runServerActionTest } from "@/dal/_helper/testHelper";
import { ExceptionType } from "@/errors/CustomException";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { changeMaterialSortOrder } from "./sortOrder";

const staticData = new StaticData(0);
const materialIds = staticData.ids.materialIds;
afterEach(() => staticData.cleanup.materialConfig());
function getMaterialList() {
    return prisma.material.findMany({
        where: { fk_materialGroup: staticData.ids.materialGroupIds[1], recdelete: null },
        orderBy: { sortOrder: "asc" }
    });
}
it('should work upwoards', async () => {
    const { success } = await runServerActionTest(() => changeMaterialSortOrder({ id: materialIds[6], up: true }));
    expect(success).toBeTruthy();

    const materialList = await getMaterialList();
    await expect(materialList[0].id).toEqual(materialIds[4]);
    await expect(materialList[1].id).toEqual(materialIds[6]);
    await expect(materialList[2].id).toEqual(materialIds[5]);
    await expect(materialList[0].sortOrder).toEqual(0);
    await expect(materialList[1].sortOrder).toEqual(1);
    await expect(materialList[2].sortOrder).toEqual(2);
});
it('should work downwoards', async () => {
    const { success } = await runServerActionTest(() => changeMaterialSortOrder({ id: materialIds[4], up: false }));
    expect(success).toBeTruthy();

    const groupList = await getMaterialList();
    await expect(groupList[0].id).toEqual(materialIds[5]);
    await expect(groupList[1].id).toEqual(materialIds[4]);
    await expect(groupList[2].id).toEqual(materialIds[6]);
    await expect(groupList[0].sortOrder).toEqual(0);
    await expect(groupList[1].sortOrder).toEqual(1);
    await expect(groupList[2].sortOrder).toEqual(2);
});
it('should prevent first element up', async () => {
    const { success, result } = await runServerActionTest(() => changeMaterialSortOrder({ id: materialIds[4], up: true }));
    expect(success).toBeFalsy();
    expect(result.exceptionType).toEqual(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Element already first in list/);
});
it('should succed second element up', async () => {
    const { success } = await runServerActionTest(() => changeMaterialSortOrder({ id: materialIds[5], up: true }));
    expect(success).toBeTruthy();

    const groupList = await getMaterialList();
    await expect(groupList[0].id).toEqual(materialIds[5]);
    await expect(groupList[1].id).toEqual(materialIds[4]);
    await expect(groupList[2].id).toEqual(materialIds[6]);
    await expect(groupList[0].sortOrder).toEqual(0);
    await expect(groupList[1].sortOrder).toEqual(1);
    await expect(groupList[2].sortOrder).toEqual(2);
});
it('should prevent last element down', async () => {
    const { success, result } = await runServerActionTest(() => changeMaterialSortOrder({ id: materialIds[6], up: false }));
    expect(success).toBeFalsy();
    expect(result.exceptionType).toEqual(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Element already last in list/);
});
it('should succed second to last element down', async () => {
    const { success } = await runServerActionTest(() => changeMaterialSortOrder({ id: materialIds[5], up: false }));
    expect(success).toBeTruthy();

    const groupList = await getMaterialList();
    await expect(groupList[0].id).toEqual(materialIds[4]);
    await expect(groupList[1].id).toEqual(materialIds[6]);
    await expect(groupList[2].id).toEqual(materialIds[5]);
    await expect(groupList[0].sortOrder).toEqual(0);
    await expect(groupList[1].sortOrder).toEqual(1);
    await expect(groupList[2].sortOrder).toEqual(2);
});
it('should fail if no element with newSortOrder exists', async () => {
    // create state that should cause error
    await prisma.material.update({
        where: { id: materialIds[4] },
        data: { sortOrder: 4 }
    });

    const { success, result } = await runServerActionTest(() => changeMaterialSortOrder({ id: materialIds[5], up: true }));
    expect(success).toBeFalsy();
    expect(result.exceptionType).toEqual(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Could not update sortOrder of seccond materialType/);
});
it('should fail if more than one element with newSortOrder exists', async () => {
    // create state that should cause error
    await prisma.material.update({
        where: { id: materialIds[6] },
        data: { sortOrder: 0, recdelete: null, recdeleteUser: null }
    });

    const { success, result } = await runServerActionTest(() => changeMaterialSortOrder({ id: materialIds[5], up: true }));
    expect(success).toBeFalsy();
    expect(result.exceptionType).toEqual(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Could not update sortOrder of seccond materialType/);
});
