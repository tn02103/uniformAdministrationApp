import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { CadetInspectionFormSchema } from "@/zod/deficiency";
import { saveCadetInspection } from "./save";

// Mock the get module
jest.mock("./get", () => ({
    unsecuredGetActiveInspection: jest.fn(),
}));

// Global test data sets
const TEST_IDS = {
    cadetId: "cadet-123",
    inspectionId: "inspection-456",
    assosiation: "test-assosiation-id",
    deficiency1: "def-001",
    deficiency2: "def-002",
    deficiency3: "def-003",
    typeId1: "type-001",
    typeId2: "type-002",
    typeId3: "type-003",
    uniformId: "uniform-001",
    materialId: "material-001",
};

const TEST_USER = {
    username: "testuser",
    assosiation: "test-assosiation-id",
};

const MOCK_INSPECTION = {
    id: TEST_IDS.inspectionId,
    deficiencyCreated: [],
};

const BASE_CADET_INSPECTION_PROPS: CadetInspectionFormSchema = {
    cadetId: TEST_IDS.cadetId,
    uniformComplete: true,
    oldDeficiencyList: [],
    newDeficiencyList: [],
};

const SAMPLE_OLD_DEFICIENCIES = [
    {
        id: TEST_IDS.deficiency1,
        resolved: true,
        typeId: TEST_IDS.typeId1,
        typeName: "Test Type 1",
        description: "Test deficiency 1",
        comment: "Test comment 1",
        dateCreated: new Date("2024-01-01"),
    },
    {
        id: TEST_IDS.deficiency2,
        resolved: false,
        typeId: TEST_IDS.typeId2,
        typeName: "Test Type 2",
        description: "Test deficiency 2",
        comment: "Test comment 2",
        dateCreated: new Date("2024-01-02"),
    },
    {
        id: TEST_IDS.deficiency3,
        resolved: true,
        typeId: TEST_IDS.typeId3,
        typeName: "Test Type 3",
        description: "Test deficiency 3",
        comment: "Test comment 3",
        dateCreated: new Date("2024-01-03"),
    },
];

// Mock deficiency types for different test scenarios
const MOCK_DEFICIENCY_TYPES = {
    uniform: {
        id: TEST_IDS.typeId1,
        dependent: "uniform",
        relation: null,
    },
    cadetWithUniformRelation: {
        id: TEST_IDS.typeId1,
        dependent: "cadet",
        relation: "uniform",
    },
    cadetWithMaterialRelation: {
        id: TEST_IDS.typeId1,
        dependent: "cadet",
        relation: "material",
    },
    cadetWithoutRelation: {
        id: TEST_IDS.typeId1,
        dependent: "cadet",
        relation: null,
    },
};

// Mock uniform object for tests
const MOCK_UNIFORM = {
    id: TEST_IDS.uniformId,
    number: 12345,
    type: {
        name: "TestUniform"
    }
};

// Mock material object for tests  
const MOCK_MATERIAL = {
    id: TEST_IDS.materialId,
    typename: "TestMaterial",
    materialGroup: {
        description: "TestGroup"
    }
};

// Mock other material for "other" selection tests
const MOCK_OTHER_MATERIAL = {
    id: "other-material-id",
    typename: "Other Material",
    materialGroup: {
        description: "Other Group"
    }
};

// Base template for new deficiencies
const BASE_NEW_DEFICIENCY = {
    typeId: TEST_IDS.typeId1,
    description: "",
    comment: "Test comment",
    uniformId: null,
    materialId: null,
    otherMaterialId: null,
    otherMaterialGroupId: null,
};

// Common mock database return values
const MOCK_DB_RETURNS = {
    deficiency: { id: "created-def-id" },
    existingDeficiency: { id: "existing-def-id" },
};

// Mock inspection with orphaned deficiencies for cleanup tests
const MOCK_INSPECTION_WITH_ORPHANS = {
    ...MOCK_INSPECTION,
    deficiencyCreated: [
        { id: "orphaned-def-1" },
        { id: "orphaned-def-2" }
    ]
};

