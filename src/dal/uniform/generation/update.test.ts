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

const mockUniformType = mockTypeList[0]; // Type with sizes and generations
const mockUniformTypeNoSizes = mockTypeList[1]; // Type with generations but no sizes

const mockGenerationId = 'generation-to-update-id';
const mockGenerationToUpdate = {
    id: mockGenerationId,
    name: 'Original Generation',
    sortOrder: 1,
    fk_uniformType: mockUniformType.id,
    fk_sizelist: mockSizeLists[0].id,
    isReserve: false,
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
    isReserve: true,
    fk_sizelist: mockSizeLists[1].id,
};
const defaultProps = {
    id: mockGenerationId,
    data: defaultUpdateData,
};

describe('<UniformGeneration> update', () => {

    beforeEach(() => {
        // Setup default successful mocks
        mockPrisma.uniformType.findFirstOrThrow.mockResolvedValue(mockUniformType as any);
        mockPrisma.uniformGeneration.findMany.mockResolvedValue(mockExistingGenerations.filter(g => !g.recdelete) as any);
        mockPrisma.uniformGeneration.update.mockResolvedValue({
            ...mockGenerationToUpdate,
            ...defaultUpdateData,
        } as any);
        mockGetUniformTypeList.mockResolvedValue(mockUniformTypeList as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('successful update scenarios', () => {
        it('updates generation successfully with all valid data', async () => {
            await expect(update(defaultProps)).resolves.toEqual(mockUniformTypeList);

            // Verify uniform type lookup
            expect(mockPrisma.uniformType.findFirstOrThrow).toHaveBeenCalledWith({
                where: {
                    organisationId: 'test-organisation-id',
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

            expect(mockGetUniformTypeList).toHaveBeenCalledWith('test-organisation-id', expect.anything());
        });

        it('passes correct data to update operation', async () => {
            const customData = {
                name: "Custom Generation Name",
                isReserve: false,
                fk_sizelist: 'custom-sizelist-id',
            };

            const props = {
                id: mockGenerationId,
                data: customData,
            };

            await expect(update(props)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalledWith({
                where: { id: mockGenerationId },
                data: customData
            });
        });

        it('uses correct parameters for uniform type lookup', async () => {
            const customGenerationId = 'custom-generation-id';
            const props = {
                ...defaultProps,
                id: customGenerationId,
            };

            await expect(update(props)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.uniformType.findFirstOrThrow).toHaveBeenCalledWith({
                where: {
                    organisationId: 'test-organisation-id',
                    uniformGenerationList: {
                        some: { id: customGenerationId }
                    }
                }
            });
        });
    });

    describe('name validation scenarios', () => {
        it('allows updating with same name (own name)', async () => {
            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    name: 'Original Generation', // Same as current name
                }
            };

            // Mock existing generations to include the current generation
            await expect(update(props)).resolves.toEqual(mockUniformTypeList);

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

            await expect(update(props)).resolves.toEqual(mockUniformTypeList);
            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalled();
        });

        it('returns soft error for name duplication with existing generation', async () => {
            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    name: 'Other Generation 1', // Name already exists
                }
            };
            const expectedResult = {
                error: {
                    message: "custom.uniform.generation.nameDuplication",
                    formElement: "name",
                }
            };

            await expect(update(props)).resolves.toEqual(expectedResult);

            expect(mockPrisma.uniformGeneration.update).not.toHaveBeenCalled();
            expect(mockGetUniformTypeList).not.toHaveBeenCalled();
        });

    });

    describe('edge cases', () => {
        it('handles generation with no other generations in type', async () => {
            mockPrisma.uniformGeneration.findMany.mockResolvedValue([mockGenerationToUpdate] as any);


            await expect(update(defaultProps)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalled();
        });

        it('handles empty generations list for type', async () => {
            mockPrisma.uniformGeneration.findMany.mockResolvedValue([]);

            await expect(update(defaultProps)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalled();
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

            await expect(update(props)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalledWith({
                where: { id: mockGenerationId },
                data: expect.objectContaining({
                    fk_sizelist: mockSizeLists[1].id,
                })
            });
        });

        it('updates generation with null sizelist when type does not use sizes', async () => {
            mockPrisma.uniformType.findFirstOrThrow.mockResolvedValue(mockUniformTypeNoSizes as any);

            const props = {
                ...defaultProps,
                data: {
                    ...defaultUpdateData,
                    fk_sizelist: null,
                }
            };

            await expect(update(props)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalledWith({
                where: { id: mockGenerationId },
                data: {
                    ...defaultUpdateData,
                    fk_sizelist: null,
                }
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

            await expect(update(props)).resolves.toEqual(mockUniformTypeList);

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
            const expectedResult = {
                error: {
                    message: "pleaseSelect",
                    formElement: "fk_sizelist"
                }
            };

            await expect(update(props)).resolves.toEqual(expectedResult);
        });
    });
});
