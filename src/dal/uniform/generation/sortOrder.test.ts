import { runServerActionTest } from "@/dal/_helper/testHelper";
import { ExceptionType } from "@/errors/CustomException";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { changeSortOrder } from "./sortOrder";

const { cleanup, ids } = new StaticData(0);
afterEach(async () => {
    await cleanup.uniformTypeConfiguration();
})
it('should not allow first element up', async () => {
    const { success, result } = await runServerActionTest(
        changeSortOrder({ id: ids.uniformGenerationIds[0], up: true })
    );
    expect(success).toBeFalsy();
    expect(result.exceptionType).toEqual(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Could not update sortOrder of seccond generation/);
});
it('should allow seccond element up', async () => {
    const { success, result } = await runServerActionTest(
        changeSortOrder({ id: ids.uniformGenerationIds[1], up: true })
    );
    expect(success).toBeTruthy();
    if (!success) return;

    const list = result[0].uniformGenerationList;
    expect(list[0].id).toBe(ids.uniformGenerationIds[1]);
    expect(list[1].id).toBe(ids.uniformGenerationIds[0]);
    expect(list[2].id).toBe(ids.uniformGenerationIds[2]);
    expect(list[3].id).toBe(ids.uniformGenerationIds[3]);
});
it('should not allow last element down', async () => {
    const { success, result } = await runServerActionTest(
        changeSortOrder({ id: ids.uniformGenerationIds[3], up: false })
    );
    expect(success).toBeFalsy();
    expect(result.exceptionType).toBe(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Could not update sortOrder of seccond generation/)
});
it('should allow second to last element down', async () => {
    const { success, result } = await runServerActionTest(
        changeSortOrder({ id: ids.uniformGenerationIds[2], up: false })
    );
    expect(success).toBeTruthy();
    if (!success) return;

    const list = result[0].uniformGenerationList;
    expect(list[0].id).toBe(ids.uniformGenerationIds[0]);
    expect(list[1].id).toBe(ids.uniformGenerationIds[1]);
    expect(list[2].id).toBe(ids.uniformGenerationIds[3]);
    expect(list[3].id).toBe(ids.uniformGenerationIds[2]);
});
it('should fail if no element with newSortOrder exists', async () => {
    await prisma.uniformGeneration.update({
        where: {
            id: ids.uniformGenerationIds[2],
        },
        data: {
            sortOrder: 5
        }
    });
    const { success, result } = await runServerActionTest(
        changeSortOrder({ id: ids.uniformGenerationIds[1], up: false })
    );
    expect(success).toBeFalsy();
    expect(result.exceptionType).toBe(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Could not update sortOrder of seccond generation/);
});
it('should fail if more than one element with newSortOrder exists', async () => {
    await prisma.uniformGeneration.update({
        where: {
            id: ids.uniformGenerationIds[3]
        },
        data: {
            sortOrder: 1
        }
    });

    const {success, result} = await runServerActionTest(
        changeSortOrder({id: ids.uniformGenerationIds[0], up: false})
    );
    expect(success).toBeFalsy();
    expect(result.exceptionType).toBe(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Could not update sortOrder of seccond generation/);
});
