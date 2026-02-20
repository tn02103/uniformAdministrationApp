/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { DeepMockProxy } from "jest-mock-extended";
import { markDeleted } from "./delete";
import { __unsecuredGetUniformTypeList } from "../type/get";
import { mockTypeList } from "../../../../tests/_jestConfig/staticMockData";
import { checkDateTolerance } from "../../../../jest/helpers/test-utils";

// Mock dependencies
jest.mock("../type/get", () => ({
    __unsecuredGetUniformTypeList: jest.fn(),
}));

// Get mocked functions
const mockGetUniformTypeList = __unsecuredGetUniformTypeList as jest.MockedFunction<typeof __unsecuredGetUniformTypeList>;

// Get the mocked prisma client
const mockPrisma = jest.requireMock("@/lib/db").prisma as DeepMockProxy<PrismaClient>;

// Mock data
const mockGenerationId = 'generation-to-delete-id';
const mockUniformTypeId = 'uniform-type-id';
const mockSession = { organisation: 'test-organisation-id', username: 'testuser' };

const mockGenerationToDelete = {
    id: mockGenerationId,
    name: 'Generation To Delete',
    sortOrder: 1,
    fk_uniformType: mockUniformTypeId,
    fk_sizelist: null,
    isReserve: false,
    recdelete: null,
    recdeleteUser: null,
};

const mockUniformTypeList = [mockTypeList[0]];

