import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { CadetInspectionFormSchema } from "@/zod/deficiency";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { saveCadetInspection } from "./save";
import dayjs from "@/lib/dayjs";

const { ids, data } = new StaticData(0);

describe('saveCadetInspection Integration Tests', () => {
    // Arrange
    const cadetId = ids.cadetIds[0];
    const inspection = data.inspections[4];

    beforeAll(async () => {
        global.__ROLE__ = AuthRole.inspector;
        global.__USERNAME__ = 'aabb';
        global.__ASSOSIATION__ = data.assosiation.id;
    });

    beforeEach(async () => {
        // Make inspection active for today
        await prisma.inspection.update({
            where: { id: inspection.id },
            data: {
                date: dayjs().format("YYYY-MM-DD"), // Today's date
                timeStart: "01:10", // Started
                timeEnd: null // Not ended yet
            }
        });
    });

    afterEach(async () => {
        const { cleanup } = new StaticData(0);
        await cleanup.inspection();
    });

    describe('Database Persistence', () => {
        it('should persist cadet inspection and deregistration cleanup to database', async () => {

            // Create some existing deregistrations to test cleanup
            await prisma.deregistration.createMany({
                data: [
                    { fk_cadet: cadetId, fk_inspection: inspection.id },
                ]
            });

            const props: CadetInspectionFormSchema = {
                cadetId,
                uniformComplete: true,
                oldDeficiencyList: [],
                newDeficiencyList: []
            };

            // Act
            await saveCadetInspection(props);

            // Assert - Verify cadetInspection was persisted
            const savedCadetInspection = await prisma.cadetInspection.findFirst({
                where: {
                    fk_cadet: cadetId,
                    fk_inspection: inspection.id
                }
            });

            expect(savedCadetInspection).toBeTruthy();
            expect(savedCadetInspection?.uniformComplete).toBe(true);
            expect(savedCadetInspection?.inspector).toBe('aabb');

            // Assert - Verify deregistrations were cleaned up
            const remainingDeregistrations = await prisma.deregistration.findMany({
                where: {
                    fk_cadet: cadetId,
                    fk_inspection: inspection.id
                }
            });

            expect(remainingDeregistrations).toHaveLength(0);
        });

        it('should rollback all changes when database operation fails mid-transaction', async () => {
            // Create a deficiency with an invalid foreign key to force a constraint violation
            const invalidDeficiency = {
                typeId: "00000000-0000-0000-0000-000000000000", // Non-existent type ID
                description: "This should fail",
                comment: "Test transaction rollback",
                uniformId: null,
                materialId: null,
                otherMaterialId: null,
                otherMaterialGroupId: null
            };

            const props: CadetInspectionFormSchema = {
                cadetId,
                uniformComplete: true,
                oldDeficiencyList: [],
                newDeficiencyList: [invalidDeficiency]
            };

            // Act & Assert - The operation should fail
            await expect(saveCadetInspection(props)).rejects.toThrow();

            // Assert - Verify NO cadetInspection was created (transaction rollback)
            const cadetInspection = await prisma.cadetInspection.findFirst({
                where: {
                    fk_cadet: cadetId,
                    fk_inspection: inspection.id
                }
            });

            expect(cadetInspection).toBeNull();

            // Assert - Verify NO deficiency was created (transaction rollback)
            const deficiencies = await prisma.deficiency.findMany({
                where: {
                    description: "This should fail",
                    type: { fk_assosiation: data.assosiation.id }
                }
            });

            expect(deficiencies).toHaveLength(0);
        });

        it('should update existing cadet inspection record correctly', async () => {
            // First save - create initial record
            await saveCadetInspection({
                cadetId,
                uniformComplete: true,
                oldDeficiencyList: [],
                newDeficiencyList: []
            });

            // Second save - update existing record
            await saveCadetInspection({
                cadetId,
                uniformComplete: false,
                oldDeficiencyList: [],
                newDeficiencyList: []
            });

            // Assert - Should have exactly one record (updated, not duplicated)
            const cadetInspections = await prisma.cadetInspection.findMany({
                where: {
                    fk_cadet: cadetId,
                    fk_inspection: inspection.id
                }
            });

            expect(cadetInspections).toHaveLength(1);
            expect(cadetInspections[0].uniformComplete).toBe(false);
            expect(cadetInspections[0].inspector).toBe('aabb');
        });
    });

    describe('Deficiency Relationships', () => {
        it('should create uniform deficiency with correct database relationships', async () => {
            // Arrange
            const uniformId = ids.uniformIds[0][0];

            const newDeficiency = {
                typeId: ids.deficiencyTypeIds[0], // uniform dependent type
                description: "", // Will be auto-generated
                comment: "Integration test uniform deficiency",
                uniformId,
                materialId: null,
                otherMaterialId: null,
                otherMaterialGroupId: null
            };

            const props: CadetInspectionFormSchema = {
                cadetId,
                uniformComplete: false,
                oldDeficiencyList: [],
                newDeficiencyList: [newDeficiency]
            };

            // Act
            await saveCadetInspection(props);

            // Assert - Verify deficiency was created with auto-generated description
            const createdDeficiency = await prisma.deficiency.findFirst({
                where: {
                    fk_deficiencyType: ids.deficiencyTypeIds[0],
                    comment: "Integration test uniform deficiency",
                    type: { fk_assosiation: data.assosiation.id }
                }
            });

            expect(createdDeficiency).toBeTruthy();
            expect(createdDeficiency?.description).toContain(data.uniformTypes[0].name);
            expect(createdDeficiency?.userCreated).toBe('aabb');

            // Assert - Verify uniformDeficiency relationship was created
            const uniformDeficiency = await prisma.uniformDeficiency.findFirst({
                where: {
                    deficiencyId: createdDeficiency!.id
                }
            });

            expect(uniformDeficiency).toBeTruthy();
            expect(uniformDeficiency?.fk_uniform).toBe(uniformId);

            // Assert - Verify NO cadetDeficiency was created (should only be uniformDeficiency)
            const cadetDeficiency = await prisma.cadetDeficiency.findFirst({
                where: {
                    deficiencyId: createdDeficiency!.id
                }
            });

            expect(cadetDeficiency).toBeNull();
        });

        it('should create cadet deficiency with material relation and correct database relationships', async () => {
            // Arrange
            const materialId = ids.materialIds[0];

            const newDeficiency = {
                typeId: ids.deficiencyTypeIds[3], // Cadet-material relation type
                description: "", // Will be auto-generated
                comment: "Integration test material deficiency 1",
                uniformId: null,
                materialId,
                otherMaterialId: null,
                otherMaterialGroupId: null
            };

            const props: CadetInspectionFormSchema = {
                cadetId,
                uniformComplete: false,
                oldDeficiencyList: [],
                newDeficiencyList: [newDeficiency]
            };

            // Act
            await saveCadetInspection(props);

            // Assert - Verify deficiency was created with auto-generated description
            const createdDeficiency = await prisma.deficiency.findFirst({
                where: {
                    fk_deficiencyType: ids.deficiencyTypeIds[3],
                    comment: "Integration test material deficiency 1",
                    type: { fk_assosiation: data.assosiation.id }
                }
            });

            expect(createdDeficiency).toBeTruthy();
            expect(createdDeficiency?.description).toContain(data.materialGroups[0].description);
            expect(createdDeficiency?.userCreated).toBe('aabb');

            // Assert - Verify cadetDeficiency relationship was created with material FK
            const cadetDeficiency = await prisma.cadetDeficiency.findFirst({
                where: {
                    deficiencyId: createdDeficiency!.id
                }
            });

            expect(cadetDeficiency).toBeTruthy();
            expect(cadetDeficiency?.fk_cadet).toBe(cadetId);
            expect(cadetDeficiency?.fk_material).toBe(materialId);
            expect(cadetDeficiency?.fk_uniform).toBeNull();

            // Assert - Verify NO uniformDeficiency was created (should only be cadetDeficiency)
            const uniformDeficiency = await prisma.uniformDeficiency.findFirst({
                where: {
                    deficiencyId: createdDeficiency!.id
                }
            });

            expect(uniformDeficiency).toBeNull();
        });

        it('should create cadet deficiency with uniform relation and correct database relationships', async () => {
            // Arrange
            const uniformId = ids.uniformIds[0][0];

            const newDeficiency = {
                typeId: ids.deficiencyTypeIds[2], // cadet dependent with uniform relation type
                description: "", // Will be auto-generated
                comment: "Integration test cadet-uniform deficiency 2",
                uniformId,
                materialId: null,
                otherMaterialId: null,
                otherMaterialGroupId: null
            };

            const props: CadetInspectionFormSchema = {
                cadetId,
                uniformComplete: false,
                oldDeficiencyList: [],
                newDeficiencyList: [newDeficiency]
            };

            // Act
            await saveCadetInspection(props);

            // Assert - Verify deficiency was created with auto-generated description
            const createdDeficiency = await prisma.deficiency.findFirst({
                where: {
                    fk_deficiencyType: ids.deficiencyTypeIds[2],
                    comment: "Integration test cadet-uniform deficiency 2",
                    type: { fk_assosiation: data.assosiation.id }
                }
            });

            expect(createdDeficiency).toBeTruthy();
            expect(createdDeficiency?.description).toContain(data.uniformTypes[0].name);
            expect(createdDeficiency?.userCreated).toBe('aabb');

            // Assert - Verify cadetDeficiency relationship was created with uniform FK
            const cadetDeficiency = await prisma.cadetDeficiency.findFirst({
                where: {
                    deficiencyId: createdDeficiency!.id
                }
            });

            expect(cadetDeficiency).toBeTruthy();
            expect(cadetDeficiency?.fk_cadet).toBe(cadetId);
            expect(cadetDeficiency?.fk_uniform).toBe(uniformId);
            expect(cadetDeficiency?.fk_material).toBeNull();

            // Assert - Verify NO uniformDeficiency was created (cadet dependent, not uniform dependent)
            const uniformDeficiency = await prisma.uniformDeficiency.findFirst({
                where: {
                    deficiencyId: createdDeficiency!.id
                }
            });

            expect(uniformDeficiency).toBeNull();
        });
    });

    // Group 3: Deficiency Lifecycle  
    describe('Deficiency Lifecycle', () => {
        let existingDeficiencyId: string;

        const createExistingDeficiency = async (type: "cadet" | "uniform") => {
            // Create an existing deficiency that needs to be resolved
            const existingDeficiency = await prisma.deficiency.create({
                data: {
                    fk_deficiencyType: type === "cadet"?ids.deficiencyTypeIds[1]: ids.deficiencyTypeIds[2], // cadet dependent type
                    description: "Existing deficiency",
                    comment: "Initial comment",
                    dateCreated: new Date('2023-01-01T10:00:00Z'),
                    dateUpdated: new Date('2023-01-01T10:00:00Z'),
                    dateResolved: null,
                    userCreated: 'testuser',
                    userUpdated: 'testuser',
                    userResolved: null,
                    fk_inspection_created: ids.inspectionIds[0],
                    fk_inspection_resolved: null
                }
            });
            existingDeficiencyId = existingDeficiency.id;

            if (type === "cadet") {
                // Link deficiency to cadet
                await prisma.cadetDeficiency.create({
                    data: {
                        deficiencyId: existingDeficiencyId,
                        fk_cadet: cadetId,
                        fk_uniform: null,
                        fk_material: null
                    }
                });
            } else {

            }

            return existingDeficiency;
        };

        it('should resolve old deficiencies when they are marked as resolved', async () => {
            const existingDeficiency = await createExistingDeficiency("cadet");
            const props: CadetInspectionFormSchema = {
                cadetId,
                uniformComplete: true,
                oldDeficiencyList: [{
                    id: existingDeficiency.id,
                    typeId: existingDeficiency.fk_deficiencyType,
                    typeName: "Cadet",
                    description: "New Description",
                    comment: "Changed Comment",
                    dateCreated: existingDeficiency.dateCreated,
                    resolved: true
                }],
                newDeficiencyList: []
            };

            await saveCadetInspection(props);

            // Verify the deficiency is now resolved
            const resolvedDeficiency = await prisma.deficiency.findUnique({
                where: { id: existingDeficiencyId }
            });

            expect(resolvedDeficiency).not.toBeNull();
            expect(resolvedDeficiency!.comment).toBe(existingDeficiency.comment);
            expect(resolvedDeficiency!.description).toBe(existingDeficiency.description);
            expect(resolvedDeficiency!.dateResolved).toBeTruthy();
            expect(resolvedDeficiency!.userResolved).toBe('aabb');
            expect(resolvedDeficiency!.fk_inspection_resolved).toBe(inspection.id);
        });

        it('should not resolve deficiencies that are not marked as resolved', async () => {
            const existingDeficiency = await createExistingDeficiency("cadet");
            const props: CadetInspectionFormSchema = {
                cadetId,
                uniformComplete: true,
                oldDeficiencyList: [{
                    id: existingDeficiency.id,
                    typeId: existingDeficiency.fk_deficiencyType,
                    typeName: "Cadet",
                    description: existingDeficiency.description,
                    comment: existingDeficiency.comment,
                    dateCreated: existingDeficiency.dateCreated,
                    resolved: false
                }],
                newDeficiencyList: []
            };

            await saveCadetInspection(props);

            // Verify the deficiency remains unresolved
            const unresolvedDeficiency = await prisma.deficiency.findUnique({
                where: { id: existingDeficiencyId }
            });

            expect(unresolvedDeficiency).not.toBeNull();
            expect(unresolvedDeficiency!.comment).toBe(existingDeficiency.comment);
            expect(unresolvedDeficiency!.dateResolved).toBeNull();
            expect(unresolvedDeficiency!.userResolved).toBeNull();
            expect(unresolvedDeficiency!.fk_inspection_resolved).toBeNull();
        });
    });

    // Group 4: Association Security
    describe('Association Security', () => {
        const {data: otherData} = new StaticData(1);

        const otherCadetId: string = otherData.cadets[1].id;
        const otherDeficiencyId: string = otherData.deficiencies[1].id!;

        it('should only create deficiencies scoped to the current association', async () => {
            const props: CadetInspectionFormSchema = {
                cadetId,
                uniformComplete: true,
                oldDeficiencyList: [],
                newDeficiencyList: [{
                    typeId: ids.deficiencyTypeIds[1],
                    description: "Test deficiency",
                    comment: "Should be scoped to our association",
                    uniformId: null,
                    materialId: null,
                    otherMaterialId: null,
                    otherMaterialGroupId: null
                }]
            };

            await saveCadetInspection(props);

            // Verify the other association's deficiency is untouched
            const untouchedDeficiency = await prisma.deficiency.findUnique({
                where: { id: otherDeficiencyId }
            });

            expect(untouchedDeficiency).not.toBeNull();
            expect(untouchedDeficiency!.dateResolved).toBeNull();

            // Verify our new deficiency is properly scoped
            const createdDeficiencies = await prisma.deficiency.findMany({
                where: {
                    description: "Test deficiency",
                    fk_deficiencyType: ids.deficiencyTypeIds[1]
                },
                include: {
                    type: true
                }
            });

            expect(createdDeficiencies).toHaveLength(1);
            expect(createdDeficiencies[0].type.fk_assosiation).toBe(data.assosiation.id);
        });

        it('should not resolve deficiencies from other associations', async () => {
            // Create a deficiency in our association that should be found
            const ourDeficiency = await prisma.deficiency.create({
                data: {
                    fk_deficiencyType: ids.deficiencyTypeIds[1],
                    description: "Our deficiency",
                    comment: "Initial comment",
                    dateCreated: new Date('2023-01-01T10:00:00Z'),
                    dateUpdated: new Date('2023-01-01T10:00:00Z'),
                    dateResolved: null,
                    userCreated: 'testuser',
                    userUpdated: 'testuser',
                    userResolved: null,
                    fk_inspection_created: ids.inspectionIds[0],
                    fk_inspection_resolved: null
                }
            });

            // Link to our cadet
            await prisma.cadetDeficiency.create({
                data: {
                    deficiencyId: ourDeficiency.id,
                    fk_cadet: cadetId,
                    fk_uniform: null,
                    fk_material: null
                }
            });

            const props: CadetInspectionFormSchema = {
                cadetId,
                uniformComplete: true,
                oldDeficiencyList: [
                    {
                        id: ourDeficiency.id,
                        typeId: ids.deficiencyTypeIds[1],
                        typeName: "Cadet",
                        description: "Our deficiency",
                        comment: "Resolved in our association",
                        dateCreated: new Date('2023-01-01T10:00:00Z'),
                        resolved: true
                    },
                    {
                        // This should be ignored (not associated with our cadet)
                        id: otherDeficiencyId,
                        typeId: ids.deficiencyTypeIds[1],
                        typeName: "Cadet",
                        description: "Other deficiency",
                        comment: "Attempted cross-association resolution",
                        dateCreated: new Date('2023-01-01T10:00:00Z'),
                        resolved: true
                    }
                ],
                newDeficiencyList: []
            };

            await saveCadetInspection(props);

            // Verify only our association's deficiency was affected
            const resolvedOurDeficiency = await prisma.deficiency.findUnique({
                where: { id: ourDeficiency.id }
            });
            const untouchedOtherDeficiency = await prisma.deficiency.findUnique({
                where: { id: otherDeficiencyId }
            });

            expect(resolvedOurDeficiency!.dateResolved).toBeTruthy();

            expect(untouchedOtherDeficiency!.dateResolved).toBeNull();
        });

        it('should only operate on cadets within the current association scope', async () => {
            const props: CadetInspectionFormSchema = {
                cadetId: otherCadetId, // Cadet from other association
                uniformComplete: false,
                oldDeficiencyList: [{
                    id: otherDeficiencyId,
                    typeId: ids.deficiencyTypeIds[1],
                    typeName: "Cadet",
                    description: otherData.deficiencies[1].description,
                    comment: otherData.deficiencies[1].comment,
                    dateCreated: otherData.deficiencies[1].dateCreated as Date,
                    resolved: true
                }],
                newDeficiencyList: []
            };

            await expect(saveCadetInspection(props)).rejects.toThrow();

            // Verify the operation worked in the other association
            const resolvedDeficiency = await prisma.deficiency.findUnique({
                where: { id: otherDeficiencyId }
            });

            expect(resolvedDeficiency!.dateResolved).toBeFalsy();
            expect(resolvedDeficiency!.comment).toBe(otherData.deficiencies[1].comment);
        });
    });
});
