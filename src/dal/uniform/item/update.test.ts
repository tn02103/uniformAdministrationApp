

import { runServerActionTest } from "@/dal/_helper/testHelper";
import { updateUniformItem } from "./update";
import { UniformFormType } from "@/zod/uniform";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { prisma } from "@/lib/db";

const { ids, data, cleanup } = new StaticData(0);
const defaultProps: UniformFormType = {
    id: data.uniformList[0].id,
    number: data.uniformList[0].number,
    size: ids.sizeIds[16],
    generation: ids.uniformGenerationIds[3],
    active: false,
    comment: 'jsut a new comment ;)',
}
afterEach(async () => cleanup.uniformTypeConfiguration());
it('succesfully changed item', async () => {
    const { success, result } = await runServerActionTest(
        () => updateUniformItem(defaultProps)
    );
    expect(success).toBeTruthy();
    expect(result).toStrictEqual(defaultProps);
    const dbItem = await prisma.uniform.findUnique({
        where: { id: defaultProps.id }
    });
    expect(dbItem).not.toBeNull();
    expect(dbItem).toEqual(expect.objectContaining({
        id: defaultProps.id,
        number: defaultProps.number,
        fk_generation: defaultProps.generation,
        fk_size: defaultProps.size,
        comment: defaultProps.comment,
    }));
});
it('doesnt change the number', async () => {
    const { success, result } = await runServerActionTest(
        () => updateUniformItem({
            ...defaultProps,
            number: 9999
        })
    );
    expect(success).toBeTruthy();
    expect(result).toStrictEqual(defaultProps);
    const dbItem = await prisma.uniform.findUnique({
        where: { id: defaultProps.id }
    });
    expect(dbItem).not.toBeNull();
    expect(dbItem?.number).toEqual(defaultProps.number);
});
it('catches size not in sizelist of generation', async () => {
    const { success, result } = await runServerActionTest(
        () => updateUniformItem({
            ...defaultProps,
            size: ids.sizeIds[1]
        })
    );
    expect(success).toBeFalsy();
});
it('catches size not in defaultSizelist without generation', async () => {
    const { success, result } = await runServerActionTest(
        () => updateUniformItem({
            ...defaultProps,
            generation: null,
        })
    );
    expect(success).toBeFalsy();
});
it('does not change size when !usingSizes', async () => {
    // disabling sizes but with preconfigured sizelists
    await prisma.uniformType.update({
        where: {
            id: ids.uniformTypeIds[0],
        },
        data: {
            usingSizes: false,
        }
    });
    const { success, result } = await runServerActionTest(
        () => updateUniformItem(defaultProps)
    );
    expect(success).toBeTruthy();
    if (!success) return;
    expect(result.size).toBe(data.uniformList[0].fk_size);
});
it('does not change generation when !usingGeneration', async() => {
    const {success, result} = await runServerActionTest(
        () => updateUniformItem({
            ...defaultProps,
            id: ids.uniformIds[2][0],
            size: ids.sizeIds[6],
        })
    );
    expect(success).toBeTruthy();
    if(!success) return;
    expect(result.generation).toBeUndefined();
});
it('fails if generation is from different type', async() => {
    const {success} = await runServerActionTest(
        () => updateUniformItem({
            ...defaultProps,
            generation: ids.uniformGenerationIds[5]
        })
    );
    expect(success).toBeFalsy();
});
