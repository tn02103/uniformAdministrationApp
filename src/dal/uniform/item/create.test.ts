import { runServerActionTest } from "@/dal/_helper/testHelper";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { create } from "./create";

const { ids, cleanup } = new StaticData(0);
const defaultWithSizes = {
    numberMap: [
        { sizeId: ids.sizeIds[0], numbers: [3000, 3003] },
        { sizeId: ids.sizeIds[1], numbers: [3001, 3002] },
    ],
    data: {
        active: true,
        generationId: ids.uniformGenerationIds[0],
        uniformTypeId: ids.uniformTypeIds[0],
        comment: 'just new'
    }
};
const defaultWithoutSizes = {
    numberMap: [
        { sizeId: 'amount', numbers: [3000, 3001] }
    ],
    data: {
        active: true,
        generationId: ids.uniformGenerationIds[4],
        uniformTypeId: ids.uniformTypeIds[1],
        comment: 'just new'
    }
}
afterEach(async () => cleanup.uniform());
describe('successfull in all allowed combinations', () => {

    it('creates with size and generation', async () => {
        const { success, result } = await runServerActionTest(
            create(defaultWithSizes)
        );
        expect(success).toBeTruthy();
        expect(result).toBe(4);
        const dbData = await prisma.uniform.findMany({
            where: { number: { gte: 3000 } },
            orderBy: { number: "asc" }
        });
        expect(dbData).toHaveLength(4);
        for (const item of dbData) {
            expect(item).toEqual(
                expect.objectContaining({
                    fk_uniformType: ids.uniformTypeIds[0],
                    fk_generation: ids.uniformGenerationIds[0],
                    active: true,
                    comment: defaultWithSizes.data.comment,
                })
            );
        }
        expect(dbData[0].fk_size).toBe(ids.sizeIds[0]);
        expect(dbData[1].fk_size).toBe(ids.sizeIds[1]);
        expect(dbData[2].fk_size).toBe(ids.sizeIds[1]);
        expect(dbData[3].fk_size).toBe(ids.sizeIds[0]);
    });
    it('creates without size, with generation ', async () => {
        const { result, success } = await runServerActionTest(
            create({
                numberMap: [
                    { sizeId: "amount", numbers: [3000, 3001] },
                ],
                data: {
                    uniformTypeId: ids.uniformTypeIds[1],
                    generationId: ids.uniformGenerationIds[4],
                    active: true,
                    comment: 'just new'
                }
            })
        );
        expect(success).toBeTruthy();
        expect(result).toBe(2);
        const dbData = await prisma.uniform.findMany({
            where: { number: { gte: 3000 } }
        });
        expect(dbData).toHaveLength(2);
        for (const item of dbData) {
            expect(item).toEqual(
                expect.objectContaining({
                    fk_uniformType: ids.uniformTypeIds[1],
                    fk_generation: ids.uniformGenerationIds[4],
                    active: true,
                    comment: defaultWithSizes.data.comment,
                    fk_size: null,
                })
            );
        }
    });
    it('creates with size, without generation', async () => {
        const { success, result } = await runServerActionTest(
            create({
                numberMap: [
                    { sizeId: ids.sizeIds[0], numbers: [3000, 3003] },
                    { sizeId: ids.sizeIds[1], numbers: [3001, 3002] },
                ],
                data: {
                    uniformTypeId: ids.uniformTypeIds[2],
                    generationId: undefined,
                    active: true,
                    comment: 'just new'
                }
            }),
        );
        expect(success).toBeTruthy();
        expect(result).toBe(4);
    });
    it('creates without size, without generation', async () => {
        const { success, result } = await runServerActionTest(
            create({
                numberMap: [
                    { sizeId: 'amount', numbers: [3000, 3001] },
                ],
                data: {
                    uniformTypeId: ids.uniformTypeIds[3],
                    generationId: undefined,
                    active: true,
                    comment: 'just new',
                },
            })
        );
        expect(success).toBeTruthy();
        expect(result).toBe(2);
    });
});
describe('test type validations', () => {
    it('catches deleted types', async () => {
        const { success } = await runServerActionTest(
            create({
                ...defaultWithoutSizes,
                data: {
                    ...defaultWithSizes.data,
                    uniformTypeId: ids.uniformTypeIds[4],
                    generationId: undefined,
                }
            })
        );
        expect(success).toBeFalsy();
    });
    it('catches invalid type', async () => {
        const { success } = await runServerActionTest(
            create({
                ...defaultWithoutSizes,
                data: {
                    ...defaultWithSizes.data,
                    uniformTypeId: ids.cadetIds[0],
                    generationId: undefined,
                }
            })
        );
        expect(success).toBeFalsy();
    });
});
describe('testing generations', () => {
    it('catches generations from different type', async () => {
        const { success } = await runServerActionTest(
            create({
                ...defaultWithoutSizes,
                data: {
                    ...defaultWithoutSizes.data,
                    generationId: ids.uniformGenerationIds[0]
                }
            })
        );
        expect(success).toBeFalsy();
    });
    it('catches deleted generations', async () => {
        const { success } = await runServerActionTest(
            create({
                ...defaultWithoutSizes,
                data: {
                    ...defaultWithoutSizes.data,
                    generationId: ids.uniformGenerationIds[6]
                }
            })
        );
        expect(success).toBeFalsy();
    });
    it('catches missing generation', async () => {
        const { success } = await runServerActionTest(
            create({
                ...defaultWithoutSizes,
                data: {
                    ...defaultWithoutSizes.data,
                    generationId: undefined
                }
            })
        );
        expect(success).toBeFalsy();
    });
    it('catches with generation when !usingGenerations', async () => {
        await prisma.uniformType.update({
            where: { id: ids.uniformTypeIds[1] },
            data: { usingGenerations: false }
        });
        const { success } = await runServerActionTest(
            create(defaultWithoutSizes)
        );
        expect(success).toBeFalsy();
    });
});

