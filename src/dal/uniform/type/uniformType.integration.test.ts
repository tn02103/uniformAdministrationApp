/* eslint-disable jest/no-conditional-expect */
import { cleanDataV2, runServerActionTest } from "@/dal/_helper/testHelper";
import { prisma } from "@/lib/db";
import { UniformType } from "@/types/globalUniformTypes";
import { checkDateTolerance } from "../../../../jest/helpers/test-utils";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { create } from "./create";
import { markDeleted } from "./delete";
import { getList, getType } from "./get";
import { update } from "./update";

const { ids, cleanup, fk_assosiation, data } = new StaticData(0);

describe('<UniformType> Integration Tests', () => {
    afterEach(async () => {
        await cleanup.uniformTypeConfiguration();
    });

    it('should create, read, update uniform type end-to-end', async () => {
        // Test create
        const createProps = {
            name: 'Type Test',
            acronym: 'IT',
            issuedDefault: 2,
            usingSizes: false,
            usingGenerations: true,
            fk_defaultSizelist: null,
        };

        const { result: createResult, success: createSuccess } = await runServerActionTest(create(createProps));
        expect(createSuccess).toBeTruthy();
        expect(createResult).toBeDefined();
        expect(createResult).toEqual(
            expect.objectContaining(createProps)
        );

        // Test read single
        const { result: getResult, success: getSuccess } = await runServerActionTest(getType(createResult.id));
        expect(getSuccess).toBeTruthy();
        expect(getResult).toMatchObject({
            name: 'Type Test',
            acronym: 'IT',
            issuedDefault: 2,
        });

        // Test update
        const updateProps = {
            id: createResult.id,
            data: {
                ...createProps,
                name: 'Updated',
                issuedDefault: 3,
            }
        };

        const { result: updateResult, success: updateSuccess } = await runServerActionTest(update(updateProps));
        expect(updateSuccess).toBeTruthy();
        expect(updateResult).toBeDefined();

        const updatedType = updateResult?.find((t: { id: string }) => t.id === createResult.id);
        expect(updatedType).toMatchObject({
            name: 'Updated',
            issuedDefault: 3,
        });
    });

    it('should get list with correct data structure', async () => {
        const { result, success } = await runServerActionTest(getList());
        expect(success).toBeTruthy();

        expect(cleanDataV2(result)).toMatchSnapshot();
    });

    it('should get single type with correct data structure', async () => {
        const { result, success } = await runServerActionTest(getType(ids.uniformTypeIds[0]));
        expect(success).toBeTruthy();
        expect(cleanDataV2(result)).toMatchSnapshot();
    });

    it('should handle delete with cascading operations', async () => {
        // This tests the complex delete operation that involves multiple database operations
        const { success, result } = await runServerActionTest(markDeleted(ids.uniformTypeIds[1]));
        expect(success).toBeTruthy();
        expect((result as UniformType[]).filter((t) => t.id === ids.uniformTypeIds[1])).toHaveLength(0);

        const [type, generations, otherGenerations, uniformItems, otherUniformItems] = await prisma.$transaction([
            prisma.uniformType.findFirst({
                where: {
                    id: ids.uniformTypeIds[1],
                }
            }),
            prisma.uniformGeneration.findMany({
                where: {
                    fk_uniformType: ids.uniformTypeIds[1],
                }
            }),
            prisma.uniformGeneration.findMany({
                where: {
                    fk_uniformType: { not: ids.uniformTypeIds[1] },
                    type: { fk_assosiation },
                }
            }),
            prisma.uniform.findMany({
                where: {
                    fk_uniformType: ids.uniformTypeIds[1],
                }
            }),
            prisma.uniform.findMany({
                where: {
                    fk_uniformType: { not: ids.uniformTypeIds[1] },
                    type: { fk_assosiation },
                }
            }),
        ]);

        expect(type?.recdelete).not.toBeNull();
        expect(checkDateTolerance(type!.recdelete!)).toBeLessThan(5000);
        expect(type?.recdeleteUser).toEqual("mana");
        generations.forEach((gen) => {
            if (gen.id === ids.uniformGenerationIds[6]) {
                expect(gen.recdelete).not.toBeNull();
                expect(checkDateTolerance(gen.recdelete!)).toBeGreaterThan(5000);
                expect(gen.recdeleteUser).toEqual("test4");
            } else {
                expect(gen.recdelete).not.toBeNull();
                expect(checkDateTolerance(gen.recdelete!)).toBeLessThan(5000);
                expect(gen.recdeleteUser).toEqual("mana");
            }
        });
        otherGenerations.forEach((gen) => {
            expect(gen.recdelete === null || checkDateTolerance(gen.recdelete) > 5000).toBeTruthy();
        });
        const prevDeletedItems = uniformItems.filter((item) => data.uniformList.find((uni) => (uni.id === item.id && uni.recdelete)));
        const newDeletedItems = uniformItems.filter((item) => data.uniformList.find((uni) => (uni.id === item.id && !uni.recdelete)));
        prevDeletedItems.forEach((item) => {
            expect(item.recdelete).not.toBeNull();
            expect(checkDateTolerance(item.recdelete!)).toBeGreaterThan(5000);
        });
        newDeletedItems.forEach((item) => {
            expect(item.recdelete).not.toBeNull();
            expect(checkDateTolerance(item.recdelete!)).toBeLessThan(5000);
            expect(item.recdeleteUser).toEqual("mana");
        });
        otherUniformItems.forEach((item) => {
            expect(item.recdelete === null || checkDateTolerance(item.recdelete) > 5000).toBeTruthy();
        });
    });
});
