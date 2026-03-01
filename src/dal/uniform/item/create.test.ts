/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@/prisma/client";
import { DeepMockProxy } from "jest-mock-extended";
import { create } from "./create";
import { mockTypeList, mockGenerationLists, mockSizeLists } from "../../../../tests/_jestConfig/staticMockData";

// Get the mocked prisma client
const mockPrisma = jest.requireMock("@/lib/db").prisma as DeepMockProxy<PrismaClient>;

const defaultWithSizes = {
    numberMap: [
        { sizeId: mockSizeLists[0].uniformSizes[0].id, numbers: [3000, 3003] },
        { sizeId: mockSizeLists[0].uniformSizes[1].id, numbers: [3001, 3002] },
    ],
    data: {
        isReserve: false,
        generationId: mockGenerationLists[0][1].id, // Generation1-2
        uniformTypeId: mockTypeList[0].id, // Typ1 (with sizes and generations)
        comment: 'just new'
    }
};
const getParamsWithSize = (data?: any, numberMap?: any[]) => ({
    numberMap: numberMap || defaultWithSizes.numberMap,
    data: {
        ...defaultWithSizes.data,
        ...data
    }
});

const defaultWithoutSizes = {
    numberMap: [
        { sizeId: 'amount', numbers: [3000, 3001] }
    ],
    data: {
        isReserve: false,
        generationId: mockGenerationLists[1][1].id, // Generation2-2
        uniformTypeId: mockTypeList[1].id, // Typ2 (without sizes, with generations)
        comment: 'just new'
    }
};
const getParamsWithoutSize = (data?: any, numberMap?: any) => ({
    numberMap: numberMap || defaultWithoutSizes.numberMap,
    data: {
        ...defaultWithoutSizes.data,
        ...data
    }
})

