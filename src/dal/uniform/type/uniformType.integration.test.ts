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
import { changeSortOrder } from "./sortOrder";

const { ids, cleanup, organisationId, data } = new StaticData(0);

describe('<UniformType> Integration Tests', () => {
    afterEach(async () => {
        await cleanup.uniformTypeConfiguration();
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
                    type: { organisationId },
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
                    type: { organisationId },
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

    it('should change sortOrder', async () => {
        const result = await changeSortOrder({ typeId: ids.uniformTypeIds[2], newPosition: 0 });
        expect(result).toHaveLength(4);

        expect(result[0].id).toEqual(ids.uniformTypeIds[2]);
        expect(result[0].sortOrder).toEqual(0);
        expect(result[1].id).toEqual(ids.uniformTypeIds[0]);
        expect(result[1].sortOrder).toEqual(1);
        expect(result[2].id).toEqual(ids.uniformTypeIds[1]);
        expect(result[2].sortOrder).toEqual(2);
        expect(result[3].id).toEqual(ids.uniformTypeIds[3]);
        expect(result[3].sortOrder).toEqual(3);

        const dbTypes = await prisma.uniformType.findMany({
            where: {
                organisationId,
            },
            orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' }
            ],
        });
        expect(dbTypes[0].id).toEqual(ids.uniformTypeIds[2]);
        expect(dbTypes[0].sortOrder).toEqual(0);
        expect(dbTypes[1].id).toEqual(ids.uniformTypeIds[0]);
        expect(dbTypes[1].sortOrder).toEqual(1);
        expect(dbTypes[2].id).toEqual(ids.uniformTypeIds[1]);
        expect(dbTypes[2].sortOrder).toEqual(2);
        expect(dbTypes[3].id).toEqual(ids.uniformTypeIds[4]);
        expect(dbTypes[3].sortOrder).toEqual(2);
        expect(dbTypes[4].id).toEqual(ids.uniformTypeIds[3]);
        expect(dbTypes[4].sortOrder).toEqual(3);
    });

    describe('Error handling', () => {
        it('should catch name duplication error on create', async () => {
            const createProps = {
                name: data.uniformTypes[0].name,
                acronym: 'TT',
                issuedDefault: 1,
                usingSizes: false,
                usingGenerations: true,
                fk_defaultSizelist: null,
            };

            const { result, success } = await runServerActionTest(create(createProps));
            expect(success).toBeFalsy();
            expect(result).toEqual({
                error: {
                    message: "custom.uniform.type.nameDuplication",
                    formElement: "name",
                }
            });
        });

        it('should catch acronym duplication error on create', async () => {
            const createProps = {
                name: 'Unique',
                acronym: data.uniformTypes[0].acronym,
                issuedDefault: 1,
                usingSizes: false,
                usingGenerations: true,
                fk_defaultSizelist: null,
            };

            const { result, success } = await runServerActionTest(create(createProps));
            expect(success).toBeFalsy();
            expect(result).toEqual({
                error: {
                    message: "custom.uniform.type.acronymDuplication;name:" + data.uniformTypes[0].name,
                    formElement: "acronym",
                }
            });
        });

        it('should catch name duplication error on update', async () => {
            const updateProps = {
                id: ids.uniformTypeIds[0],
                data: {
                    name: data.uniformTypes[1].name, // This name is already taken
                    acronym: 'TT',
                    issuedDefault: 1,
                    usingSizes: false,
                    usingGenerations: true,
                    fk_defaultSizelist: null,
                }
            };

            const { result, success } = await runServerActionTest(update(updateProps));
            expect(success).toBeFalsy();
            expect(result).toEqual({
                error: {
                    message: "custom.uniform.type.nameDuplication",
                    formElement: "name",
                }
            });
        });

        it('should catch acronym duplication error on update', async () => {
            const updateProps = {
                id: ids.uniformTypeIds[0],
                data: {
                    name: 'Unique',
                    acronym: data.uniformTypes[1].acronym, // This acronym is already taken
                    issuedDefault: 1,
                    usingSizes: false,
                    usingGenerations: true,
                    fk_defaultSizelist: null,
                }
            };

            const { result, success } = await runServerActionTest(update(updateProps));
            expect(success).toBeFalsy();
            expect(result).toEqual({
                error: {
                    message: "custom.uniform.type.acronymDuplication;name:" + data.uniformTypes[1].name,
                    formElement: "acronym",
                }
            });
        });
    });
});
