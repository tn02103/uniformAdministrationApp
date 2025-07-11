import { runServerActionTest } from "@/dal/_helper/testHelper";
import { update } from "./update";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { prisma } from "@/lib/db";

const { ids, cleanup } = new StaticData(0);

const defaultData = {
    name: 'NewName',
    outdated: false,
    fk_sizelist: ids.sizelistIds[2],
}
afterEach(async () => cleanup.uniformTypeConfiguration());

// function does not need to set fk_sizelist null if not using sizes
it('should update the generation', async () => {
    const { success, result } = await runServerActionTest(
        update({ id: ids.uniformGenerationIds[0], data: defaultData })
    );
    expect(success).toBeTruthy();
    expect(result[0].uniformGenerationList[0]).toMatchObject(defaultData);

    const dbData = await prisma.uniformGeneration.findUnique({
        where: {
            id: ids.uniformGenerationIds[0],
        }
    });
    expect(dbData).not.toBeNull();
    expect(dbData).toMatchObject(defaultData);
});
it('should return soft nameDuplication error', async () => {
    const { success, result } = await runServerActionTest(
        update({
            id: ids.uniformGenerationIds[0],
            data: {
                ...defaultData,
                name: 'Generation1-3'
            }
        })
    );
    expect(success).toBeFalsy();
    expect(result.error.formElement).toBe('name');
    expect(result.error.message).toBe('custom.uniform.generation.nameDuplication');

    const dbData = await prisma.uniformGeneration.findUnique({
        where: {
            id: ids.uniformGenerationIds[0],
        }
    });
    expect(dbData?.name).toBe('Generation1-1')
});
it('should succeed with name of deleted generation', async () => {
    const { success } = await runServerActionTest(
        update({
            id: ids.uniformGenerationIds[0],
            data: {
                ...defaultData,
                name: 'Generation1-5'
            }
        })
    );
    expect(success).toBeTruthy();
});
it('should succeed with its own name', async () => {
    const { success } = await runServerActionTest(
        update({
            id: ids.uniformGenerationIds[0],
            data: {
                ...defaultData,
                name: 'Generation1-1'
            }
        })
    );
    expect(success).toBeTruthy();
});
it('should throw error for fk_sizelist null when using sizes', async () => {
    const { success } = await runServerActionTest(
        update({
            id: ids.uniformGenerationIds[0],
            data: {
                ...defaultData,
                fk_sizelist: null,
            }
        }),
    );
    expect(success).toBeFalsy();
});
it('should succeed with fk_sizelist null when not using sizes', async () => {
    const { success } = await runServerActionTest(
        update({
            id: ids.uniformGenerationIds[4],
            data: {
                ...defaultData,
                fk_sizelist: null,
            }
        }),
    );
    expect(success).toBeTruthy();
});

it('should throw error when fk_sizelist is from different assosiation', async () => {
    const wrongAssosiation = new StaticData(1);
    const { success } = await runServerActionTest(
        update({
            id: ids.uniformGenerationIds[0],
            data: {
                ...defaultData,
                fk_sizelist: wrongAssosiation.ids.sizelistIds[0],
            }
        }),
    );
    expect(success).toBeFalsy();
});
it('should throw error when fk_sizelist is invalid', async () => {
    const { success } = await runServerActionTest(
        update({
            id: ids.uniformGenerationIds[0],
            data: {
                ...defaultData,
                fk_sizelist: ids.cadetIds[0],
            }
        }),
    );
    expect(success).toBeFalsy();
});
