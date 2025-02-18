import { runServerActionTest } from "@/dal/_helper/testHelper";
import { ExceptionType } from "@/errors/CustomException";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { changeUniformTypeSortOrder } from "./sortOrder";

const { cleanup, ids } = new StaticData(0);
afterEach(async () => {
    await cleanup.uniformTypeConfiguration();
})
it('should not allow first element up', async () => {
    const { success, result } = await runServerActionTest(
        changeUniformTypeSortOrder({ typeId: ids.uniformTypeIds[0], up: true })
    );
    expect(success).toBeFalsy();
    expect(result.exceptionType).toEqual(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Could not update sortOrder of seccond type/);
});
it('should allow seccond element up', async () => {
    const { success, result } = await runServerActionTest(
        changeUniformTypeSortOrder({ typeId: ids.uniformTypeIds[1], up: true })
    );
    expect(success).toBeTruthy();
    expect(result[0].id).toBe(ids.uniformTypeIds[1]);
    expect(result[1].id).toBe(ids.uniformTypeIds[0]);
    expect(result[2].id).toBe(ids.uniformTypeIds[2]);
    expect(result[3].id).toBe(ids.uniformTypeIds[3]);
});
it('should not allow last element down', async () => {
    const { success, result } = await runServerActionTest(
        changeUniformTypeSortOrder({ typeId: ids.uniformTypeIds[3], up: false })
    );
    expect(success).toBeFalsy();
    expect(result.exceptionType).toBe(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Could not update sortOrder of seccond type/)
});
it('should allow second to last element down', async () => {
    const { success, result } = await runServerActionTest(
        changeUniformTypeSortOrder({ typeId: ids.uniformTypeIds[2], up: false })
    );
    expect(success).toBeTruthy();
    expect(result[0].id).toBe(ids.uniformTypeIds[0]);
    expect(result[1].id).toBe(ids.uniformTypeIds[1]);
    expect(result[2].id).toBe(ids.uniformTypeIds[3]);
    expect(result[3].id).toBe(ids.uniformTypeIds[2]);
});
it('should fail if no element with newSortOrder exists', async () => {
    await prisma.uniformType.update({
        where: {
            id: ids.uniformTypeIds[2],
        },
        data: {
            sortOrder: 5
        }
    });
    const { success, result } = await runServerActionTest(
        changeUniformTypeSortOrder({ typeId: ids.uniformTypeIds[1], up: false })
    );
    expect(success).toBeFalsy();
    expect(result.exceptionType).toBe(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Could not update sortOrder of seccond type/);
});
it('should fail if more than one element with newSortOrder exists', async () => {
    await prisma.uniformType.update({
        where: {
            id: ids.uniformTypeIds[3]
        },
        data: {
            sortOrder: 1
        }
    });

    const {success, result} = await runServerActionTest(
        changeUniformTypeSortOrder({typeId: ids.uniformTypeIds[0], up: false})
    );
    expect(success).toBeFalsy();
    expect(result.exceptionType).toBe(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Could not update sortOrder of seccond type/);
});
