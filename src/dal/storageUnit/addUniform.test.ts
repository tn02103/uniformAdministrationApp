import CustomException, { ExceptionType } from "@/errors/CustomException";
import { StaticData } from "../../../tests/_playwrightConfig/testData/staticDataLoader";
import { runServerActionTest } from "../_helper/testHelper";
import { addUniform } from "./addUniform";
import { prisma } from "@/lib/db";

const { ids, cleanup } = new StaticData(0);
afterEach(async () => cleanup.storageUnits());
it('should add a uniform to a storage unit', async () => {
    const { success, result } = await runServerActionTest(addUniform({
        storageUnitId: ids.storageUnitIds[0],
        uniformId: ids.uniformIds[0][10],
    }));
    expect(success).toBeTruthy();
    expect(result).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                id: ids.storageUnitIds[0],
                uniformList: expect.arrayContaining([
                    expect.objectContaining({
                        id: ids.uniformIds[0][10],
                    })
                ])
            })
        ])
    );
});

it('should return soft error if uniform is already in a storage unit', async () => {
    const expectedError = new CustomException(
        'uniform already is in a storage unit',
        ExceptionType.InUseException,
        { id: ids.storageUnitIds[1], name: 'Kiste 02', "description": "Für Typ1 Uniformteile in Reserve" }
    );

    const { success, result } = await runServerActionTest(addUniform({
        storageUnitId: ids.storageUnitIds[0],
        uniformId: ids.uniformIds[0][15],
    }));
    expect(success).toBeFalsy();
    expect(result.error).toEqual(expectedError);

    const { success: success2, result: result2 } = await runServerActionTest(addUniform({
        storageUnitId: ids.storageUnitIds[1],
        uniformId: ids.uniformIds[0][15],
    }));
    expect(success2).toBeFalsy();
    expect(result2.error).toEqual(expectedError);
});

it('should return soft error if uniform is in use', async () => {
    const { success, result } = await runServerActionTest(addUniform({
        storageUnitId: ids.storageUnitIds[0],
        uniformId: ids.uniformIds[0][0],
    }));
    expect(success).toBeFalsy();
    expect(result.error).toBeDefined();
    expect(result.error.exceptionType).toBe(ExceptionType.UniformIssuedException);
    expect(result.error.message).toMatch(/Uniform already issued/);
    expect(result.error.data).toEqual({
        uniform: {
            id: ids.uniformIds[0][0],
            number: 1100,
        },
        owner: {
            id: ids.cadetIds[5],
            firstname: 'Maik',
            lastname: 'Finkel',
            active: true,
            comment: 'initial-comment',
        }
    });
});

it('should return soft error if storage unit is at or above capacity', async () => {
    const expectedError = new CustomException(
        'Storage unit is at or above capacity',
        ExceptionType.OverCapacityException,
        {
            capacity: 5, current: 6,
            storageUnit: {
                id: ids.storageUnitIds[1], name: 'Kiste 02', "description": "Für Typ1 Uniformteile in Reserve"
            }
        }
    );
    const { success, result } = await runServerActionTest(addUniform({
        storageUnitId: ids.storageUnitIds[1],
        uniformId: ids.uniformIds[0][10],
    }));
    expect(success).toBeFalsy();
    expect(result.error).toEqual(expectedError);
});
it('should succeed if storage unit is one below capacity', async () => {
    await prisma.storageUnit.update({
        where: { id: ids.storageUnitIds[1] },
        data: { capacity: 6 },
    });
    const { success } = await runServerActionTest(addUniform({
        storageUnitId: ids.storageUnitIds[1],
        uniformId: ids.uniformIds[0][10],
    }));
    expect(success).toBeTruthy();
});
it('should succeed if storage unit is at capacity but option.ignoreFull is set', async () => {
    const { success } = await runServerActionTest(addUniform({
        storageUnitId: ids.storageUnitIds[1],
        uniformId: ids.uniformIds[0][10],
        options: {
            ignoreFull: true,
        },
    }));
    expect(success).toBeTruthy();
});
it('should work if storage unit does not have capacity', async () => {
    const { success } = await runServerActionTest(addUniform({
        storageUnitId: ids.storageUnitIds[4],
        uniformId: ids.uniformIds[0][10],
    }));
    expect(success).toBeTruthy();
});
it('marks uniform as reserve if storage unit is reserve', async () => {
    const { success } = await runServerActionTest(addUniform({
        storageUnitId: ids.storageUnitIds[0],
        uniformId: ids.uniformIds[0][10],
    }));
    expect(success).toBeTruthy();

    const dbUniform = await prisma.uniform.findUnique({
        where: { id: ids.uniformIds[0][10] },
    });

    expect(dbUniform?.isReserve).toBeTruthy();
});
it('does not mark uniform as reserve if storage unit is not reserve', async () => {
    const { success } = await runServerActionTest(addUniform({
        storageUnitId: ids.storageUnitIds[3],
        uniformId: ids.uniformIds[0][10],
    }));
    expect(success).toBeTruthy();

    const dbUniform = await prisma.uniform.findUnique({
        where: { id: ids.uniformIds[0][10] },
    });

    expect(dbUniform?.isReserve).toBeFalsy();
});