describe('<UniformItem> create', () => {


    beforeEach(() => {
        mockPrisma.uniform.findMany.mockResolvedValue([]);
        mockPrisma.uniform.createMany.mockResolvedValue({ count: 4 });
    });

    afterEach(() => {
        jest.clearAllMocks();
        // Reset all mock implementations to their default state
        mockPrisma.uniform.findMany.mockReset();
        mockPrisma.uniform.createMany.mockReset();
        mockPrisma.uniformType.findUniqueOrThrow.mockReset();
    });

    describe('successful in all allowed combinations', () => {
        const defaultData = {
            fk_uniformType: mockTypeList[0].id,
            fk_generation: null,
            fk_size: null,
            isReserve: false,
            comment: 'just new'
        }
        it('creates with size and generation', async () => {
            // Mock uniformType lookup for type with sizes and generations
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                ...mockTypeList[0],
                defaultSizelist: {
                    uniformSizes: mockSizeLists[0].uniformSizes
                },
                uniformGenerationList: [{
                    id: mockGenerationLists[0][1].id,
                    sizelist: {
                        uniformSizes: mockSizeLists[0].uniformSizes
                    }
                }]
            } as any);

            mockPrisma.uniform.createMany.mockResolvedValue({ count: 4 });

            await expect(create(defaultWithSizes)).resolves.toBe(4);

            // Verify the correct data was passed to createMany
            expect(mockPrisma.uniform.createMany.mock.calls[0][0]?.data).toHaveLength(4);
            expect(mockPrisma.uniform.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        ...defaultData,
                        number: 3000,
                        fk_size: mockSizeLists[0].uniformSizes[0].id,
                        fk_generation: mockGenerationLists[0][1].id,
                    }),
                    expect.objectContaining({
                        ...defaultData,
                        number: 3001,
                        fk_size: mockSizeLists[0].uniformSizes[1].id,
                        fk_generation: mockGenerationLists[0][1].id,
                    }),
                    expect.objectContaining({
                        ...defaultData,
                        number: 3002,
                        fk_size: mockSizeLists[0].uniformSizes[1].id,
                        fk_generation: mockGenerationLists[0][1].id,
                    }),
                    expect.objectContaining({
                        ...defaultData,
                        number: 3003,
                        fk_size: mockSizeLists[0].uniformSizes[0].id,
                        fk_generation: mockGenerationLists[0][1].id,
                    })
                ])
            });
        });

        it('creates without size, with generation', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue(mockTypeList[1] as any);
            mockPrisma.uniform.createMany.mockResolvedValue({ count: 2 });

            await expect(create(defaultWithoutSizes)).resolves.toBe(2);

            
            expect(mockPrisma.uniform.createMany.mock.calls[0][0]?.data).toHaveLength(2);
            expect(mockPrisma.uniform.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        ...defaultData,
                        number: 3000,
                        fk_uniformType: mockTypeList[1].id,
                        fk_generation: mockGenerationLists[1][1].id,
                    }),
                    expect.objectContaining({
                        ...defaultData,
                        number: 3001,
                        fk_uniformType: mockTypeList[1].id,
                        fk_generation: mockGenerationLists[1][1].id,
                    })
                ])
            });
        });

        it('creates with size, without generation', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                ...mockTypeList[2],
                defaultSizelist: {
                    uniformSizes: mockSizeLists[1].uniformSizes
                },
            } as any);

            mockPrisma.uniform.createMany.mockResolvedValue({ count: 4 });

            const params = getParamsWithSize({
                uniformTypeId: mockTypeList[2].id,
                generationId: null,
            });
            await expect(create(params)).resolves.toBe(4);

            
            expect(mockPrisma.uniform.createMany.mock.calls[0][0]?.data).toHaveLength(4);
            expect(mockPrisma.uniform.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        fk_uniformType: mockTypeList[2].id,
                        fk_generation: null,
                        fk_size: mockSizeLists[1].uniformSizes[0].id
                    })
                ])
            });
        });

        it('creates without size, without generation', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue(mockTypeList[3] as any);
            mockPrisma.uniform.createMany.mockResolvedValue({ count: 2 });

            const params = getParamsWithoutSize({
                uniformTypeId: mockTypeList[3].id,
                generationId: null,
            });
            await expect(create(params)).resolves.toBe(2);

            expect(mockPrisma.uniform.createMany.mock.calls[0][0]?.data).toHaveLength(2);
            expect(mockPrisma.uniform.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        fk_uniformType: mockTypeList[3].id,
                        fk_generation: null,
                        fk_size: null
                    })
                ])
            });
        });
    });

    describe('test type validations', () => {
        it('catches deleted or invalid types', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockRejectedValue(
                new Error('Uniform type not found')
            );

            const params = getParamsWithSize({
                uniformTypeId: 'deleted-type-id',
                generationId: null,
            });
            await expect(create(params)).rejects.toThrow('Uniform type not found');

            // Ensure it filters out deleted types
            expect(mockPrisma.uniformType.findUniqueOrThrow).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        id: 'deleted-type-id',
                        recdelete: null,
                    }
                }),
            );
            expect(mockPrisma.uniform.createMany).not.toHaveBeenCalled();
        });
    });

    describe('testing generations', () => {
        it('catches generations from different type', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue(mockTypeList[1] as any);

            const params = getParamsWithoutSize({
                generationId: mockGenerationLists[0][0].id // Generation from different type
            });
            await expect(create(params)).rejects.toThrow('Not a valid genertion from the uniformType');

            expect(mockPrisma.uniform.createMany).not.toHaveBeenCalled();
        });

        it('catches deleted generations', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue(mockTypeList[1] as any);

            const params = getParamsWithoutSize({
                generationId: 'deleted-generation-id'
            });

            await expect(create(params)).rejects.toThrow('Not a valid genertion from the uniformType');

            expect(mockPrisma.uniformType.findUniqueOrThrow).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.objectContaining({
                        uniformGenerationList: expect.objectContaining({
                            where: {
                                recdelete: null,
                            }
                        }),
                    }),
                }),
            );
            expect(mockPrisma.uniform.createMany).not.toHaveBeenCalled();
        });

        it('catches missing generation', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue(mockTypeList[1] as any);

            const params = getParamsWithoutSize({
                generationId: null
            });
            await expect(create(params)).rejects.toThrow('A genertion is required for this type');

            expect(mockPrisma.uniform.createMany).not.toHaveBeenCalled();
        });

        it('catches with generation when !usingGenerations', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                ...mockTypeList[1],
                usingGenerations: false,
            } as any);

            const params = {
                numberMap: [{ sizeId: 'amount', numbers: [3000, 3001] }],
                data: {
                    uniformTypeId: mockTypeList[1].id,
                    generationId: mockGenerationLists[1][0].id, // Should not have generation
                    isReserve: false,
                    comment: 'just new'
                }
            }
            await expect(create(params)).rejects.toThrow('Type does not suport generations');

            expect(mockPrisma.uniform.createMany).not.toHaveBeenCalled();
        });
    });

    describe('testing sizes', () => {
        it('catches not allowed size with generation', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                id: mockTypeList[0].id,
                usingGenerations: true,
                usingSizes: true,
                defaultSizelist: {
                    uniformSizes: mockSizeLists[2].uniformSizes
                },
                uniformGenerationList: [{
                    id: mockGenerationLists[0][1].id,
                    sizelist: {
                        uniformSizes: mockSizeLists[0].uniformSizes // Only sizes from sizelist 0
                    }
                }]
            } as any);

            const params = getParamsWithSize(undefined, [
                { sizeId: mockSizeLists[2].uniformSizes[0].id, numbers: [3000, 3001] } // Size from different sizelist
            ]);
            await expect(create(params)).rejects.toThrow('Not allowed size used');

            expect(mockPrisma.uniform.createMany).not.toHaveBeenCalled();
        });

        it('catches not allowed size without generation', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                id: mockTypeList[2].id,
                usingGenerations: false,
                usingSizes: true,
                defaultSizelist: {
                    uniformSizes: mockSizeLists[0].uniformSizes
                },
                uniformGenerationList: [{
                    id: mockGenerationLists[0][1].id,
                    sizelist: {
                        uniformSizes: mockSizeLists[2].uniformSizes
                    }
                }]
            } as any);

            const params = getParamsWithSize(
                {
                    uniformTypeId: mockTypeList[2].id,
                    generationId: null,
                }, [
                { sizeId: mockSizeLists[2].uniformSizes[0].id, numbers: [3000, 3001] } // Size from different sizelist
            ],);
            await expect(create(params)).rejects.toThrow('Not allowed size used');

            expect(mockPrisma.uniform.createMany).not.toHaveBeenCalled();
        });

        it('catches missing size when required', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                ...mockTypeList[2],
                defaultSizelist: {
                    uniformSizes: mockSizeLists[1].uniformSizes
                },
            } as any);

            const params = {
                ...defaultWithoutSizes,
                data: {
                    ...defaultWithSizes.data,
                    uniformTypeId: mockTypeList[2].id,
                    generationId: null,
                },
            };
            await expect(create(params)).rejects.toThrow('Not allowed size used');

            expect(mockPrisma.uniform.createMany).not.toHaveBeenCalled();
        });

        it('catches with size when not allowed', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue(mockTypeList[3] as any);

            const params = getParamsWithSize({
                generationId: null,
            });
            await expect(create(params)).rejects.toThrow('Not allowed size used');

            expect(mockPrisma.uniform.createMany).not.toHaveBeenCalled();
        });
    });

    describe('number validations', () => {
        it('catches duplicated number with existing not deleted item of same type', async () => {
            // Mock existing uniform with number 1100
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue(mockTypeList[1] as any);
            mockPrisma.uniform.findMany.mockResolvedValue([
                {
                    id: 'existing-uniform-1',
                    number: 3000,
                    fk_uniformType: mockTypeList[0].id,
                    recdelete: null
                } as any
            ]);

            await expect(create(defaultWithoutSizes)).rejects.toThrow('Number already in use');
            await expect(mockPrisma.uniform.findMany).toHaveBeenCalledWith({
                where: {
                    fk_uniformType: defaultWithoutSizes.data.uniformTypeId,
                    number: { in: [3000, 3001] },
                    recdelete: null,
                }
            });
            expect(mockPrisma.uniform.createMany).not.toHaveBeenCalled();
        });

        it('catches duplicated number within map', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                id: mockTypeList[0].id,
                usingGenerations: true,
                usingSizes: true,
                defaultSizelist: {
                    uniformSizes: mockSizeLists[0].uniformSizes
                },
                uniformGenerationList: [{
                    id: mockGenerationLists[0][1].id,
                    sizelist: {
                        uniformSizes: mockSizeLists[0].uniformSizes
                    }
                }]
            } as any);

            const params = getParamsWithSize(undefined, [
                { sizeId: mockSizeLists[0].uniformSizes[0].id, numbers: [3000, 3001] },
                { sizeId: mockSizeLists[0].uniformSizes[1].id, numbers: [3002, 3001] } // 3001 is duplicated
            ]);
            await expect(create(params)).rejects.toThrow('some number is entered multiple times');

            expect(mockPrisma.uniform.createMany).not.toHaveBeenCalled();
        });
    });

    describe('sizelist validation edge cases', () => {
        it('throws error when sizelist is null but sizes are required', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                id: mockTypeList[0].id,
                usingGenerations: true,
                usingSizes: true,
                defaultSizelist: null, // This should cause an error
                uniformGenerationList: [{
                    id: mockGenerationLists[0][1].id,
                    sizelist: null // This should also cause an error
                }]
            } as any);

            await expect(create(defaultWithSizes)).rejects.toThrow(
                'Could not create Uniformitems. Failed to find sizelist for selected type and generation'
            );

            expect(mockPrisma.uniform.createMany).not.toHaveBeenCalled();
        });
    });
});