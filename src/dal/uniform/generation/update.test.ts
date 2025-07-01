/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { DeepMockProxy } from "jest-mock-extended";
import { update } from "./update";
import { __unsecuredGetUniformTypeList } from "../type/get";
import { mockTypeList, mockSizeLists } from "../../../../tests/_jestConfig/staticMockData";

// Mock dependencies
jest.mock("../type/get", () => ({
    __unsecuredGetUniformTypeList: jest.fn(),
}));

// Get mocked functions
const mockGetUniformTypeList = __unsecuredGetUniformTypeList as jest.MockedFunction<typeof __unsecuredGetUniformTypeList>;

// Get the mocked prisma client
const mockPrisma = jest.requireMock("@/lib/db").prisma as DeepMockProxy<PrismaClient>;

// Mock data
const mockSession = { 
    assosiation: 'test-assosiation-id', 
    username: 'testuser' 
};

const mockUniformType = mockTypeList[0]; // Type with sizes and generations
const mockUniformTypeNoSizes = mockTypeList[1]; // Type with generations but no sizes

const mockGenerationId = 'generation-to-update-id';

const mockGenerationToUpdate = {
    id: mockGenerationId,
    name: 'Original Generation',
    sortOrder: 1,
    fk_uniformType: mockUniformType.id,
    fk_sizelist: mockSizeLists[0].id,
    outdated: false,
    recdelete: null,
    recdeleteUser: null,
};

const mockExistingGenerations = [
    mockGenerationToUpdate,
    {
        id: 'other-generation-1',
        name: 'Other Generation 1',
        sortOrder: 0,
        fk_uniformType: mockUniformType.id,
        recdelete: null,
    },
    {
        id: 'other-generation-2',
        name: 'Other Generation 2',
        sortOrder: 2,
        fk_uniformType: mockUniformType.id,
        recdelete: null,
    },
    {
        id: 'deleted-generation',
        name: 'Deleted Generation',
        sortOrder: 3,
        fk_uniformType: mockUniformType.id,
        recdelete: new Date(),
    },
];

const mockUniformTypeList = [mockUniformType];

const defaultUpdateData = {
    name: 'Updated Generation Name',
    outdated: true,
    fk_sizelist: mockSizeLists[1].id,
};

const defaultProps = {
    id: mockGenerationId,
    data: defaultUpdateData,
};