describe("saveCadetInspection", () => {
    const mockUnsecuredGetActiveInspection = jest.requireMock("./get").unsecuredGetActiveInspection;
    beforeEach(() => {
        // Setup default successful mocks
        mockUnsecuredGetActiveInspection.mockResolvedValue(MOCK_INSPECTION);

        // Setup global test values
        global.__ROLE__ = AuthRole.inspector;
        global.__USERNAME__ = TEST_USER.username;
        global.__ASSOSIATION__ = TEST_USER.assosiation;
    });

    describe("Group 1: Pre-condition Validation", () => {
        it("should throw error when no active inspection exists", async () => {
            // Arrange
            mockUnsecuredGetActiveInspection.mockResolvedValue(null);

            const props = { ...BASE_CADET_INSPECTION_PROPS };

            // Act & Assert
            await expect(saveCadetInspection(props)).rejects.toThrow(
                "Could not save CadetInspection since no inspection is active"
            );

            // Verify mocks were called correctly
            expect(mockUnsecuredGetActiveInspection).toHaveBeenCalledWith(
                TEST_IDS.cadetId,
                TEST_USER.assosiation
            );

            // Verify no database transaction was started
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });
    });

    describe("Group 2: Old Deficiency Resolution Logic", () => {
        it("should resolve selected old deficiencies", async () => {
            // Arrange
            const propsWithOldDeficiencies = {
                ...BASE_CADET_INSPECTION_PROPS,
                oldDeficiencyList: SAMPLE_OLD_DEFICIENCIES,
            };

            // Act
            await saveCadetInspection(propsWithOldDeficiencies);

            // Assert
            expect(prisma.deficiency.updateMany).toHaveBeenCalledWith({
                where: {
                    id: { in: [TEST_IDS.deficiency1, TEST_IDS.deficiency3] }, // Only resolved deficiencies
                    type: { fk_assosiation: TEST_USER.assosiation },
                    dateResolved: null,
                },
                data: {
                    dateResolved: expect.any(Date),
                    userResolved: TEST_USER.username,
                    fk_inspection_resolved: TEST_IDS.inspectionId,
                },
            });
        });

        it("should unresolve previously resolved deficiencies", async () => {
            // Arrange
            const propsWithOldDeficiencies = {
                ...BASE_CADET_INSPECTION_PROPS,
                oldDeficiencyList: SAMPLE_OLD_DEFICIENCIES,
            };

            // Act
            await saveCadetInspection(propsWithOldDeficiencies);

            // Assert
            expect(prisma.deficiency.updateMany).toHaveBeenCalledWith({
                where: {
                    id: { in: [TEST_IDS.deficiency2] }, // Only unresolved deficiencies
                    type: { fk_assosiation: TEST_USER.assosiation },
                    dateResolved: { not: null },
                },
                data: {
                    dateResolved: null,
                    userResolved: null,
                    fk_inspection_resolved: null,
                },
            });
        });

        it("should handle empty oldDeficiencyList", async () => {
            // Arrange
            const propsWithEmptyOldDeficiencies = {
                ...BASE_CADET_INSPECTION_PROPS,
                oldDeficiencyList: [],
            };

            // Act
            await saveCadetInspection(propsWithEmptyOldDeficiencies);

            // Assert
            // Verify that deficiency.updateMany is NOT called for resolution/unresolution
            expect(prisma.deficiency.updateMany).toHaveBeenCalledTimes(0);

            // But other operations should still proceed normally
            expect(prisma.cadetInspection.upsert).toHaveBeenCalled();
            expect(prisma.deregistration.deleteMany).toHaveBeenCalled();
        });

        it("should handle mixed resolved/unresolved old deficiencies", async () => {
            // Arrange
            const propsWithMixedDeficiencies = {
                ...BASE_CADET_INSPECTION_PROPS,
                oldDeficiencyList: SAMPLE_OLD_DEFICIENCIES,
            };

            // Act
            await saveCadetInspection(propsWithMixedDeficiencies);

            // Assert
            // Verify TWO separate updateMany calls are made for deficiency resolution
            const updateManyCalls = (prisma.deficiency.updateMany as jest.Mock).mock.calls;
            const resolutionCalls = updateManyCalls.filter(call =>
                call[0].where.dateResolved !== undefined
            );
            expect(resolutionCalls).toHaveLength(2);

            // First call for resolving (dateResolved: null in where clause)
            const resolvingCall = resolutionCalls.find(call =>
                call[0].where.dateResolved === null
            );
            expect(resolvingCall).toBeDefined();
            expect(resolvingCall[0]).toMatchObject({
                where: {
                    id: { in: [TEST_IDS.deficiency1, TEST_IDS.deficiency3] },
                    type: { fk_assosiation: TEST_USER.assosiation },
                    dateResolved: null,
                },
                data: {
                    dateResolved: expect.any(Date),
                    userResolved: TEST_USER.username,
                    fk_inspection_resolved: TEST_IDS.inspectionId,
                },
            });

            // Second call for unresolving (dateResolved: { not: null } in where clause)
            const unresolvingCall = resolutionCalls.find(call =>
                call[0].where.dateResolved && typeof call[0].where.dateResolved === 'object' && call[0].where.dateResolved.not === null
            );
            expect(unresolvingCall).toBeDefined();
            expect(unresolvingCall[0]).toMatchObject({
                where: {
                    id: { in: [TEST_IDS.deficiency2] },
                    type: { fk_assosiation: TEST_USER.assosiation },
                    dateResolved: { not: null },
                },
                data: {
                    dateResolved: null,
                    userResolved: null,
                    fk_inspection_resolved: null,
                },
            });
        });

        it("should filter deficiencies by association", async () => {
            // Arrange
            const propsWithOldDeficiencies = {
                ...BASE_CADET_INSPECTION_PROPS,
                oldDeficiencyList: [SAMPLE_OLD_DEFICIENCIES[0]], // Only one resolved deficiency
            };

            // Act
            await saveCadetInspection(propsWithOldDeficiencies);

            // Assert
            // Verify that the updateMany call includes the association filter
            expect(prisma.deficiency.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        type: { fk_assosiation: TEST_USER.assosiation },
                    }),
                })
            );
        });

        it("should handle oldDeficiencyList with only resolved deficiencies", async () => {
            // Arrange
            const onlyResolvedDeficiencies = SAMPLE_OLD_DEFICIENCIES.filter(d => d.resolved);
            const propsWithOnlyResolved = {
                ...BASE_CADET_INSPECTION_PROPS,
                oldDeficiencyList: onlyResolvedDeficiencies,
            };

            // Act
            await saveCadetInspection(propsWithOnlyResolved);

            // Assert
            expect(prisma.deficiency.updateMany).toHaveBeenCalledTimes(1);
            // Should only call updateMany once (for resolving)
            const updateManyCalls = (prisma.deficiency.updateMany as jest.Mock).mock.calls;
            const resolutionCalls = updateManyCalls.filter(call =>
                call[0].where.dateResolved !== undefined
            );
            expect(resolutionCalls).toHaveLength(1);

            // Should be the resolving call
            expect(resolutionCalls[0][0].where.dateResolved).toBe(null);
        });

        it("should handle oldDeficiencyList with only unresolved deficiencies", async () => {
            // Arrange
            const onlyUnresolvedDeficiencies = SAMPLE_OLD_DEFICIENCIES.filter(d => !d.resolved);
            const propsWithOnlyUnresolved = {
                ...BASE_CADET_INSPECTION_PROPS,
                oldDeficiencyList: onlyUnresolvedDeficiencies,
            };

            // Act
            await saveCadetInspection(propsWithOnlyUnresolved);

            // Assert
            expect(prisma.deficiency.updateMany).toHaveBeenCalledTimes(1);
            // Should only call updateMany once (for unresolving)
            const updateManyCalls = (prisma.deficiency.updateMany as jest.Mock).mock.calls;
            const resolutionCalls = updateManyCalls.filter(call =>
                call[0].where.dateResolved !== undefined
            );
            expect(resolutionCalls).toHaveLength(1);

            // Should be the unresolving call
            expect(resolutionCalls[0][0].where.dateResolved).toEqual({ not: null });
        });
    });

    describe("Group 3: New Deficiency Type Validation & Requirements", () => {
        it("should throw error for non-existent deficiency type", async () => {
            // Arrange
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                typeId: "non-existent-type",
                description: "Test deficiency",
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            // Mock findUniqueOrThrow to throw
            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockRejectedValue(
                new Error("Record not found")
            );

            // Act & Assert
            await expect(saveCadetInspection(propsWithNewDeficiency)).rejects.toThrow("Record not found");

            // Verify the type lookup was attempted
            expect(prisma.deficiencyType.findUniqueOrThrow).toHaveBeenCalledWith({
                where: {
                    id: "non-existent-type",
                    AND: {
                        fk_assosiation: TEST_USER.assosiation,
                    }
                }
            });
        });

        it("should throw error for missing uniformId when dependent='uniform'", async () => {
            // Arrange
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                description: "Test deficiency",
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.uniform);

            // Act & Assert
            await expect(saveCadetInspection(propsWithNewDeficiency)).rejects.toThrow(
                "Could not save new Deficiency fk_uniform is missing"
            );
        });

        it("should throw error for missing uniformId when dependent='cadet' AND relation='uniform'", async () => {
            // Arrange
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                description: "Test deficiency",
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithUniformRelation);

            // Act & Assert
            await expect(saveCadetInspection(propsWithNewDeficiency)).rejects.toThrow(
                "Could not save new Deficiency fk_uniform is missing"
            );
        });

        it("should throw error for missing materialId when dependent='cadet' AND relation='material'", async () => {
            // Arrange
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                description: "Test deficiency",
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithMaterialRelation);

            // Act & Assert
            await expect(saveCadetInspection(propsWithNewDeficiency)).rejects.toThrow(
                "Could not save new Deficiency fk_material is missing"
            );
        });

        it("should allow deficiency when dependent='cadet' AND relation=null", async () => {
            // Arrange
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                description: "Manual description",
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithoutRelation);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue(MOCK_DB_RETURNS.deficiency);

            // Act
            await saveCadetInspection(propsWithNewDeficiency);

            // Assert
            // Should not throw and should create the deficiency
            expect(prisma.deficiency.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({
                        fk_deficiencyType: TEST_IDS.typeId1,
                        description: "Manual description",
                        comment: "Test comment",
                    }),
                })
            );

            // Should create cadetDeficiency (not uniformDeficiency)
            expect(prisma.cadetDeficiency.upsert).toHaveBeenCalledWith({
                where: { deficiencyId: "created-def-id" },
                create: {
                    deficiencyId: "created-def-id",
                    fk_cadet: TEST_IDS.cadetId,
                    fk_material: undefined,
                    fk_uniform: undefined
                },
                update: {
                    fk_material: undefined,
                    fk_uniform: undefined,
                }
            });
        });

        it("should handle 'other' materialId correctly", async () => {
            // Arrange
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                materialId: "other",
                otherMaterialId: "other-material-id",
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithMaterialRelation);
            (prisma.material.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_OTHER_MATERIAL);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue(MOCK_DB_RETURNS.deficiency);

            // Act
            await saveCadetInspection(propsWithNewDeficiency);

            // Assert
            // Should use otherMaterialId for material lookup
            expect(prisma.material.findUniqueOrThrow).toHaveBeenCalledWith({
                where: {
                    id: "other-material-id",
                    AND: { materialGroup: { fk_assosiation: TEST_USER.assosiation } },
                },
                include: { materialGroup: true }
            });

            // Should generate material description
            expect(prisma.deficiency.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({
                        description: "Other Group-Other Material",
                    }),
                })
            );
        });
    });

    describe("Group 4: Description Generation Logic", () => {
        it("should generate uniform description when dependent='uniform'", async () => {
            // Arrange
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                uniformId: TEST_IDS.uniformId,
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.uniform);
            (prisma.uniform.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_UNIFORM);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue(MOCK_DB_RETURNS.deficiency);

            // Act
            await saveCadetInspection(propsWithNewDeficiency);

            // Assert
            expect(prisma.uniform.findUniqueOrThrow).toHaveBeenCalledWith({
                where: {
                    id: TEST_IDS.uniformId,
                    type: { fk_assosiation: TEST_USER.assosiation }
                },
                include: {
                    type: true
                }
            });

            expect(prisma.deficiency.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({
                        description: "TestUniform-12345",
                    }),
                })
            );
        });

        it("should generate uniform description when relation='uniform'", async () => {
            // Arrange
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                uniformId: TEST_IDS.uniformId,
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithUniformRelation);
            (prisma.uniform.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_UNIFORM);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue(MOCK_DB_RETURNS.deficiency);

            // Act
            await saveCadetInspection(propsWithNewDeficiency);

            // Assert
            expect(prisma.deficiency.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({
                        description: "TestUniform-12345",
                    }),
                })
            );

            // Should create cadetDeficiency with uniform relation
            expect(prisma.cadetDeficiency.upsert).toHaveBeenCalledWith({
                where: { deficiencyId: "created-def-id" },
                create: {
                    deficiencyId: "created-def-id",
                    fk_cadet: TEST_IDS.cadetId,
                    fk_material: undefined,
                    fk_uniform: TEST_IDS.uniformId
                },
                update: {
                    fk_material: undefined,
                    fk_uniform: TEST_IDS.uniformId,
                }
            });
        });

        it("should generate material description when relation='material'", async () => {
            // Arrange
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                materialId: TEST_IDS.materialId,
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithMaterialRelation);
            (prisma.material.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_MATERIAL);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue(MOCK_DB_RETURNS.deficiency);

            // Act
            await saveCadetInspection(propsWithNewDeficiency);

            // Assert
            expect(prisma.material.findUniqueOrThrow).toHaveBeenCalledWith({
                where: {
                    id: TEST_IDS.materialId,
                    AND: { materialGroup: { fk_assosiation: TEST_USER.assosiation } },
                },
                include: { materialGroup: true }
            });

            expect(prisma.deficiency.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({
                        description: "TestGroup-TestMaterial",
                    }),
                })
            );
        });

        it("should throw error for missing description", async () => {
            // Arrange
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                // description remains empty from base
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithoutRelation);

            // Act & Assert
            await expect(saveCadetInspection(propsWithNewDeficiency)).rejects.toThrow(
                "Could not save Deficiency description is missing"
            );
        });

        it("should not generate description for dependent='cadet' AND relation=null", async () => {
            // Arrange
            const manualDescriptionDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                description: "Manual description provided",
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [manualDescriptionDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithoutRelation);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue(MOCK_DB_RETURNS.deficiency);

            // Act
            await saveCadetInspection(propsWithNewDeficiency);

            // Assert
            // Should not call uniform or material lookups
            expect(prisma.uniform.findUniqueOrThrow).not.toHaveBeenCalled();
            expect(prisma.material.findUniqueOrThrow).not.toHaveBeenCalled();

            // Should use the provided description
            expect(prisma.deficiency.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({
                        description: "Manual description provided",
                    }),
                })
            );
        });
    });

    describe("Group 5: Database Operation Flow & Relationship Creation", () => {
        it("should call deregistration.deleteMany with correct parameters", async () => {
            // Arrange
            const props = { ...BASE_CADET_INSPECTION_PROPS };

            // Act
            await saveCadetInspection(props);

            // Assert
            expect(prisma.deregistration.deleteMany).toHaveBeenCalledWith({
                where: {
                    fk_cadet: TEST_IDS.cadetId,
                    fk_inspection: TEST_IDS.inspectionId,
                },
            });
        });

        it("should call cadetInspection.upsert with correct create/update data", async () => {
            // Arrange
            const props = {
                ...BASE_CADET_INSPECTION_PROPS,
                uniformComplete: false,
            };

            // Act
            await saveCadetInspection(props);

            // Assert
            expect(prisma.cadetInspection.upsert).toHaveBeenCalledWith({
                where: {
                    fk_inspection_fk_cadet: {
                        fk_inspection: TEST_IDS.inspectionId,
                        fk_cadet: TEST_IDS.cadetId,
                    }
                },
                update: {
                    uniformComplete: false,
                    inspector: TEST_USER.username,
                },
                create: {
                    fk_cadet: TEST_IDS.cadetId,
                    fk_inspection: TEST_IDS.inspectionId,
                    uniformComplete: false,
                    inspector: TEST_USER.username,
                },
            });
        });

        it("should call deficiency.upsert with correct parameters for new deficiencies", async () => {
            // Arrange
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                description: "New deficiency",
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithoutRelation);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue(MOCK_DB_RETURNS.deficiency);

            // Act
            await saveCadetInspection(propsWithNewDeficiency);

            // Assert
            expect(prisma.deficiency.upsert).toHaveBeenCalledWith({
                where: {
                    id: expect.any(String),
                    AND: { type: { fk_assosiation: TEST_USER.assosiation } }
                },
                create: {
                    fk_deficiencyType: TEST_IDS.typeId1,
                    description: "New deficiency",
                    comment: "Test comment",
                    userCreated: TEST_USER.username,
                    userUpdated: TEST_USER.username,
                    fk_inspection_created: TEST_IDS.inspectionId,
                },
                update: {
                    description: "New deficiency",
                    comment: "Test comment",
                    userUpdated: TEST_USER.username,
                    dateUpdated: expect.any(Date),
                }
            });
        });

        it("should call deficiency.upsert with correct parameters for existing deficiencies", async () => {
            // Arrange
            const existingDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                id: "existing-def-id",
                description: "Updated deficiency",
                comment: "Updated comment",
            };

            const propsWithExistingDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [existingDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithoutRelation);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue(MOCK_DB_RETURNS.existingDeficiency);

            // Act
            await saveCadetInspection(propsWithExistingDeficiency);

            // Assert
            expect(prisma.deficiency.upsert).toHaveBeenCalledWith({
                where: {
                    id: "existing-def-id",
                    AND: { type: { fk_assosiation: TEST_USER.assosiation } }
                },
                create: {
                    fk_deficiencyType: TEST_IDS.typeId1,
                    description: "Updated deficiency",
                    comment: "Updated comment",
                    userCreated: TEST_USER.username,
                    userUpdated: TEST_USER.username,
                    fk_inspection_created: TEST_IDS.inspectionId,
                },
                update: {
                    description: "Updated deficiency",
                    comment: "Updated comment",
                    userUpdated: TEST_USER.username,
                    dateUpdated: expect.any(Date),
                }
            });
        });

        it("should call uniformDeficiency.upsert when dependent='uniform'", async () => {
            // Arrange
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                uniformId: TEST_IDS.uniformId,
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.uniform);
            (prisma.uniform.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_UNIFORM);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue(MOCK_DB_RETURNS.deficiency);

            // Act
            await saveCadetInspection(propsWithNewDeficiency);

            // Assert
            expect(prisma.uniformDeficiency.upsert).toHaveBeenCalledWith({
                where: { deficiencyId: "created-def-id" },
                create: {
                    deficiencyId: "created-def-id",
                    fk_uniform: TEST_IDS.uniformId,
                },
                update: {
                    fk_uniform: TEST_IDS.uniformId,
                },
            });

            // Should NOT create cadetDeficiency
            expect(prisma.cadetDeficiency.upsert).not.toHaveBeenCalled();
        });

        it("should call cadetDeficiency.upsert when dependent='cadet'", async () => {
            // Arrange
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                description: "Test deficiency",
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithoutRelation);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue(MOCK_DB_RETURNS.deficiency);

            // Act
            await saveCadetInspection(propsWithNewDeficiency);

            // Assert
            expect(prisma.cadetDeficiency.upsert).toHaveBeenCalledWith({
                where: { deficiencyId: "created-def-id" },
                create: {
                    deficiencyId: "created-def-id",
                    fk_cadet: TEST_IDS.cadetId,
                    fk_material: undefined,
                    fk_uniform: undefined
                },
                update: {
                    fk_material: undefined,
                    fk_uniform: undefined,
                }
            });

            // Should NOT create uniformDeficiency
            expect(prisma.uniformDeficiency.upsert).not.toHaveBeenCalled();
        });

        it("should set correct foreign keys in cadetDeficiency based on relation", async () => {
            // Arrange - Test material relation
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                materialId: TEST_IDS.materialId,
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithMaterialRelation);
            (prisma.material.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_MATERIAL);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue(MOCK_DB_RETURNS.deficiency);

            // Act
            await saveCadetInspection(propsWithNewDeficiency);

            // Assert
            expect(prisma.cadetDeficiency.upsert).toHaveBeenCalledWith({
                where: { deficiencyId: "created-def-id" },
                create: {
                    deficiencyId: "created-def-id",
                    fk_cadet: TEST_IDS.cadetId,
                    fk_material: TEST_IDS.materialId, // Should have material FK
                    fk_uniform: undefined
                },
                update: {
                    fk_material: TEST_IDS.materialId,
                    fk_uniform: undefined,
                }
            });
        });

        it("should call deficiency.deleteMany for orphaned deficiencies", async () => {
            // Arrange
            mockUnsecuredGetActiveInspection.mockResolvedValue(MOCK_INSPECTION_WITH_ORPHANS);

            const props = { ...BASE_CADET_INSPECTION_PROPS };

            // Act
            await saveCadetInspection(props);

            // Assert
            expect(prisma.deficiency.deleteMany).toHaveBeenCalledWith({
                where: {
                    id: {
                        in: ["orphaned-def-1", "orphaned-def-2"]
                    },
                    type: { fk_assosiation: TEST_USER.assosiation }
                },
            });
        });
    });

    describe("Group 6: Edge Cases & Data Handling", () => {
        it("should handle empty newDeficiencyList - No new deficiency operations", async () => {
            // Arrange
            const propsWithEmptyNewDeficiencies = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [],
            };

            // Act
            await saveCadetInspection(propsWithEmptyNewDeficiencies);

            // Assert
            // Should not call any new deficiency operations
            expect(prisma.deficiencyType.findUniqueOrThrow).not.toHaveBeenCalled();
            expect(prisma.deficiency.upsert).not.toHaveBeenCalled();
            expect(prisma.uniformDeficiency.upsert).not.toHaveBeenCalled();
            expect(prisma.cadetDeficiency.upsert).not.toHaveBeenCalled();
            expect(prisma.uniform.findUniqueOrThrow).not.toHaveBeenCalled();
            expect(prisma.material.findUniqueOrThrow).not.toHaveBeenCalled();

            // Should still call basic operations
            expect(prisma.cadetInspection.upsert).toHaveBeenCalled();
            expect(prisma.deregistration.deleteMany).toHaveBeenCalled();
        });

        it("should handle deficiencies without optional fields - Test with minimal required data", async () => {
            // Arrange
            const minimalDeficiency = {
                typeId: TEST_IDS.typeId1,
                description: "Minimal deficiency",
                comment: "", // Empty comment
                uniformId: null,
                materialId: null,
                otherMaterialId: null,
                otherMaterialGroupId: null,
            };

            const propsWithMinimalDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [minimalDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithoutRelation);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue(MOCK_DB_RETURNS.deficiency);

            // Act
            await saveCadetInspection(propsWithMinimalDeficiency);

            // Assert
            expect(prisma.deficiency.upsert).toHaveBeenCalledWith({
                where: {
                    id: expect.any(String),
                    AND: { type: { fk_assosiation: TEST_USER.assosiation } }
                },
                create: {
                    fk_deficiencyType: TEST_IDS.typeId1,
                    description: "Minimal deficiency",
                    comment: "", // Should handle empty comment
                    userCreated: TEST_USER.username,
                    userUpdated: TEST_USER.username,
                    fk_inspection_created: TEST_IDS.inspectionId,
                },
                update: {
                    description: "Minimal deficiency",
                    comment: "",
                    userUpdated: TEST_USER.username,
                    dateUpdated: expect.any(Date),
                }
            });
        });

        it("should handle inspection without deficiencyCreated array - Should not crash when empty", async () => {
            // Arrange
            const mockInspectionWithoutDeficiencyCreated = {
                id: TEST_IDS.inspectionId,
                deficiencyCreated: [],
            };

            mockUnsecuredGetActiveInspection.mockResolvedValue(mockInspectionWithoutDeficiencyCreated);

            const props = { ...BASE_CADET_INSPECTION_PROPS };

            // Act & Assert
            // Should not throw an error
            await saveCadetInspection(props)

            // Should not call deficiency.deleteMany
            expect(prisma.deficiency.deleteMany).not.toHaveBeenCalled();

            // Should still call other operations
            expect(prisma.cadetInspection.upsert).toHaveBeenCalled();
            expect(prisma.deregistration.deleteMany).toHaveBeenCalled();
        });

        it("should handle empty deficiencyCreated array - Should not call deleteMany", async () => {
            // Arrange
            const mockInspectionEmptyDeficiencyCreated = {
                id: TEST_IDS.inspectionId,
                deficiencyCreated: [], // Empty array
            };

            mockUnsecuredGetActiveInspection.mockResolvedValue(mockInspectionEmptyDeficiencyCreated);

            const props = { ...BASE_CADET_INSPECTION_PROPS };

            // Act
            await saveCadetInspection(props);

            // Assert
            // Should not call deficiency.deleteMany when array is empty
            expect(prisma.deficiency.deleteMany).not.toHaveBeenCalled();

            // Should still call other operations
            expect(prisma.cadetInspection.upsert).toHaveBeenCalled();
            expect(prisma.deregistration.deleteMany).toHaveBeenCalled();
        });

        it("should filter deficiencyCreated array correctly - Remove processed items during loop", async () => {
            // Arrange
            const mockInspectionWithDeficiencies = {
                id: TEST_IDS.inspectionId,
                deficiencyCreated: [
                    { id: "def-to-keep-1" },
                    { id: "def-to-process" },
                    { id: "def-to-keep-2" }
                ]
            };

            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                id: "def-to-process", // This should be removed from the array
                description: "Processed deficiency",
            };

            const propsWithExistingDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            mockUnsecuredGetActiveInspection.mockResolvedValue(mockInspectionWithDeficiencies);
            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithoutRelation);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue({ id: "def-to-process" });

            // Act
            await saveCadetInspection(propsWithExistingDeficiency);

            // Assert
            // Should call deleteMany only for the remaining unprocessed deficiencies
            expect(prisma.deficiency.deleteMany).toHaveBeenCalledWith({
                where: {
                    id: {
                        in: ["def-to-keep-1", "def-to-keep-2"] // The processed one should be filtered out
                    },
                    type: { fk_assosiation: TEST_USER.assosiation }
                },
            });
        });
    });

    describe("Group 7: Audit Fields & Metadata", () => {
        it("should set correct audit fields for new deficiencies - userCreated, userUpdated, fk_inspection_created", async () => {
            // Arrange
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                description: "New deficiency for audit test",
            };

            const propsWithNewDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [newDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithoutRelation);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue(MOCK_DB_RETURNS.deficiency);

            // Act
            await saveCadetInspection(propsWithNewDeficiency);

            // Assert
            expect(prisma.deficiency.upsert).toHaveBeenCalledWith({
                where: {
                    id: expect.any(String),
                    AND: { type: { fk_assosiation: TEST_USER.assosiation } }
                },
                create: {
                    fk_deficiencyType: TEST_IDS.typeId1,
                    description: "New deficiency for audit test",
                    comment: "Test comment",
                    userCreated: TEST_USER.username, // Should set userCreated
                    userUpdated: TEST_USER.username, // Should set userUpdated
                    fk_inspection_created: TEST_IDS.inspectionId, // Should set inspection created
                },
                update: {
                    description: "New deficiency for audit test",
                    comment: "Test comment",
                    userUpdated: TEST_USER.username,
                    dateUpdated: expect.any(Date),
                }
            });
        });

        it("should set correct audit fields for updated deficiencies - userUpdated, dateUpdated (not userCreated)", async () => {
            // Arrange
            const existingDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                id: "existing-deficiency-id", // Has ID = existing deficiency
                description: "Updated deficiency for audit test",
                comment: "Updated comment",
            };

            const propsWithExistingDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                newDeficiencyList: [existingDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithoutRelation);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue({ id: "existing-deficiency-id" });

            // Act
            await saveCadetInspection(propsWithExistingDeficiency);

            // Assert
            expect(prisma.deficiency.upsert).toHaveBeenCalledWith({
                where: {
                    id: "existing-deficiency-id", // Existing deficiency has ID
                    AND: { type: { fk_assosiation: TEST_USER.assosiation } }
                },
                create: {
                    fk_deficiencyType: TEST_IDS.typeId1,
                    description: "Updated deficiency for audit test",
                    comment: "Updated comment",
                    userCreated: TEST_USER.username, // Still set for create fallback
                    userUpdated: TEST_USER.username,
                    fk_inspection_created: TEST_IDS.inspectionId,
                },
                update: {
                    description: "Updated deficiency for audit test",
                    comment: "Updated comment",
                    userUpdated: TEST_USER.username, // Should update userUpdated
                    dateUpdated: expect.any(Date), // Should update dateUpdated
                    // Note: userCreated and fk_inspection_created should NOT be in update
                }
            });
        });

        it("should set correct resolution metadata for old deficiencies - dateResolved, userResolved, fk_inspection_resolved", async () => {
            // Arrange
            const resolvedDeficiency = {
                id: TEST_IDS.deficiency1,
                resolved: true,
                typeId: TEST_IDS.typeId1,
                typeName: "Test Type 1",
                description: "Test deficiency to resolve",
                comment: "Test comment",
                dateCreated: new Date("2024-01-01"),
            };

            const propsWithResolvedDeficiency = {
                ...BASE_CADET_INSPECTION_PROPS,
                oldDeficiencyList: [resolvedDeficiency],
            };

            // Act
            await saveCadetInspection(propsWithResolvedDeficiency);

            // Assert
            expect(prisma.deficiency.updateMany).toHaveBeenCalledWith({
                where: {
                    id: { in: [TEST_IDS.deficiency1] },
                    type: { fk_assosiation: TEST_USER.assosiation },
                    dateResolved: null, // Only resolve unresolved deficiencies
                },
                data: {
                    dateResolved: expect.any(Date), // Should set resolution date
                    userResolved: TEST_USER.username, // Should set resolving user
                    fk_inspection_resolved: TEST_IDS.inspectionId, // Should set resolving inspection
                },
            });
        });

        it("should respect association boundaries - All operations filtered by association", async () => {
            // Arrange
            const newDeficiency = {
                ...BASE_NEW_DEFICIENCY,
                uniformId: TEST_IDS.uniformId,
                materialId: TEST_IDS.materialId,
            };

            const propsWithAssociationTest = {
                ...BASE_CADET_INSPECTION_PROPS,
                oldDeficiencyList: [SAMPLE_OLD_DEFICIENCIES[0]], // Include old deficiency
                newDeficiencyList: [newDeficiency],
            };

            (prisma.deficiencyType.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_DEFICIENCY_TYPES.cadetWithMaterialRelation);
            (prisma.material.findUniqueOrThrow as jest.Mock).mockResolvedValue(MOCK_MATERIAL);
            (prisma.deficiency.upsert as jest.Mock).mockResolvedValue(MOCK_DB_RETURNS.deficiency);

            // Act
            await saveCadetInspection(propsWithAssociationTest);

            // Assert
            // Check deficiencyType lookup includes association filter
            expect(prisma.deficiencyType.findUniqueOrThrow).toHaveBeenCalledWith({
                where: {
                    id: TEST_IDS.typeId1,
                    AND: {
                        fk_assosiation: TEST_USER.assosiation, // Association filter
                    }
                }
            });

            // Check material lookup includes association filter
            expect(prisma.material.findUniqueOrThrow).toHaveBeenCalledWith({
                where: {
                    id: TEST_IDS.materialId,
                    AND: { materialGroup: { fk_assosiation: TEST_USER.assosiation } }, // Association filter
                },
                include: { materialGroup: true }
            });

            // Check deficiency upsert includes association filter
            expect(prisma.deficiency.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        AND: { type: { fk_assosiation: TEST_USER.assosiation } } // Association filter
                    })
                })
            );

            // Check old deficiency resolution includes association filter
            expect(prisma.deficiency.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        type: { fk_assosiation: TEST_USER.assosiation }, // Association filter
                    })
                })
            );
        });
    });
});
