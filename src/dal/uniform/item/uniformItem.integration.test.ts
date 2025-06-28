import { cleanData, runServerActionTest } from "@/dal/_helper/testHelper";
import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/db";
import { checkDateTolerance } from "../../../../jest/helpers/test-utils";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import {
    createUniformItems,
    deleteUniformItem,
    getUniformItemCountByType,
    getUniformItemLabels,
    getUniformListWithOwner,
    issueUniformItem,
    returnUniformItem,
    updateUniformItem
} from "./_index";

const { ids, data } = new StaticData(0);

describe('<UniformItem> Integration Tests', () => {

    describe('getCountByType', () => {
        it('should return the count of uniforms for a specific type', async () => {
            const uniformTypeId = ids.uniformTypeIds[0];
            const result = await getUniformItemCountByType(uniformTypeId);

            expect(result).toBeDefined();
            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThan(0);
        });

        it('should return 0 for a type with no uniforms', async () => {
            // Using a valid but likely empty type ID
            const uniformTypeId = ids.uniformTypeIds[0]
            const count = data.uniformList.filter(u => (u.fk_uniformType === uniformTypeId) && !u.recdelete).length;
            const result = await getUniformItemCountByType(uniformTypeId);

            expect(result).toBeDefined();
            expect(typeof result).toBe('number');
            expect(result).toEqual(count);
        });
    });

    describe('getItemLabels', () => {
        it('should return a list of uniform item labels', async () => {
            const result = await getUniformItemLabels();

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);

            // Check structure of first item
            const firstItem = result[0];
            expect(firstItem).toHaveProperty('id');
            expect(firstItem).toHaveProperty('label');
            expect(firstItem).toHaveProperty('number');
            expect(firstItem).toHaveProperty('active');
            expect(firstItem).toHaveProperty('type');
            expect(firstItem.type).toHaveProperty('id');
            expect(firstItem.type).toHaveProperty('name');
            expect(firstItem.type).toHaveProperty('acronym');

            // Clean sensitive data for snapshot
            cleanData(result, ["id", "type.id", "owner?.id", "storageUnit?.id"]);
            expect(result.slice(0, 10)).toMatchSnapshot(); // Take first 10 for manageable snapshots
        });

        it('should include owner information when uniform is issued', async () => {
            const result = await getUniformItemLabels();
            const issuedItems = result.filter(item => item.owner !== null);

            expect(issuedItems.length).toBeGreaterThan(0);
            const issuedItem = issuedItems[0];
            expect(issuedItem.owner).toHaveProperty('id');
            expect(issuedItem.owner).toHaveProperty('firstname');
            expect(issuedItem.owner).toHaveProperty('lastname');
        });

        it('should include storage unit information when uniform is in storage', async () => {
            const result = await getUniformItemLabels();
            const storageItems = result.filter(item => item.storageUnit !== null);

            // At least check that the filter works correctly
            expect(storageItems.every(item => item.storageUnit !== null)).toBe(true);

            // If there are storage items, check their structure
            storageItems.forEach(storageItem => {
                expect(storageItem.storageUnit).toHaveProperty('id');
                expect(storageItem.storageUnit).toHaveProperty('name');
            });
        });
    });
    it('should create multiple uniform items successfully', async () => {
        const uniformTypeId = ids.uniformTypeIds[0];
        const generationId = ids.uniformGenerationIds[0];
        const sizeId = ids.sizeIds[0];

        const createProps = {
            data: {
                uniformTypeId,
                generationId,
                comment: 'Integration test uniforms',
                active: true,
            },
            numberMap: [{
                sizeId,
                numbers: [9001, 9002, 9003], // Create 3 uniforms
            }],
        };

        const result = await createUniformItems(createProps);

        expect(result).toBeDefined();
        expect(typeof result).toBe('number');
        expect(result).toBe(3); // Should return count of created items

        const dbList = await prisma.uniform.findMany({
            where: {
                type: { fk_assosiation: ids.fk_assosiation },
                number: { gt: 9000 }
            }
        });
        expect(dbList).toHaveLength(3);
        dbList.forEach(dbItem =>
            expect(dbItem).toMatchObject({
                active: createProps.data.active,
                comment: createProps.data.comment,
                fk_generation: createProps.data.generationId,
                fk_uniformType: createProps.data.uniformTypeId,
                fk_size: createProps.numberMap[0].sizeId,
                recdelete: null,
                recdeleteUser: null,
            })
        );
        expect(dbList.map(i => i.number)).toEqual(expect.arrayContaining([9001, 9002, 9003]));
    });



    it('should handle issuing uniform that is already issued', async () => {
        // Get an already issued uniform
        const uniforms = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'number',
            asc: true,
            filter: {
                active: true,
                issued: true,
                notIssued: false,
                inStorageUnit: false,
            }
        });
        expect(uniforms.length).toBeGreaterThan(0);
        const issuedUniform = uniforms.filter(u => u.issuedEntries[0].cadet.id !== ids.cadetIds[0])[0];
        // Attempt to issue it again
        const issueProps = {
            number: issuedUniform.number,
            uniformTypeId: issuedUniform.type.id,
            cadetId: ids.cadetIds[0],
            options: {
                ignoreInactive: false,
                force: true,
                create: false,
            },
        };
        const { success } = await runServerActionTest(issueUniformItem(issueProps));
        expect(success).toBeTruthy();

        const [oldCadet, oldIssuedEntry, newIssuedEntry] = await prisma.$transaction([
            prisma.cadet.findUnique({
                where: { id: issuedUniform.issuedEntries[0].cadet.id },
            }),
            prisma.uniformIssued.findFirst({
                where: {
                    fk_cadet: issuedUniform.issuedEntries[0].cadet.id,
                    fk_uniform: issuedUniform.id,
                }
            }),
            prisma.uniformIssued.findFirst({
                where: {
                    fk_uniform: issuedUniform.id,
                    dateReturned: null,
                    fk_cadet: ids.cadetIds[0],
                }
            }),
        ]);
        expect(oldCadet).toBeDefined();
        expect(oldCadet?.comment).toContain(`<<Das Uniformteil ${issuedUniform.type.name} ${issuedUniform.number} wurde Antje Fried Überschrieben>>`);

        expect(oldIssuedEntry).toBeDefined();
        expect(oldIssuedEntry!.dateReturned).toBeDefined();
        expect(dayjs().isSame(oldIssuedEntry!.dateReturned, "day")).toBeTruthy();

        expect(newIssuedEntry).toBeDefined();
        expect(newIssuedEntry?.dateIssued).not.toBeNull();
        expect(dayjs().isSame(newIssuedEntry!.dateIssued, "day")).toBeTruthy();
        expect(newIssuedEntry?.dateReturned).toBeNull();
    });




    it('should handle deleting non-existent uniform', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        await expect(deleteUniformItem(nonExistentId)).rejects.toThrow();
    });

    it('should handle complete uniform lifecycle', async () => {
        // 1. Create a uniform
        const createResult = await createUniformItems({
            numberMap: [{
                sizeId: ids.sizeIds[0],
                numbers: [9100], // Create a single uniform
            }],
            data: {
                uniformTypeId: ids.uniformTypeIds[0],
                generationId: ids.uniformGenerationIds[0],
                comment: 'Lifecycle test uniform',
                active: true,
            },
        });

        expect(createResult).toBe(1);

        // 2. Get the created uniform
        const uniforms = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'number',
            asc: false,
        });

        const createdUniform = uniforms.find(u => u.number === 9100);
        expect(createdUniform).toBeDefined();
        expect(createdUniform!.active).toBe(true);
        expect(createdUniform!.issuedEntries.length).toBe(0);

        // 3. Issue the uniform
        const { result: issueResult, success: issueSucess } = await runServerActionTest(issueUniformItem({
            uniformTypeId: ids.uniformTypeIds[0],
            number: 9100,
            cadetId: ids.cadetIds[0],
            options: {},
        }));
        expect(issueSucess).toBeTruthy();

        expect(issueResult[ids.uniformTypeIds[0]]).toBeDefined();
        expect(issueResult[ids.uniformTypeIds[0]]).toEqual(
            expect.arrayContaining([expect.objectContaining({
                number: 9100,
                active: true,
                issuedEntries: expect.arrayContaining([expect.objectContaining({
                    cadet: expect.objectContaining({ id: ids.cadetIds[0] }),
                    dateIssued: expect.anything(),
                })]),
            })])
        );

        // 4. Return the uniform
        const { result: returnResult, success: returnSuccess } = await runServerActionTest(
            returnUniformItem({
                uniformId: createdUniform!.id,
                cadetId: ids.cadetIds[0],
            })
        );
        expect(returnSuccess).toBeTruthy();
        expect(returnResult[ids.uniformTypeIds[0]]).toBeDefined();
        expect(returnResult[ids.uniformTypeIds[0]]).not.toEqual(
            expect.arrayContaining([expect.objectContaining({
                number: 9100,
                active: true,
                issuedEntries: expect.arrayContaining([expect.objectContaining({
                    cadet: expect.objectContaining({ id: ids.cadetIds[0] }),
                    dateIssued: expect.anything(),
                    dateReturned: expect.anything(),
                })]),
            })])
        );

        // 5. Update the uniform
        const { result: updateResult, success: updateSuccess } = await runServerActionTest(
            updateUniformItem({
                id: createdUniform!.id,
                number: createdUniform!.number,
                active: false,
                comment: 'Lifecycle complete',
                generation: ids.uniformGenerationIds[3],
                size: ids.sizeIds[16],
            })
        );

        expect(updateSuccess).toBeTruthy();
        expect(updateResult).toMatchObject({
            id: createdUniform!.id,
            number: createdUniform!.number,
            active: false,
            comment: 'Lifecycle complete',
            generation: {
                id: ids.uniformGenerationIds[3],
            },
            size: {
                id: ids.sizeIds[16],
            },
        });

        // 6. Delete the uniform
        const { success: deleteSuccess } = await runServerActionTest(deleteUniformItem(createdUniform!.id));
        expect(deleteSuccess).toBeTruthy();
        const deletedUniform = await prisma.uniform.findUnique({
            where: { id: createdUniform!.id },
        });
        expect(deletedUniform?.recdeleteUser).toEqual("mana");
        expect(deletedUniform?.recdelete).not.toBeNull();
        expect(checkDateTolerance(deletedUniform!.recdelete!)).toBeLessThan(5000);
    });
});
