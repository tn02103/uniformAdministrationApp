/* eslint-disable @typescript-eslint/no-explicit-any */

import { prismaMock } from '@test-utils/prisma-mock';
import { markDeleted } from "./delete";
import { __unsecuredGetUniformTypeList } from "../type/get";
import { mockTypeList } from "../../../../tests/_jestConfig/staticMockData";
import { checkDateTolerance } from "../../../../vitest/helpers/test-utils";

// Mock dependencies
vi.mock("../type/get", () => ({
    __unsecuredGetUniformTypeList: vi.fn(),
}));

// Get mocked functions
const mockGetUniformTypeList = vi.mocked(__unsecuredGetUniformTypeList);

// Get the mocked prisma client
const mockPrisma = prismaMock;

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


    afterEach(() => {
        vi.clearAllMocks();
        mockPrisma.uniformGeneration.findUniqueOrThrow.mockReset();
        mockPrisma.uniformGeneration.update.mockReset();
        mockPrisma.uniformGeneration.updateMany.mockReset();
        mockPrisma.uniform.updateMany.mockReset();
    });

    beforeEach(() => {
        // Setup default successful mocks for the transaction client
        mockPrisma.uniformGeneration.findUniqueOrThrow.mockResolvedValue(mockGenerationToDelete as any);
        mockPrisma.uniform.updateMany.mockResolvedValue({ count: 3 } as any);
        mockPrisma.uniformGeneration.update.mockResolvedValue({
            ...mockGenerationToDelete,
            recdelete: new Date(),
            recdeleteUser: mockSession.username,
        } as any);
        mockPrisma.uniformGeneration.updateMany.mockResolvedValue({ count: 2 } as any);
        mockGetUniformTypeList.mockResolvedValue(mockUniformTypeList as any);
    });

    describe('successful deletion scenarios', () => {
        it('marks generation as deleted and updates related data', async () => {
            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            // Verify generation lookup
            expect(mockPrisma.uniformGeneration.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: mockGenerationId }
            });

            // Verify uniform items get generation nullified
            expect(mockPrisma.uniform.updateMany).toHaveBeenCalledWith({
                where: {
                    recdelete: null,
                    fk_generation: mockGenerationId,
                },
                data: {
                    fk_generation: null,
                }
            });

            // Verify generation is marked as deleted
            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalledWith({
                where: { id: mockGenerationId },
                data: {
                    recdelete: expect.any(Date),
                    recdeleteUser: mockSession.username,
                }
            });
            expect(checkDateTolerance(mockPrisma.uniformGeneration.update.mock.calls[0][0].data.recdelete)).toBeLessThan(5000);

            // Verify sort order update for generations with higher sortOrder
            expect(mockPrisma.uniformGeneration.updateMany).toHaveBeenCalledWith({
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
            mockPrisma.uniformGeneration.findUniqueOrThrow.mockResolvedValue(generationWithSortOrder0 as any);

            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            // Should still update generations with sortOrder > 0
            expect(mockPrisma.uniformGeneration.updateMany).toHaveBeenCalledWith({
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
            mockPrisma.uniformGeneration.findUniqueOrThrow.mockResolvedValue(generationWithHighSortOrder as any);

            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            // Should look for generations with sortOrder > 5
            expect(mockPrisma.uniformGeneration.updateMany).toHaveBeenCalledWith({
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
            mockPrisma.uniformGeneration.findUniqueOrThrow.mockRejectedValue(new Error('Generation not found'));

            await expect(markDeleted(mockGenerationId)).rejects.toThrow('Generation not found');

            expect(mockPrisma.uniform.updateMany).not.toHaveBeenCalled();
            expect(mockPrisma.uniformGeneration.update).not.toHaveBeenCalled();
            expect(mockPrisma.uniformGeneration.updateMany).not.toHaveBeenCalled();
            expect(mockGetUniformTypeList).not.toHaveBeenCalled();
        });

        it('handles error during uniform items update', async () => {
            mockPrisma.uniform.updateMany.mockRejectedValue(new Error('Uniform update failed'));

            await expect(markDeleted(mockGenerationId)).rejects.toThrow('Uniform update failed');

            expect(mockPrisma.uniformGeneration.findUniqueOrThrow).toHaveBeenCalled();
            expect(mockPrisma.uniformGeneration.update).not.toHaveBeenCalled();
            expect(mockGetUniformTypeList).not.toHaveBeenCalled();
        });

        it('handles error during generation deletion', async () => {
            mockPrisma.uniformGeneration.update.mockRejectedValue(new Error('Generation delete failed'));

            await expect(markDeleted(mockGenerationId)).rejects.toThrow('Generation delete failed');

            expect(mockPrisma.uniform.updateMany).toHaveBeenCalled();
            expect(mockPrisma.uniformGeneration.updateMany).not.toHaveBeenCalled();
            expect(mockGetUniformTypeList).not.toHaveBeenCalled();
        });

        it('handles error during sort order update', async () => {
            mockPrisma.uniformGeneration.updateMany.mockRejectedValue(new Error('Sort order update failed'));

            await expect(markDeleted(mockGenerationId)).rejects.toThrow('Sort order update failed');

            expect(mockPrisma.uniform.updateMany).toHaveBeenCalled();
            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalled();
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

            expect(mockPrisma.uniformGeneration.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: customGenerationId }
            });

            expect(mockPrisma.uniform.updateMany).toHaveBeenCalledWith({
                where: {
                    recdelete: null,
                    fk_generation: customGenerationId,
                },
                data: {
                    fk_generation: null,
                }
            });

            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalledWith({
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
            mockPrisma.uniform.updateMany.mockResolvedValue({ count: 0 } as any);

            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.uniform.updateMany).toHaveBeenCalled();
            expect(mockPrisma.uniformGeneration.update).toHaveBeenCalled();
        });

        it('handles generation with no higher sortOrder generations', async () => {
            mockPrisma.uniformGeneration.updateMany.mockResolvedValue({ count: 0 } as any);

            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.uniformGeneration.updateMany).toHaveBeenCalled();
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

            expect(mockPrisma.uniform.updateMany).toHaveBeenCalledWith({
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
            mockPrisma.uniform.updateMany.mockResolvedValue({ count: 10 } as any);

            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.uniform.updateMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('sort order management', () => {
        it('only updates generations from same type that are not deleted', async () => {
            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.uniformGeneration.updateMany).toHaveBeenCalledWith({
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
            mockPrisma.uniformGeneration.findUniqueOrThrow.mockResolvedValue(differentTypeGeneration as any);

            await expect(markDeleted(mockGenerationId)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.uniformGeneration.updateMany).toHaveBeenCalledWith({
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
