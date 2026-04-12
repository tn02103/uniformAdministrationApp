 

import { prismaMock } from '@test-utils/prisma-mock';
import { update } from "./update";
import { mockUniformList, mockTypeList, mockGenerationLists, mockSizeLists } from "../../../../tests/_jestConfig/staticMockData";
import { UniformFormType } from "@/zod/uniform";
import { uniformWithOwnerArgs } from "@/types/globalUniformTypes";

// Mock data
const mockUniformId = 'c227ac23-93d4-42b5-be2e-956ea35c2db9';
const mockGenerationId = '0292fdd9-9d47-4470-86b6-107c6f8797e4';
const mockSizeId = 'bc27d3eb-20f5-46fa-9140-7bb85c89b5bc';

const mockUniformType = mockTypeList[0]; // Type with both generations and sizes
const mockUniformTypeNoSizes = mockTypeList[1]; // Type with generations but no sizes
const mockUniformTypeNoGenerations = mockTypeList[2]; // Type with sizes but no generations
const mockUniformTypeNoGenNoSize = mockTypeList[3]; // Type with neither generations nor sizes

const mockGeneration = mockGenerationLists[0][1];
const mockSizelist = mockSizeLists[0]; // For generation's sizelist
const mockDefaultSizelist = mockSizeLists[2]; // For type's default sizelist

const defaultUpdateProps: UniformFormType = {
    id: mockUniformId,
    number: 2501,
    isReserve: false,
    comment: 'Updated comment',
    generation: mockGenerationId,
    size: mockSizeId,
};

