

import { runServerActionTest } from "@/dal/_helper/testHelper";
import { update } from "./update";
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
const defaultReturnValue = {
    ...defaultProps,
    generation: {
        id: ids.uniformGenerationIds[3],
        name: data.uniformGenerations[3].name,
        outdated: data.uniformGenerations[3].outdated,
    },
    size: {
        id: ids.sizeIds[16],
        name: data.uniformSizes[16].name,
    },
    type: {
        id: ids.uniformTypeIds[0],
        name: data.uniformTypes[0].name,
    }
}
describe('updateUniformItem', () => {
    afterEach(async () => cleanup.uniformTypeConfiguration());
    it('succesfully changed item', async () => {
        const { success, result } = await runServerActionTest(
            update(defaultProps)
        );
        expect(success).toBeTruthy();
        expect(result).toStrictEqual(defaultReturnValue);


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
            update({
                ...defaultProps,
                number: 9999
            })
        );
        expect(success).toBeTruthy();
        expect(result).toStrictEqual(defaultReturnValue);

        const dbItem = await prisma.uniform.findUnique({
            where: { id: defaultProps.id }
        });
        expect(dbItem).not.toBeNull();
        expect(dbItem?.number).toEqual(defaultProps.number);
    });
    it('catches size not in sizelist of generation', async () => {
        const { success } = await runServerActionTest(
            update({
                ...defaultProps,
                size: ids.sizeIds[1]
            })
        );
        expect(success).toBeFalsy();
    });
    it('catches size not in defaultSizelist without generation', async () => {
        const { success } = await runServerActionTest(
            update({
                ...defaultProps,
                generation: null,
            })
        );
        expect(success).toBeFalsy();
    });
    it('works without a size provided', async () => {
        const { success } = await runServerActionTest(
            update({
                ...defaultProps,
                size: null,
            })
        );
        expect(success).toBeTruthy();
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
            update(defaultProps)
        );
        expect(success).toBeTruthy();
        if (!success) return;
        expect(result.size).toStrictEqual({
            id: data.uniformSizes[1].id,
            name: data.uniformSizes[1].name
        });
    });
    it('does not change generation when !usingGeneration', async () => {
        const { success, result } = await runServerActionTest(
            update({
                ...defaultProps,
                id: ids.uniformIds[2][0],
                size: ids.sizeIds[6],
            })
        );
        expect(success).toBeTruthy();
        if (!success) return;
        expect(result.generation).toBeNull();
    });
    it('fails if generation is from different type', async () => {
        const { success } = await runServerActionTest(
            update({
                ...defaultProps,
                generation: ids.uniformGenerationIds[5]
            })
        );
        expect(success).toBeFalsy();
    });
});