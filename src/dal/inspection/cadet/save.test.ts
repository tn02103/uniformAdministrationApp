import { runServerActionTest } from "@/dal/_helper/testHelper";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { CadetInspectionFormSchema } from "@/zod/deficiency";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { saveCadetInspection } from "./save";

const { ids, data, cleanup } = new StaticData(0);

describe('saveCadetInspection', () => {
    beforeAll(async () => {
        global.__ROLE__ = AuthRole.inspector;
        global.__ASSOSIATION__ = data.assosiation.id;
    });


    afterEach(async () => {
        const { cleanup } = new StaticData(0);
        await cleanup.inspection();
    });

    describe('Basic functionality', () => {
        it('should successfully save a cadet inspection with uniform complete', async () => {
            const cadetId = ids.cadetIds[0];
            const props: CadetInspectionFormSchema = {
                cadetId,
                uniformComplete: true,
                oldDeficiencyList: [],
                newDeficiencyList: []
            };
            const result = saveCadetInspection(props)
            await expect(result).resolves.toBe(undefined);

            // Verify cadet inspection was created/updated
            const cadetInspection = await prisma.cadetInspection.findFirst({
                where: {
                    fk_cadet: cadetId,
                    inspection: {
                        fk_assosiation: data.assosiation.id
                    }
                }
            });

            expect(cadetInspection).toBeTruthy();
            expect(cadetInspection?.uniformComplete).toBe(true);
            expect(cadetInspection?.inspector).toBe(data.userIds[0]);
        });

        it('should successfully save a cadet inspection with uniform incomplete', async () => {
            const cadetId = ids.cadetIds[1];
            const props: CadetInspectionFormSchema = {
                cadetId,
                uniformComplete: false,
                oldDeficiencyList: [],
                newDeficiencyList: []
            };

            const { success } = await runServerActionTest(
                saveCadetInspection(props)
            );

            expect(success).toBeTruthy();

            const cadetInspection = await prisma.cadetInspection.findFirst({
                where: {
                    fk_cadet: cadetId,
                    inspection: {
                        fk_assosiation: data.assosiation.id
                    }
                }
            });

            expect(cadetInspection?.uniformComplete).toBe(false);
        });

        it('should update existing cadet inspection', async () => {
            const cadetId = ids.cadetIds[0];

            // First save
            await saveCadetInspection({
                cadetId,
                uniformComplete: true,
                oldDeficiencyList: [],
                newDeficiencyList: []
            });

            // Second save with different data
            const { success } = await runServerActionTest(
                saveCadetInspection({
                    cadetId,
                    uniformComplete: false,
                    oldDeficiencyList: [],
                    newDeficiencyList: []
                })
            );

            expect(success).toBeTruthy();

            const cadetInspections = await prisma.cadetInspection.findMany({
                where: {
                    fk_cadet: cadetId,
                    inspection: {
                        fk_assosiation: data.assosiation.id
                    }
                }
            });

            // Should only have one record (updated, not created new)
            expect(cadetInspections).toHaveLength(1);
            expect(cadetInspections[0].uniformComplete).toBe(false);
        });
    });

    describe('Deregistrations handling', () => {
        it('should clear existing deregistrations for the cadet', async () => {
            const cadetId = ids.cadetIds[0];
            const inspection = data.inspections[0];

            // Create some deregistrations first
            await prisma.deregistration.createMany({
                data: [
                    {
                        fk_cadet: cadetId,
                        fk_inspection: inspection.id
                    }
                ]
            });

            const { success } = await runServerActionTest(
                saveCadetInspection({
                    cadetId,
                    uniformComplete: true,
                    oldDeficiencyList: [],
                    newDeficiencyList: []
                })
            );

            expect(success).toBeTruthy();

            // Verify deregistrations were deleted
            const deregistrations = await prisma.deregistration.findMany({
                where: {
                    fk_cadet: cadetId,
                    fk_inspection: inspection.id
                }
            });

            expect(deregistrations).toHaveLength(0);
        });
    });

    describe('Old deficiencies handling', () => {
        it('should resolve old deficiencies when marked as resolved', async () => {
            const cadetId = ids.cadetIds[0];
            const deficiencyId = ids.deficiencyIds[0];

            const oldDeficiencyList = [{
                id: deficiencyId,
                typeId: ids.deficiencyTypeIds[0],
                typeName: data.deficiencyTypes[0].name,
                description: "Test deficiency",
                comment: "Test comment",
                dateCreated: new Date(),
                resolved: true
            }];

            const { success } = await runServerActionTest(
                saveCadetInspection({
                    cadetId,
                    uniformComplete: true,
                    oldDeficiencyList,
                    newDeficiencyList: []
                })
            );

            expect(success).toBeTruthy();

            // Verify deficiency was resolved
            const deficiency = await prisma.deficiency.findUnique({
                where: { id: deficiencyId }
            });

            expect(deficiency?.dateResolved).toBeTruthy();
            expect(deficiency?.userResolved).toBe(data.userIds[0]);
            expect(deficiency?.fk_inspection_resolved).toBeTruthy();
        });

        it('should unresolve old deficiencies when marked as unresolved', async () => {
            const cadetId = ids.cadetIds[0];
            const deficiencyId = ids.deficiencyIds[0];

            // First resolve the deficiency
            await prisma.deficiency.update({
                where: { id: deficiencyId },
                data: {
                    dateResolved: new Date(),
                    userResolved: data.userIds[0],
                    fk_inspection_resolved: data.inspections[0].id
                }
            });

            const oldDeficiencyList = [{
                id: deficiencyId,
                typeId: ids.deficiencyTypeIds[0],
                typeName: data.deficiencyTypes[0].name,
                description: "Test deficiency",
                comment: "Test comment",
                dateCreated: new Date(),
                resolved: false
            }];

            const { success } = await runServerActionTest(
                saveCadetInspection({
                    cadetId,
                    uniformComplete: true,
                    oldDeficiencyList,
                    newDeficiencyList: []
                })
            );

            expect(success).toBeTruthy();

            // Verify deficiency was unresolved
            const deficiency = await prisma.deficiency.findUnique({
                where: { id: deficiencyId }
            });

            expect(deficiency?.dateResolved).toBeNull();
            expect(deficiency?.userResolved).toBeNull();
            expect(deficiency?.fk_inspection_resolved).toBeNull();
        });
    });

    describe('New deficiencies handling', () => {
        it('should create new cadet deficiency', async () => {
            const cadetId = ids.cadetIds[0];
            const newDeficiencyList = [{
                typeId: ids.deficiencyTypeIds[1], // cadet type
                description: "Test new deficiency",
                comment: "Test comment for new deficiency",
                uniformId: null,
                materialId: null,
                otherMaterialId: null,
                otherMaterialGroupId: null
            }];

            const { success } = await runServerActionTest(
                saveCadetInspection({
                    cadetId,
                    uniformComplete: false,
                    oldDeficiencyList: [],
                    newDeficiencyList
                })
            );

            expect(success).toBeTruthy();

            // Verify deficiency was created
            const deficiency = await prisma.deficiency.findFirst({
                where: {
                    description: "Test new deficiency",
                    type: { fk_assosiation: data.assosiation.id }
                },
                include: {
                    cadetDeficiency: true
                }
            });

            expect(deficiency).toBeTruthy();
            expect(deficiency?.comment).toBe("Test comment for new deficiency");
            expect(deficiency?.userCreated).toBe(data.userIds[0]);
            expect(deficiency?.cadetDeficiency?.fk_cadet).toBe(cadetId);
        });

        it('should create new uniform deficiency with uniform relation', async () => {
            const cadetId = ids.cadetIds[0];
            const uniformId = ids.uniformIds[0][0];

            const newDeficiencyList = [{
                typeId: ids.deficiencyTypeIds[0], // uniform dependent type
                description: "", // Will be auto-generated
                comment: "Uniform deficiency comment",
                uniformId,
                materialId: null,
                otherMaterialId: null,
                otherMaterialGroupId: null
            }];

            const { success } = await runServerActionTest(
                saveCadetInspection({
                    cadetId,
                    uniformComplete: false,
                    oldDeficiencyList: [],
                    newDeficiencyList
                })
            );

            expect(success).toBeTruthy();

            // Verify uniform deficiency was created
            const deficiency = await prisma.deficiency.findFirst({
                where: {
                    fk_deficiencyType: ids.deficiencyTypeIds[0],
                    type: { fk_assosiation: data.assosiation.id }
                },
                include: {
                    uniformDeficiency: true
                }
            });

            expect(deficiency).toBeTruthy();
            expect(deficiency?.description).toContain(data.uniformTypes[0].name);
            expect(deficiency?.uniformDeficiency?.fk_uniform).toBe(uniformId);
        });

        it('should create new cadet deficiency with material relation', async () => {
            const cadetId = ids.cadetIds[0];
            const materialId = ids.materialIds[0];

            const newDeficiencyList = [{
                typeId: ids.deficiencyTypeIds[2], // material relation type
                description: "", // Will be auto-generated
                comment: "Material deficiency comment",
                uniformId: null,
                materialId,
                otherMaterialId: null,
                otherMaterialGroupId: null
            }];

            const { success } = await runServerActionTest(
                saveCadetInspection({
                    cadetId,
                    uniformComplete: false,
                    oldDeficiencyList: [],
                    newDeficiencyList
                })
            );

            expect(success).toBeTruthy();

            // Verify material deficiency was created
            const deficiency = await prisma.deficiency.findFirst({
                where: {
                    fk_deficiencyType: ids.deficiencyTypeIds[2],
                    type: { fk_assosiation: data.assosiation.id }
                },
                include: {
                    cadetDeficiency: true
                }
            });

            expect(deficiency).toBeTruthy();
            expect(deficiency?.description).toContain(data.materialGroups[0].description);
            expect(deficiency?.cadetDeficiency?.fk_material).toBe(materialId);
            expect(deficiency?.cadetDeficiency?.fk_cadet).toBe(cadetId);
        });

        it('should update existing deficiency', async () => {
            const cadetId = ids.cadetIds[0];
            const existingDeficiencyId = ids.deficiencyIds[0];

            const newDeficiencyList = [{
                id: existingDeficiencyId,
                typeId: ids.deficiencyTypeIds[1],
                description: "Updated deficiency description",
                comment: "Updated comment",
                uniformId: null,
                materialId: null,
                otherMaterialId: null,
                otherMaterialGroupId: null
            }];

            const { success } = await runServerActionTest(
                saveCadetInspection({
                    cadetId,
                    uniformComplete: false,
                    oldDeficiencyList: [],
                    newDeficiencyList
                })
            );

            expect(success).toBeTruthy();

            // Verify deficiency was updated
            const deficiency = await prisma.deficiency.findUnique({
                where: { id: existingDeficiencyId }
            });

            expect(deficiency?.description).toBe("Updated deficiency description");
            expect(deficiency?.comment).toBe("Updated comment");
            expect(deficiency?.userUpdated).toBe(data.userIds[0]);
            expect(deficiency?.dateUpdated).toBeTruthy();
        });
    });

    describe('Error handling', () => {
        it('should throw error when no active inspection exists', async () => {
            // Remove all inspections
            await cleanup.inspection();

            const cadetId = ids.cadetIds[0]; const { success, result } = await runServerActionTest(
                saveCadetInspection({
                    cadetId,
                    uniformComplete: true,
                    oldDeficiencyList: [],
                    newDeficiencyList: []
                })
            );

            expect(success).toBeFalsy();
            expect(result.message).toContain("Could not save CadetInspection since no inspection is active");
        });

        it('should throw error when uniform deficiency missing uniformId', async () => {
            const cadetId = ids.cadetIds[0];

            const newDeficiencyList = [{
                typeId: ids.deficiencyTypeIds[0], // uniform dependent type
                description: "Test",
                comment: "Test comment",
                uniformId: null, // Missing required uniformId
                materialId: null,
                otherMaterialId: null,
                otherMaterialGroupId: null
            }];

            const { success, result } = await runServerActionTest(
                saveCadetInspection({
                    cadetId,
                    uniformComplete: false,
                    oldDeficiencyList: [],
                    newDeficiencyList
                })
            );

            expect(success).toBeFalsy();
            expect(result.message).toContain("Could not save new Deficiency fk_uniform is missing");
        });

        it('should throw error when material deficiency missing materialId', async () => {
            const cadetId = ids.cadetIds[0];

            const newDeficiencyList = [{
                typeId: ids.deficiencyTypeIds[2], // material relation type
                description: "Test",
                comment: "Test comment",
                uniformId: null,
                materialId: null, // Missing required materialId
                otherMaterialId: null,
                otherMaterialGroupId: null
            }];

            const { success, result } = await runServerActionTest(
                saveCadetInspection({
                    cadetId,
                    uniformComplete: false,
                    oldDeficiencyList: [],
                    newDeficiencyList
                })
            );

            expect(success).toBeFalsy();
            expect(result.message).toContain("Could not save new Deficiency fk_material is missing");
        });

        it('should handle invalid cadet ID', async () => {
            const invalidCadetId = "00000000-0000-0000-0000-000000000000"; const { success } = await runServerActionTest(
                saveCadetInspection({
                    cadetId: invalidCadetId,
                    uniformComplete: true,
                    oldDeficiencyList: [],
                    newDeficiencyList: []
                })
            );

            expect(success).toBeFalsy();
        });

        it('should handle invalid deficiency type ID', async () => {
            const cadetId = ids.cadetIds[0];
            const invalidTypeId = "00000000-0000-0000-0000-000000000000";

            const newDeficiencyList = [{
                typeId: invalidTypeId,
                description: "Test",
                comment: "Test comment",
                uniformId: null,
                materialId: null,
                otherMaterialId: null, otherMaterialGroupId: null
            }];

            const { success } = await runServerActionTest(
                saveCadetInspection({
                    cadetId,
                    uniformComplete: false,
                    oldDeficiencyList: [],
                    newDeficiencyList
                })
            );

            expect(success).toBeFalsy();
        });
    });

    describe('Complex scenarios', () => {
        it('should handle mixed operations: resolve old deficiencies and create new ones', async () => {
            const cadetId = ids.cadetIds[0];
            const oldDeficiencyId = ids.deficiencyIds[0];

            const oldDeficiencyList = [{
                id: oldDeficiencyId,
                typeId: ids.deficiencyTypeIds[0],
                typeName: data.deficiencyTypes[0].name,
                description: "Old deficiency",
                comment: "Old comment",
                dateCreated: new Date(),
                resolved: true
            }];

            const newDeficiencyList = [{
                typeId: ids.deficiencyTypeIds[1],
                description: "New deficiency",
                comment: "New comment",
                uniformId: null,
                materialId: null,
                otherMaterialId: null,
                otherMaterialGroupId: null
            }];

            const { success } = await runServerActionTest(
                saveCadetInspection({
                    cadetId,
                    uniformComplete: false,
                    oldDeficiencyList,
                    newDeficiencyList
                })
            );

            expect(success).toBeTruthy();

            // Verify old deficiency was resolved
            const oldDeficiency = await prisma.deficiency.findUnique({
                where: { id: oldDeficiencyId }
            });
            expect(oldDeficiency?.dateResolved).toBeTruthy();

            // Verify new deficiency was created
            const newDeficiency = await prisma.deficiency.findFirst({
                where: {
                    description: "New deficiency",
                    type: { fk_assosiation: data.assosiation.id }
                }
            });
            expect(newDeficiency).toBeTruthy();
        });

        it('should delete deficiencies that were removed from the list', async () => {
            const cadetId = ids.cadetIds[0];

            // Create some deficiencies in the inspection first
            const inspection = data.inspections[0];
            const deficiencyToDelete = await prisma.deficiency.create({
                data: {
                    id: ids.deficiencyIds[3],
                    fk_deficiencyType: ids.deficiencyTypeIds[1],
                    description: "Deficiency to delete",
                    comment: "Will be deleted",
                    userCreated: data.userIds[0],
                    userUpdated: data.userIds[0],
                    fk_inspection_created: inspection.id
                }
            });

            // Update inspection to include this deficiency in deficiencyCreated
            await prisma.inspection.update({
                where: { id: inspection.id },
                data: {
                    deficiencyCreated: {
                        connect: { id: deficiencyToDelete.id }
                    }
                }
            });

            // Save with empty new deficiency list (should delete the existing one)
            const { success } = await runServerActionTest(
                saveCadetInspection({
                    cadetId,
                    uniformComplete: true,
                    oldDeficiencyList: [],
                    newDeficiencyList: []
                })
            );

            expect(success).toBeTruthy();

            // Verify deficiency was deleted
            const deletedDeficiency = await prisma.deficiency.findUnique({
                where: { id: deficiencyToDelete.id }
            });
            expect(deletedDeficiency).toBeNull();
        });
    });

    describe('Authorization', () => {
        it('should require inspector role', async () => {
            global.__ROLE__ = AuthRole.user;

            const result = saveCadetInspection({
                cadetId: ids.cadetIds[0],
                uniformComplete: true,
                oldDeficiencyList: [],
                newDeficiencyList: []
            })

            await expect(result).rejects.toThrow();

            // Reset role for other tests
            global.__ROLE__ = AuthRole.inspector;
        });
    });
});