describe('testing sizes', () => {
    // usingSize, usingGeneration size not in generationsList
    // usingSize, !usingGeneration size not in defaultSizelist,
    // size when not allowed
    // no size when required
    it('catches not allowed size with generation', async () => {
        const { success } = await runServerActionTest(
            create({
                ...defaultWithSizes,
                numberMap: [
                    { sizeId: ids.sizeIds[16], numbers: [3000, 3001] }
                ]
            })
        );
        expect(success).toBeFalsy();
    });
    it('catches not allowed size without generation', async () => {
        const { success } = await runServerActionTest(
            create({
                numberMap: [
                    { sizeId: ids.sizeIds[16], numbers: [3000, 3001] }
                ],
                data: {
                    ...defaultWithSizes.data,
                    uniformTypeId: ids.uniformTypeIds[2],
                    generationId: undefined,
                }
            })
        );
        expect(success).toBeFalsy();
    });
    it('catches missing size when required', async () => {
        const { success } = await runServerActionTest(
            create({
                numberMap: defaultWithoutSizes.numberMap,
                data: {
                    ...defaultWithSizes.data,
                    uniformTypeId: ids.uniformTypeIds[2],
                    generationId: undefined,
                },
            })
        );
        expect(success).toBeFalsy();
    });
    it('catches with size when not allowed', async () => {
        const { success } = await runServerActionTest(
            create({
                numberMap: defaultWithSizes.numberMap,
                data: {
                    ...defaultWithSizes.data,
                    uniformTypeId: ids.uniformTypeIds[3],
                    generationId: undefined,
                },
            })
        );
        expect(success).toBeFalsy();
    });
});

describe('number validations', () => {
    it('catches duplicated number with existing item', async () => {
        const { success } = await runServerActionTest(
            create({
                ...defaultWithSizes,
                numberMap: [
                    { sizeId: ids.sizeIds[0], numbers: [1100] }
                ],
            })
        );
        expect(success).toBeFalsy();
    });
    it('catches duplicated number within map', async () => {
        const { success } = await runServerActionTest(
            create({
                ...defaultWithSizes,
                numberMap: [
                    { sizeId: ids.sizeIds[0], numbers: [3000, 3001] },
                    { sizeId: ids.sizeIds[1], numbers: [3002, 3001] }
                ],
            })
        );
        expect(success).toBeFalsy();
    });
    it('allows duplicated number with deleted item', async () => {
        const { success } = await runServerActionTest(
            create({
                ...defaultWithSizes,
                numberMap: [
                    { sizeId: ids.sizeIds[0], numbers: [1130] }
                ],
            })
        );
        expect(success).toBeTruthy();
    });
    it('allows duplicated number with different type', async () => {
        const { success } = await runServerActionTest(
            create({
                ...defaultWithSizes,
                numberMap: [
                    { sizeId: ids.sizeIds[0], numbers: [1200] }
                ],
            })
        );
        expect(success).toBeTruthy();
    });
});
