import { runServerActionTest } from "@/dal/_helper/testHelper";
import { ExceptionType } from "@/errors/CustomException";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { changeSortOrder } from "./sortOrder";

const staticData = new StaticData(0);
const groupIds = staticData.ids.materialGroupIds;
afterEach(() => staticData.cleanup.materialConfig());
function getGroupList() {
    return prisma.materialGroup.findMany({
        where: { organisationId: staticData.organisationId, recdelete: null },
        orderBy: { sortOrder: "asc" }
    });
}
it('should work upwoards', async () => {
    const { success } = await runServerActionTest(changeSortOrder({ groupId: groupIds[2], up: true }));
    expect(success).toBeTruthy();

    const groupList = await getGroupList();
    await expect(groupList[0].id).toEqual(groupIds[0]);
    await expect(groupList[1].id).toEqual(groupIds[2]);
    await expect(groupList[2].id).toEqual(groupIds[1]);
    await expect(groupList[3].id).toEqual(groupIds[4]);
    await expect(groupList[0].sortOrder).toEqual(0);
    await expect(groupList[1].sortOrder).toEqual(1);
    await expect(groupList[2].sortOrder).toEqual(2);
    await expect(groupList[3].sortOrder).toEqual(3);
});
it('should work downwoards', async () => {
    const { success } = await runServerActionTest(changeSortOrder({ groupId: groupIds[0], up: false }));
    expect(success).toBeTruthy();

    const groupList = await getGroupList();
    await expect(groupList[0].id).toEqual(groupIds[1]);
    await expect(groupList[1].id).toEqual(groupIds[0]);
    await expect(groupList[2].id).toEqual(groupIds[2]);
    await expect(groupList[3].id).toEqual(groupIds[4]);
    await expect(groupList[0].sortOrder).toEqual(0);
    await expect(groupList[1].sortOrder).toEqual(1);
    await expect(groupList[2].sortOrder).toEqual(2);
    await expect(groupList[3].sortOrder).toEqual(3);
});
it('should prevent first element up', async () => {
    const { success, result } = await runServerActionTest(changeSortOrder({ groupId: groupIds[0], up: true }));
    expect(success).toBeFalsy();
    expect(result.exceptionType).toEqual(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Element already first in list/);
});
it('should succed second element up', async () => {
    const { success } = await runServerActionTest(changeSortOrder({ groupId: groupIds[1], up: true }));
    expect(success).toBeTruthy();

    const groupList = await getGroupList();
    await expect(groupList[0].id).toEqual(groupIds[1]);
    await expect(groupList[1].id).toEqual(groupIds[0]);
    await expect(groupList[2].id).toEqual(groupIds[2]);
    await expect(groupList[0].sortOrder).toEqual(0);
    await expect(groupList[1].sortOrder).toEqual(1);
    await expect(groupList[2].sortOrder).toEqual(2);
});
it('should prevent last element down', async () => {
    const { success, result } = await runServerActionTest(changeSortOrder({ groupId: groupIds[4], up: false }));
    expect(success).toBeFalsy();
    expect(result.exceptionType).toEqual(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Element already last in list/);
});
it('should succed second to last element down', async () => {
    const { success } = await runServerActionTest(changeSortOrder({ groupId: groupIds[2], up: false }));
    expect(success).toBeTruthy();

    const groupList = await getGroupList();
    await expect(groupList[0].id).toEqual(groupIds[0]);
    await expect(groupList[1].id).toEqual(groupIds[1]);
    await expect(groupList[2].id).toEqual(groupIds[4]);
    await expect(groupList[3].id).toEqual(groupIds[2]);
    await expect(groupList[0].sortOrder).toEqual(0);
    await expect(groupList[1].sortOrder).toEqual(1);
    await expect(groupList[2].sortOrder).toEqual(2);
    await expect(groupList[3].sortOrder).toEqual(3);
});
it('should fail if no element with newSortOrder exists', async () => {
    // create state that should cause error
    await prisma.materialGroup.update({
        where: { id: groupIds[0] },
        data: { sortOrder: 4 }
    });

    const { success, result } = await runServerActionTest(changeSortOrder({ groupId: groupIds[1], up: true }));
    expect(success).toBeFalsy();
    expect(result.exceptionType).toEqual(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Could not update sortOrder of seccond materialGroup/);
});
it('should fail if more than one element with newSortOrder exists', async () => {
    // create state that should cause error
    await prisma.materialGroup.update({
        where: { id: groupIds[3] },
        data: { sortOrder: 0, recdelete: null, recdeleteUser: null }
    });

    const { success, result } = await runServerActionTest(changeSortOrder({ groupId: groupIds[1], up: true }));
    expect(success).toBeFalsy();
    expect(result.exceptionType).toEqual(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Could not update sortOrder of seccond materialGroup/);
});
