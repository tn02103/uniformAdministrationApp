import { runServerActionTest } from "@/dal/_helper/testHelper";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { create } from "./create";

const { ids, cleanup } = new StaticData(0);

// Integration tests for create function - focus on database effects only
// Business logic, error handling, and edge cases are covered by unit tests

afterEach(async () => cleanup.uniformTypeConfiguration());

describe('<UniformGeneration> create', () => {
    it('should create generation with correct sortOrder in database', async () => {
        const initialCount = await prisma.uniformGeneration.count({
            where: {
                fk_uniformType: ids.uniformTypeIds[0],
                recdelete: null
            }
        });

        const { success } = await runServerActionTest(
            create({
                name: 'New Test Gen',
                outdated: false,
                fk_sizelist: ids.sizelistIds[0],
                uniformTypeId: ids.uniformTypeIds[0]
            })
        );
        expect(success).toBeTruthy();

        const dbData = await prisma.uniformGeneration.findFirst({
            where: {
                name: 'New Test Gen',
                fk_uniformType: ids.uniformTypeIds[0],
                recdelete: null
            }
        });
        expect(dbData).not.toBeNull();
        expect(dbData?.sortOrder).toBe(initialCount);
        expect(dbData?.outdated).toBe(false);
        expect(dbData?.fk_sizelist).toBe(ids.sizelistIds[0]);
        expect(dbData?.fk_uniformType).toBe(ids.uniformTypeIds[0]);
    });

    it('should create generation without sizelist for non-sizing uniform type in database', async () => {
        const { success } = await runServerActionTest(
            create({
                name: 'TestGen NoSizes',
                outdated: true,
                fk_sizelist: ids.sizelistIds[0], // This should be ignored
                uniformTypeId: ids.uniformTypeIds[1] // Type that uses generations but not sizes
            })
        );
        expect(success).toBeTruthy();

        const dbData = await prisma.uniformGeneration.findFirst({
            where: {
                name: 'TestGen NoSizes',
                fk_uniformType: ids.uniformTypeIds[1],
                recdelete: null
            }
        });
        expect(dbData).not.toBeNull();
        expect(dbData?.fk_sizelist).toBeNull();
        expect(dbData?.outdated).toBe(true);
    });

    it('should properly establish relationships in database', async () => {
        const { success, result } = await runServerActionTest(
            create({
                name: 'Rel Test Gen',
                outdated: false,
                fk_sizelist: ids.sizelistIds[1],
                uniformTypeId: ids.uniformTypeIds[0]
            })
        );
        expect(success).toBeTruthy();

        // Verify the generation appears in the returned uniform type list
        const uniformType = result.find((ut: { id: string }) => ut.id === ids.uniformTypeIds[0]);
        expect(uniformType).toBeDefined();
        expect(uniformType.uniformGenerationList).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'Rel Test Gen',
                    fk_sizelist: ids.sizelistIds[1]
                })
            ])
        );

        // Verify database relationships
        const dbGeneration = await prisma.uniformGeneration.findFirst({
            where: {
                name: 'Rel Test Gen',
                recdelete: null
            }
        });
        expect(dbGeneration?.fk_uniformType).toBe(ids.uniformTypeIds[0]);
        expect(dbGeneration?.fk_sizelist).toBe(ids.sizelistIds[1]);
    });
});