describe('<UniformGeneration> markDeleted', () => {

    const { prisma } = jest.requireMock("@/lib/db");

    afterEach(() => {
        jest.clearAllMocks();
        prisma.uniformGeneration.findUniqueOrThrow.mockReset();
        prisma.uniformGeneration.update.mockReset();
        prisma.uniformGeneration.updateMany.mockReset();
        prisma.uniform.updateMany.mockReset();
    });

    beforeEach(() => {
        // Setup default successful mocks for the transaction client
        prisma.uniformGeneration.findUniqueOrThrow.mockResolvedValue(mockGenerationToDelete as any);
        prisma.uniform.updateMany.mockResolvedValue({ count: 3 } as any);
        prisma.uniformGeneration.update.mockResolvedValue({
            ...mockGenerationToDelete,
            recdelete: new Date(),
            recdeleteUser: mockSession.username,
        } as any);
        prisma.uniformGeneration.updateMany.mockResolvedValue({ count: 2 } as any);
        mockGetUniformTypeList.mockResolvedValue(mockUniformTypeList as any);
    });

    describe('successful deletion scenarios', () => {
        it('marks generation as deleted and updates related data', async () => {
            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            // Verify generation lookup
            expect(prisma.uniformGeneration.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: mockGenerationId }
            });

            // Verify uniform items get generation nullified
            expect(prisma.uniform.updateMany).toHaveBeenCalledWith({
                where: {
                    recdelete: null,
                    fk_generation: mockGenerationId,
                },
                data: {
                    fk_generation: null,
                }
            });

            // Verify generation is marked as deleted
            expect(prisma.uniformGeneration.update).toHaveBeenCalledWith({
                where: { id: mockGenerationId },
                data: {
                    recdelete: expect.any(Date),
                    recdeleteUser: mockSession.username,
                }
            });
            expect(checkDateTolerance(prisma.uniformGeneration.update.mock.calls[0][0].data.recdelete)).toBeLessThan(5000);

            // Verify sort order update for generations with higher sortOrder
            expect(prisma.uniformGeneration.updateMany).toHaveBeenCalledWith({
                where: {
                    fk_uniformType: mockUniformTypeId,
                    recdelete: null,
                    sortOrder: { gt: mockGenerationToDelete.sortOrder }
                },
                data: {
                    sortOrder: { decrement: 1 }
                }
            });

            expect(mockGetUniformTypeList).toHaveBeenCalledWith(mockSession.organisation, expect.anything());
        });

        it('handles generation with sortOrder 0 correctly', async () => {
            const generationWithSortOrder0 = {
                ...mockGenerationToDelete,
                sortOrder: 0,
            };
            prisma.uniformGeneration.findUniqueOrThrow.mockResolvedValue(generationWithSortOrder0 as any);

            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            // Should still update generations with sortOrder > 0
            expect(prisma.uniformGeneration.updateMany).toHaveBeenCalledWith({
                where: {
                    fk_uniformType: mockUniformTypeId,
                    recdelete: null,
                    sortOrder: { gt: 0 }
                },
                data: {
                    sortOrder: { decrement: 1 }
                }
            });
        });

        it('handles generation with highest sortOrder correctly', async () => {
            const generationWithHighSortOrder = {
                ...mockGenerationToDelete,
                sortOrder: 5,
            };
            prisma.uniformGeneration.findUniqueOrThrow.mockResolvedValue(generationWithHighSortOrder as any);

            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            // Should look for generations with sortOrder > 5
            expect(prisma.uniformGeneration.updateMany).toHaveBeenCalledWith({
                where: {
                    fk_uniformType: mockUniformTypeId,
                    recdelete: null,
                    sortOrder: { gt: 5 }
                },
                data: {
                    sortOrder: { decrement: 1 }
                }
            });
        });
    });

    describe('error scenarios', () => {
        it('throws error when generation is not found', async () => {
            prisma.uniformGeneration.findUniqueOrThrow.mockRejectedValue(new Error('Generation not found'));

            await expect(markDeleted(mockGenerationId)).rejects.toThrow('Generation not found');

            expect(prisma.uniform.updateMany).not.toHaveBeenCalled();
            expect(prisma.uniformGeneration.update).not.toHaveBeenCalled();
            expect(prisma.uniformGeneration.updateMany).not.toHaveBeenCalled();
            expect(mockGetUniformTypeList).not.toHaveBeenCalled();
        });

        it('handles error during uniform items update', async () => {
            prisma.uniform.updateMany.mockRejectedValue(new Error('Uniform update failed'));

            await expect(markDeleted(mockGenerationId)).rejects.toThrow('Uniform update failed');

            expect(prisma.uniformGeneration.findUniqueOrThrow).toHaveBeenCalled();
            expect(prisma.uniformGeneration.update).not.toHaveBeenCalled();
            expect(mockGetUniformTypeList).not.toHaveBeenCalled();
        });

        it('handles error during generation deletion', async () => {
            prisma.uniformGeneration.update.mockRejectedValue(new Error('Generation delete failed'));

            await expect(markDeleted(mockGenerationId)).rejects.toThrow('Generation delete failed');

            expect(prisma.uniform.updateMany).toHaveBeenCalled();
            expect(prisma.uniformGeneration.updateMany).not.toHaveBeenCalled();
            expect(mockGetUniformTypeList).not.toHaveBeenCalled();
        });

        it('handles error during sort order update', async () => {
            prisma.uniformGeneration.updateMany.mockRejectedValue(new Error('Sort order update failed'));

            await expect(markDeleted(mockGenerationId)).rejects.toThrow('Sort order update failed');

            expect(prisma.uniform.updateMany).toHaveBeenCalled();
            expect(prisma.uniformGeneration.update).toHaveBeenCalled();
            expect(mockGetUniformTypeList).not.toHaveBeenCalled();
        });
    });

    describe('database interaction verification', () => {
        it('verifies transaction usage', async () => {
            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
        });

        it('uses correct generation ID in all operations', async () => {
            const customGenerationId = 'custom-generation-id';

            await expect(markDeleted(customGenerationId)).resolves.toEqual(mockUniformTypeList);

            expect(prisma.uniformGeneration.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: customGenerationId }
            });

            expect(prisma.uniform.updateMany).toHaveBeenCalledWith({
                where: {
                    recdelete: null,
                    fk_generation: customGenerationId,
                },
                data: {
                    fk_generation: null,
                }
            });

            expect(prisma.uniformGeneration.update).toHaveBeenCalledWith({
                where: { id: customGenerationId },
                data: {
                    recdelete: expect.any(Date),
                    recdeleteUser: mockSession.username,
                }
            });
        });
    });

    describe('edge cases', () => {
        it('handles generation with no associated uniform items', async () => {
            prisma.uniform.updateMany.mockResolvedValue({ count: 0 } as any);

            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            expect(prisma.uniform.updateMany).toHaveBeenCalled();
            expect(prisma.uniformGeneration.update).toHaveBeenCalled();
        });

        it('handles generation with no higher sortOrder generations', async () => {
            prisma.uniformGeneration.updateMany.mockResolvedValue({ count: 0 } as any);

            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            expect(prisma.uniformGeneration.updateMany).toHaveBeenCalled();
        });

        it('correctly passes session data to unsecured function', async () => {
            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            expect(mockGetUniformTypeList).toHaveBeenCalledWith(
                mockSession.organisation,
                expect.anything() // transaction client
            );
        });
    });

    describe('uniform items nullification logic', () => {
        it('only affects uniform items that are not deleted', async () => {
            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            expect(prisma.uniform.updateMany).toHaveBeenCalledWith({
                where: {
                    recdelete: null, // Only non-deleted items
                    fk_generation: mockGenerationId,
                },
                data: {
                    fk_generation: null,
                }
            });
        });

        it('handles multiple uniform items correctly', async () => {
            prisma.uniform.updateMany.mockResolvedValue({ count: 10 } as any);

            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            expect(prisma.uniform.updateMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('sort order management', () => {
        it('only updates generations from same type that are not deleted', async () => {
            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            expect(prisma.uniformGeneration.updateMany).toHaveBeenCalledWith({
                where: {
                    fk_uniformType: mockUniformTypeId, // Same type only
                    recdelete: null, // Only non-deleted generations
                    sortOrder: { gt: mockGenerationToDelete.sortOrder }
                },
                data: {
                    sortOrder: { decrement: 1 }
                }
            });
        });

        it('handles different uniform type IDs correctly', async () => {
            const differentTypeGeneration = {
                ...mockGenerationToDelete,
                fk_uniformType: 'different-type-id',
            };
            prisma.uniformGeneration.findUniqueOrThrow.mockResolvedValue(differentTypeGeneration as any);

            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            expect(prisma.uniformGeneration.updateMany).toHaveBeenCalledWith({
                where: {
                    fk_uniformType: 'different-type-id',
                    recdelete: null,
                    sortOrder: { gt: mockGenerationToDelete.sortOrder }
                },
                data: {
                    sortOrder: { decrement: 1 }
                }
            });
        });
    });
});