describe('<UniformGeneration> update', () => {

    beforeAll(() => {
        // Set up global authentication context for the test
        global.__USERNAME__ = mockSession.username;
        global.__ASSOSIATION__ = mockSession.assosiation;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    beforeEach(() => {
        // Setup default successful mocks
        mockPrisma.uniformType.findFirstOrThrow.mockResolvedValue(mockUniformType as any);
        mockPrisma.uniformGeneration.findMany.mockResolvedValue(mockExistingGenerations.filter(g => !g.recdelete) as any);
        mockPrisma.uniformGeneration.update.mockResolvedValue({
            ...mockGenerationToUpdate,
            ...defaultUpdateData,
        } as any);
        mockGetUniformTypeList.mockResolvedValue(mockUniformTypeList as any);
        
        // Mock the transaction to pass through the mocked client
        mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockPrisma));
    });

    describe('successful update scenarios', () => {
        it('updates generation successfully with all valid data', async () => {
            const result = await update(defaultProps);

            expect(result).toEqual(mockUniformTypeList);
            
            // Verify uniform type lookup
            expect(mockPrisma.uniformType.findFirstOrThrow).toHaveBeenCalledWith({
                where: {
                    fk_assosiation: mockSession.assosiation,
                    uniformGenerationList: {
                        some: { id: mockGenerationId }
                    }
                }
            });

            // Verify existing generations lookup for name validation
            expect(mockPrisma.uniformGeneration.findMany).toHaveBeenCalledWith({
                where: {
                    fk_uniformType: mockUniformType.id,
                    recdelete: null,
                }
            });

            // Verify generation update
            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalledWith({
                where: { id: mockGenerationId },
                data: defaultUpdateData
            });

            expect(mockGetUniformTypeList).toHaveBeenCalledWith(mockSession.assosiation, expect.anything());
        });

        it('updates generation with null sizelist when type does not use sizes', async () => {
            mockPrisma.uniformType.findFirstOrThrow.mockResolvedValue(mockUniformTypeNoSizes as any);

            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    fk_sizelist: mockSizeLists[0].id, // Provided but should be nullified
                }
            };

            await update(props);

            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalledWith({
                where: { id: mockGenerationId },
                data: {
                    ...defaultUpdateData,
                    fk_sizelist: null, // Should be null for types not using sizes
                }
            });
        });

        it('allows updating with same name (own name)', async () => {
            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    name: 'Original Generation', // Same as current name
                }
            };

            const result = await update(props);

            expect(result).toEqual(mockUniformTypeList);
            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalledWith({
                where: { id: mockGenerationId },
                data: {
                    ...defaultUpdateData,
                    name: 'Original Generation',
                }
            });
        });

        it('allows using name of deleted generation', async () => {
            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    name: 'Deleted Generation', // Name of deleted generation
                }
            };

            // Include deleted generation in the list to test filtering
            mockPrisma.uniformGeneration.findMany.mockResolvedValue(mockExistingGenerations.filter(g => !g.recdelete) as any);

            const result = await update(props);

            expect(result).toEqual(mockUniformTypeList);
            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalled();
        });

        it('updates with different valid sizelist', async () => {
            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    fk_sizelist: mockSizeLists[2].id,
                }
            };

            await update(props);

            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalledWith({
                where: { id: mockGenerationId },
                data: {
                    ...defaultUpdateData,
                    fk_sizelist: mockSizeLists[2].id,
                }
            });
        });

        it('updates with outdated flag changes', async () => {
            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    outdated: false,
                }
            };

            await update(props);

            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalledWith({
                where: { id: mockGenerationId },
                data: expect.objectContaining({
                    outdated: false,
                })
            });
        });
    });

    describe('validation error scenarios', () => {
        it('returns soft error for name duplication with existing generation', async () => {
            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    name: 'Other Generation 1', // Name already exists
                }
            };

            const result = await update(props);

            expect(result).toEqual({
                error: {
                    message: "custom.uniform.generation.nameDuplication",
                    formElement: "name",
                }
            });
            expect(mockPrisma.uniformGeneration.update).not.toHaveBeenCalled();
            expect(mockGetUniformTypeList).not.toHaveBeenCalled();
        });

        it('returns error when type uses sizes but no sizelist provided', async () => {
            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    fk_sizelist: null,
                }
            };

            const result = await update(props);

            expect(result).toEqual({
                error: {
                    message: "pleaseSelect",
                    formElement: "fk_sizelist"
                }
            });
            expect(mockPrisma.uniformGeneration.update).not.toHaveBeenCalled();
            expect(mockGetUniformTypeList).not.toHaveBeenCalled();
        });

        it('throws error when uniform type is not found', async () => {
            mockPrisma.uniformType.findFirstOrThrow.mockRejectedValue(new Error('Type not found'));

            await expect(update(defaultProps)).rejects.toThrow('Type not found');

            expect(mockPrisma.uniformGeneration.findMany).not.toHaveBeenCalled();
            expect(mockPrisma.uniformGeneration.update).not.toHaveBeenCalled();
        });

        it('throws error when generation lookup fails', async () => {
            mockPrisma.uniformGeneration.findMany.mockRejectedValue(new Error('Generation lookup failed'));

            await expect(update(defaultProps)).rejects.toThrow('Generation lookup failed');

            expect(mockPrisma.uniformGeneration.update).not.toHaveBeenCalled();
        });

        it('throws error when generation update fails', async () => {
            mockPrisma.uniformGeneration.update.mockRejectedValue(new Error('Update failed'));

            await expect(update(defaultProps)).rejects.toThrow('Update failed');

            expect(mockGetUniformTypeList).not.toHaveBeenCalled();
        });
    });

    describe('database interaction verification', () => {

        it('queries for uniform type with correct parameters', async () => {
            await update(defaultProps);

            expect(mockPrisma.uniformType.findFirstOrThrow).toHaveBeenCalledWith({
                where: {
                    fk_assosiation: mockSession.assosiation,
                    uniformGenerationList: {
                        some: { id: mockGenerationId }
                    }
                }
            });
        });

        it('queries for existing generations with correct parameters', async () => {
            await update(defaultProps);

            expect(mockPrisma.uniformGeneration.findMany).toHaveBeenCalledWith({
                where: {
                    fk_uniformType: mockUniformType.id,
                    recdelete: null, // Only non-deleted generations
                }
            });
        });
    });

    describe('edge cases', () => {
        it('handles generation with no other generations in type', async () => {
            mockPrisma.uniformGeneration.findMany.mockResolvedValue([mockGenerationToUpdate] as any);

            const result = await update(defaultProps);

            expect(result).toEqual(mockUniformTypeList);
            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalled();
        });

        it('handles empty generations list for type', async () => {
            mockPrisma.uniformGeneration.findMany.mockResolvedValue([]);

            const result = await update(defaultProps);

            expect(result).toEqual(mockUniformTypeList);
            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalled();
        });

        it('handles type with no sizelist requirement for non-sizing types', async () => {
            mockPrisma.uniformType.findFirstOrThrow.mockResolvedValue(mockUniformTypeNoSizes as any);

            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    fk_sizelist: null,
                }
            };

            const result = await update(props);

            expect(result).toEqual(mockUniformTypeList);
            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalledWith({
                where: { id: mockGenerationId },
                data: expect.objectContaining({
                    fk_sizelist: null,
                })
            });
        });
    });

    describe('parameter validation', () => {
        it('uses correct parameters for uniform type lookup', async () => {
            const customGenerationId = 'custom-generation-id';
            const props = {
                ...defaultProps,
                id: customGenerationId,
            };

            await update(props);

            expect(mockPrisma.uniformType.findFirstOrThrow).toHaveBeenCalledWith({
                where: {
                    fk_assosiation: mockSession.assosiation,
                    uniformGenerationList: {
                        some: { id: customGenerationId }
                    }
                }
            });
        });

        it('passes correct data to update operation', async () => {
            const customData = {
                name: "Custom Generation Name",
                outdated: false,
                fk_sizelist: 'custom-sizelist-id',
            };

            const props = {
                id: mockGenerationId,
                data: customData,
            };

            await update(props);

            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalledWith({
                where: { id: mockGenerationId },
                data: customData
            });
        });

        it('validates name duplication correctly excluding current generation', async () => {
            // Test that it correctly excludes the current generation from name duplication check
            const existingGenerationsWithSameName = [
                { ...mockGenerationToUpdate, name: 'Test Name' },
                { id: 'other-id', name: 'Test 2', fk_uniformType: mockUniformType.id, recdelete: null },
            ];

            mockPrisma.uniformGeneration.findMany.mockResolvedValue(existingGenerationsWithSameName as any);

            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    name: 'Test Name', // Same as current generation
                }
            };

            const result = await update(props);

            // Should succeed because it's the same generation
            expect(result).toEqual(mockUniformTypeList);
            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalled();
        });

        it('correctly identifies name duplication with different generation', async () => {
            const existingGenerationsWithSameName = [
                mockGenerationToUpdate,
                { id: 'other-id', name: 'Duplicate Name', fk_uniformType: mockUniformType.id, recdelete: null },
            ];

            mockPrisma.uniformGeneration.findMany.mockResolvedValue(existingGenerationsWithSameName as any);

            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    name: 'Duplicate Name', // Same as other generation
                }
            };

            const result = await update(props);

            expect(result).toEqual({
                error: {
                    message: "custom.uniform.generation.nameDuplication",
                    formElement: "name",
                }
            });
            expect(mockPrisma.uniformGeneration.update).not.toHaveBeenCalled();
        });
    });

    describe('sizelist handling', () => {
        it('preserves sizelist for types that use sizes', async () => {
            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    fk_sizelist: mockSizeLists[1].id,
                }
            };

            await update(props);

            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalledWith({
                where: { id: mockGenerationId },
                data: expect.objectContaining({
                    fk_sizelist: mockSizeLists[1].id,
                })
            });
        });

        it('nullifies sizelist for types that do not use sizes', async () => {
            mockPrisma.uniformType.findFirstOrThrow.mockResolvedValue(mockUniformTypeNoSizes as any);

            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    fk_sizelist: mockSizeLists[1].id, // Will be nullified
                }
            };

            await update(props);

            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalledWith({
                where: { id: mockGenerationId },
                data: expect.objectContaining({
                    fk_sizelist: null,
                })
            });
        });

        it('validates sizelist requirement for sizing types', async () => {
            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    fk_sizelist: null,
                }
            };

            const result = await update(props);

            expect(result).toEqual({
                error: {
                    message: "pleaseSelect",
                    formElement: "fk_sizelist"
                }
            });
        });
    });
});
