import { runServerActionTest } from "@/dal/_helper/testHelper";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { changeSortOrder } from "./sortOrder";

const { ids, cleanup } = new StaticData(0);

// Integration tests for sortOrder function - focus on database effects only
// Business logic, error handling, and edge cases are covered by unit tests

afterEach(async () => cleanup.uniformTypeConfiguration());

describe("<UniformGeneration> changeSortOrder", () => {

    it('should move generation down and update other generations sortOrder in database', async () => {
        // Get initial state to understand current order
        const initialData = await prisma.uniformGeneration.findMany({
            where: {
                fk_uniformType: ids.uniformTypeIds[0],
                recdelete: null
            },
            orderBy: { sortOrder: 'asc' }
        });

        // Move generation from position 0 to position 2
        const targetGeneration = initialData[0];
        const { success } = await runServerActionTest(
            changeSortOrder({
                id: targetGeneration.id,
                newPosition: 2
            })
        );
        expect(success).toBeTruthy();

        // Verify final sortOrder state in database
        const dbData = await prisma.uniformGeneration.findMany({
            where: {
                fk_uniformType: ids.uniformTypeIds[0],
                recdelete: null
            },
            orderBy: { sortOrder: 'asc' }
        });

        expect(dbData).toHaveLength(4);

        // After moving generation from pos 0 to pos 2:
        // Position 0: shifted left (was at pos 1)
        // Position 1: shifted left (was at pos 2)
        // Position 2: moved generation
        // Position 3: unchanged
        expect(dbData[0].id).toBe(initialData[1].id);
        expect(dbData[0].sortOrder).toBe(0);
        expect(dbData[1].id).toBe(initialData[2].id);
        expect(dbData[1].sortOrder).toBe(1);
        expect(dbData[2].id).toBe(targetGeneration.id);
        expect(dbData[2].sortOrder).toBe(2);
        expect(dbData[3].id).toBe(initialData[3].id);
        expect(dbData[3].sortOrder).toBe(3);
    });

    it('should move generation up and update other generations sortOrder in database', async () => {
        // Get initial state to understand current order
        const initialData = await prisma.uniformGeneration.findMany({
            where: {
                fk_uniformType: ids.uniformTypeIds[0],
                recdelete: null
            },
            orderBy: { sortOrder: 'asc' }
        });

        // Move generation from position 3 to position 1
        const targetGeneration = initialData[3];
        const { success } = await runServerActionTest(
            changeSortOrder({
                id: targetGeneration.id,
                newPosition: 1
            })
        );
        expect(success).toBeTruthy();

        // Verify final sortOrder state in database
        const dbData = await prisma.uniformGeneration.findMany({
            where: {
                fk_uniformType: ids.uniformTypeIds[0],
                recdelete: null
            },
            orderBy: { sortOrder: 'asc' }
        });

        expect(dbData).toHaveLength(4);

        // After moving generation from pos 3 to pos 1:
        // Position 0: unchanged
        // Position 1: moved generation
        // Position 2: shifted right (was at pos 1)
        // Position 3: shifted right (was at pos 2)
        expect(dbData[0].id).toBe(initialData[0].id);
        expect(dbData[0].sortOrder).toBe(0);
        expect(dbData[1].id).toBe(targetGeneration.id);
        expect(dbData[1].sortOrder).toBe(1);
        expect(dbData[2].id).toBe(initialData[1].id);
        expect(dbData[2].sortOrder).toBe(2);
        expect(dbData[3].id).toBe(initialData[2].id);
        expect(dbData[3].sortOrder).toBe(3);
    });

    it('should maintain sortOrder integrity when moving to same position', async () => {
        // Get initial state
        const initialData = await prisma.uniformGeneration.findMany({
            where: {
                fk_uniformType: ids.uniformTypeIds[0],
                recdelete: null
            },
            orderBy: { sortOrder: 'asc' }
        });

        // Move generation to its current position (position 1)
        const targetGeneration = initialData[1];
        const { success } = await runServerActionTest(
            changeSortOrder({
                id: targetGeneration.id,
                newPosition: 1
            })
        );
        expect(success).toBeTruthy();

        // Verify no changes in database
        const finalData = await prisma.uniformGeneration.findMany({
            where: {
                fk_uniformType: ids.uniformTypeIds[0],
                recdelete: null
            },
            orderBy: { sortOrder: 'asc' }
        });

        expect(finalData).toEqual(initialData);
    });

    it('should handle complex reordering with multiple consecutive moves', async () => {
        // Get initial state
        const initialData = await prisma.uniformGeneration.findMany({
            where: {
                fk_uniformType: ids.uniformTypeIds[0],
                recdelete: null
            },
            orderBy: { sortOrder: 'asc' }
        });

        // Perform multiple reordering operations
        await runServerActionTest(
            changeSortOrder({
                id: initialData[0].id,
                newPosition: 3
            })
        );

        await runServerActionTest(
            changeSortOrder({
                id: initialData[2].id,
                newPosition: 0
            })
        );

        // Verify final sortOrder integrity
        const dbData = await prisma.uniformGeneration.findMany({
            where: {
                fk_uniformType: ids.uniformTypeIds[0],
                recdelete: null
            },
            orderBy: { sortOrder: 'asc' }
        });

        expect(dbData).toHaveLength(4);

        // Verify all sortOrders are sequential starting from 0
        dbData.forEach((generation, index) => {
            expect(generation.sortOrder).toBe(index);
        });

        // Verify no duplicate sortOrders
        const sortOrders = dbData.map(g => g.sortOrder);
        const uniqueSortOrders = Array.from(new Set(sortOrders));
        expect(uniqueSortOrders).toHaveLength(sortOrders.length);
    });

    it('should not affect generations of different uniform types', async () => {
        // Get initial state of different uniform type
        const initialOtherTypeData = await prisma.uniformGeneration.findMany({
            where: {
                fk_uniformType: ids.uniformTypeIds[1],
                recdelete: null
            },
            orderBy: { sortOrder: 'asc' }
        });

        // Get initial state of target uniform type
        const initialTargetTypeData = await prisma.uniformGeneration.findMany({
            where: {
                fk_uniformType: ids.uniformTypeIds[0],
                recdelete: null
            },
            orderBy: { sortOrder: 'asc' }
        });

        // Move generation in first uniform type
        await runServerActionTest(
            changeSortOrder({
                id: initialTargetTypeData[0].id,
                newPosition: 2
            })
        );

        // Verify other uniform type unchanged
        const finalOtherTypeData = await prisma.uniformGeneration.findMany({
            where: {
                fk_uniformType: ids.uniformTypeIds[1],
                recdelete: null
            },
            orderBy: { sortOrder: 'asc' }
        });

        expect(finalOtherTypeData).toEqual(initialOtherTypeData);
    });
});