describe('<UniformItem> update', () => {

    afterEach(() => {
        vi.clearAllMocks();
        // Reset all mock implementations to their default state
        prismaMock.uniformType.findFirstOrThrow.mockReset();
        prismaMock.uniformGeneration.findUniqueOrThrow.mockReset();
        prismaMock.uniformSizelist.findUniqueOrThrow.mockReset();
        prismaMock.uniform.update.mockReset();
    });

    beforeEach(() => {

        // Default mock responses
        prismaMock.uniformType.findFirstOrThrow.mockResolvedValue(mockUniformType as any);
        prismaMock.uniformGeneration.findUniqueOrThrow.mockResolvedValue(mockGeneration as any);
        prismaMock.uniformSizelist.findUniqueOrThrow.mockResolvedValue(mockSizelist as any);
        prismaMock.uniform.update.mockResolvedValue(mockUniformList[0] as any);
    });

    describe('successful update scenarios', () => {
        it('updates uniform with both generation and size', async () => {
            await expect(update(defaultUpdateProps)).resolves.toEqual(mockUniformList[0]);

            expect(prismaMock.uniformType.findFirstOrThrow).toHaveBeenCalledWith({
                where: {
                    uniformList: {
                        some: {
                            id: mockUniformId,
                            recdelete: null, // Ensure we are checking only for active uniforms
                        }
                    }
                }
            });
            expect(prismaMock.uniformGeneration.findUniqueOrThrow).toHaveBeenCalledWith({
                where: {
                    id: mockGenerationId,
                    recdelete: null, // Ensure we are checking only for active generations
                    fk_uniformType: mockUniformType.id, // Ensure generation belongs to the type
                }
            });
            expect(prismaMock.uniformSizelist.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: '9feb9d1a-654a-4829-a01b-74d6ffbd5405' }, // Generation's sizelist, not type's default
                include: {
                    uniformSizes: true,
                }
            });
            expect(prismaMock.uniform.update).toHaveBeenCalledWith({
                ...uniformWithOwnerArgs,
                where: {
                    id: mockUniformId,
                },
                data: {
                    isReserve: false,
                    comment: 'Updated comment',
                    fk_generation: mockGenerationId,
                    fk_size: mockSizeId,
                },
            });
        });

        it('updates uniform without generation when type does not use generations', async () => {
            prismaMock.uniformType.findFirstOrThrow.mockResolvedValue(mockUniformTypeNoGenerations as any);

            await expect(update(defaultUpdateProps)).resolves.toEqual(mockUniformList[0]);

            expect(prismaMock.uniformSizelist.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: '27021179-ec3d-4b04-9ed8-6ac53fdc3b4e' }, // types default sizelist
                include: {
                    uniformSizes: true,
                }
            });
            expect(prismaMock.uniform.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        isReserve: false,
                        comment: 'Updated comment',
                        fk_generation: undefined, // Should be undefined when type doesn't use generations
                        fk_size: mockSizeId,
                    },
                })
            );
        });

        it('updates uniform without size when type does not use sizes', async () => {
            prismaMock.uniformType.findFirstOrThrow.mockResolvedValue(mockUniformTypeNoSizes as any);

            await expect(update(defaultUpdateProps)).resolves.toEqual(mockUniformList[0]);

            // Generation lookup should NOT happen because type doesn't use sizes and no size is provided
            expect(prismaMock.uniformGeneration.findUniqueOrThrow).not.toHaveBeenCalled();
            expect(prismaMock.uniformSizelist.findUniqueOrThrow).not.toHaveBeenCalled();
            expect(prismaMock.uniform.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        isReserve: false,
                        comment: 'Updated comment',
                        fk_generation: mockGenerationId,
                        fk_size: undefined, // Should be undefined when type doesn't use sizes
                    },
                })
            );
        });

        it('updates uniform without generation and size when type uses neither', async () => {
            prismaMock.uniformType.findFirstOrThrow.mockResolvedValue(mockUniformTypeNoGenNoSize as any);

            await expect(update(defaultUpdateProps)).resolves.toEqual(mockUniformList[0]);

            expect(prismaMock.uniformGeneration.findUniqueOrThrow).not.toHaveBeenCalled();
            expect(prismaMock.uniformSizelist.findUniqueOrThrow).not.toHaveBeenCalled();
            expect(prismaMock.uniform.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        isReserve: false,
                        comment: 'Updated comment',
                        fk_generation: undefined,
                        fk_size: undefined,
                    },
                })
            );
        });

        it('updates uniform with null values for generation and size', async () => {
            const props = {
                ...defaultUpdateProps,
                generation: null,
                size: null,
            };

            await expect(update(props)).resolves.toEqual(mockUniformList[0]);

            expect(prismaMock.uniform.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        isReserve: false,
                        comment: 'Updated comment',
                        fk_generation: null,
                        fk_size: null,
                    },
                })
            );
        });

        it('uses generation sizelist when generation has its own sizelist', async () => {
            const generationWithSizelist = {
                ...mockGeneration,
                fk_sizelist: '27021179-ec3d-4b04-9ed8-6ac53fdc3b4e', // Different sizelist
            };
            prismaMock.uniformGeneration.findUniqueOrThrow.mockResolvedValue(generationWithSizelist as any);
            prismaMock.uniformSizelist.findUniqueOrThrow.mockResolvedValue(mockSizeLists[1] as any);

            await expect(update(defaultUpdateProps)).resolves.toEqual(mockUniformList[0]);

            expect(prismaMock.uniformSizelist.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: '27021179-ec3d-4b04-9ed8-6ac53fdc3b4e' }, // Generation's sizelist, not type's default
                include: {
                    uniformSizes: true,
                }
            });
        });
    });

    describe('size validation scenarios', () => {
        it('validates size exists in default sizelist', async () => {
            // Use a generation without custom sizelist to ensure type's default sizelist is used
            const generationWithoutSizelist = {
                ...mockGeneration,
                fk_sizelist: null,
            };
            prismaMock.uniformGeneration.findUniqueOrThrow.mockResolvedValue(generationWithoutSizelist as any);
            prismaMock.uniformSizelist.findUniqueOrThrow.mockResolvedValue(mockDefaultSizelist as any);

            const validSizeId = mockDefaultSizelist.uniformSizes[0].id;
            const props = {
                ...defaultUpdateProps,
                size: validSizeId,
            };

            await expect(update(props)).resolves.toEqual(mockUniformList[0]);

            expect(prismaMock.uniformSizelist.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: mockUniformType.fk_defaultSizelist },
                include: { uniformSizes: true }
            });
            // Should not throw error since size exists in sizelist
            expect(prismaMock.uniform.update).toHaveBeenCalled();
        });

        it('throws error when size is not supported by type and generation combination', async () => {
            const invalidSizeId = 'invalid-size-id';
            const props = {
                ...defaultUpdateProps,
                size: invalidSizeId,
            };

            await expect(update(props)).rejects.toThrow('Size is not suported by combination of type an generation');

            expect(prismaMock.uniform.update).not.toHaveBeenCalled();
        });

        it('validates size exists in generation sizelist when generation has custom sizelist', async () => {
            const generationWithSizelist = {
                ...mockGeneration,
                fk_sizelist: '27021179-ec3d-4b04-9ed8-6ac53fdc3b4e',
            };
            prismaMock.uniformGeneration.findUniqueOrThrow.mockResolvedValue(generationWithSizelist as any);
            prismaMock.uniformSizelist.findUniqueOrThrow.mockResolvedValue(mockSizeLists[1] as any);

            const validSizeInGenerationSizelist = mockSizeLists[1].uniformSizes[0].id;
            const props = {
                ...defaultUpdateProps,
                size: validSizeInGenerationSizelist,
            };

            await expect(update(props)).resolves.toEqual(mockUniformList[0]);

            expect(prismaMock.uniformSizelist.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: '27021179-ec3d-4b04-9ed8-6ac53fdc3b4e' },
                include: { uniformSizes: true }
            });
            expect(prismaMock.uniform.update).toHaveBeenCalled();
        });
    });

    describe('error scenarios', () => {
        it('throws error when uniform type is not found', async () => {
            prismaMock.uniformType.findFirstOrThrow.mockRejectedValue(new Error('Uniform type not found'));

            await expect(update(defaultUpdateProps)).rejects.toThrow('Uniform type not found');

            expect(prismaMock.uniform.update).not.toHaveBeenCalled();
        });

        it('throws error when generation is not found', async () => {
            prismaMock.uniformGeneration.findUniqueOrThrow.mockRejectedValue(new Error('Generation not found'));

            await expect(update(defaultUpdateProps)).rejects.toThrow('Generation not found');

            expect(prismaMock.uniform.update).not.toHaveBeenCalled();
        });

        it('throws error when sizelist is not found', async () => {
            prismaMock.uniformSizelist.findUniqueOrThrow.mockRejectedValue(new Error('Sizelist not found'));

            await expect(update(defaultUpdateProps)).rejects.toThrow('Sizelist not found');

            expect(prismaMock.uniform.update).not.toHaveBeenCalled();
        });

        it('throws error when sizelistId is null and should not be', async () => {
            const typeWithNullSizelist = {
                ...mockUniformType,
                fk_defaultSizelist: null,
            };
            const generationWithNullSizelist = {
                ...mockGeneration,
                fk_sizelist: null,
            };

            prismaMock.uniformType.findFirstOrThrow.mockResolvedValue(typeWithNullSizelist as any);
            prismaMock.uniformGeneration.findUniqueOrThrow.mockResolvedValue(generationWithNullSizelist as any);

            await expect(update(defaultUpdateProps)).rejects.toThrow('sizelistId is not suposed to be null');

            expect(prismaMock.uniform.update).not.toHaveBeenCalled();
        });

        it('throws error during uniform update', async () => {
            prismaMock.uniform.update.mockRejectedValue(new Error('Database update failed'));

            await expect(update(defaultUpdateProps)).rejects.toThrow('Database update failed');
        });
    });

    describe('reserve validation', () => {
        it('updates isReserve if generation not a reserve', async () => {
            // Use generation that is not reserve
            const nonReserveGeneration = mockGenerationLists[0][1];
            prismaMock.uniformGeneration.findUniqueOrThrow.mockResolvedValue(nonReserveGeneration as any);

            const props = {
                ...defaultUpdateProps,
                isReserve: false,
            };

            await expect(update(props)).resolves.toEqual(mockUniformList[0]);

            expect(prismaMock.uniform.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        isReserve: expect.any(Boolean),
                    })
                })
            );
        });

        it('updates isReserve if generation is null', async () => {
            // Use type that doesn't use generations
            prismaMock.uniformType.findFirstOrThrow.mockResolvedValue(mockUniformTypeNoGenerations as any);

            const props = {
                ...defaultUpdateProps,
                isReserve: true,
                generation: null,
            };

            await expect(update(props)).resolves.toEqual(mockUniformList[0]);

            expect(prismaMock.uniform.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        isReserve: expect.any(Boolean),
                    })
                })
            );
        });

        it('does not update isReserve if generation is reserve', async () => {
            // Use generation that is reserve 
            const reserveGeneration = mockGenerationLists[0][0];
            prismaMock.uniformGeneration.findUniqueOrThrow.mockResolvedValue(reserveGeneration as any);

            const props = {
                ...defaultUpdateProps,
                isReserve: false, 
                generation: reserveGeneration.id,
            };

            await expect(update(props)).resolves.toEqual(mockUniformList[0]);

            expect(prismaMock.uniform.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.not.objectContaining({
                        isReserve: expect.any(Boolean),
                    })
                })
            );
        });
    });


    describe('parameter validation', () => {
        it('verifies transaction usage', async () => {
            await expect(update(defaultUpdateProps)).resolves.toEqual(mockUniformList[0]);

            expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Function));
        });
        it('uses correct uniform ID in queries', async () => {
            const customUniformId = 'custom-uniform-id';
            const props = {
                ...defaultUpdateProps,
                id: customUniformId,
            };

            await expect(update(props)).resolves.toEqual(mockUniformList[0]);

            expect(prismaMock.uniformType.findFirstOrThrow).toHaveBeenCalledWith({
                where: {
                    uniformList: {
                        some: {
                            id: customUniformId,
                            recdelete: null,
                        },
                    },
                },
            });
            expect(prismaMock.uniform.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        id: customUniformId,
                    },
                }),
            );
        });
    });

});
