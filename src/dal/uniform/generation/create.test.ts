/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { DeepMockProxy } from "jest-mock-extended";
import { create } from "./create";
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
const mockUniformType = mockTypeList[0]; // Type with sizes and generations
const mockUniformTypeNoSizes = mockTypeList[1]; // Type with generations but no sizes
const mockUniformTypeNoGenerations = mockTypeList[2]; // Type without generations

const defaultProps = {
    name: "New Generation",
    outdated: true,
    fk_sizelist: mockSizeLists[0].id,
    uniformTypeId: mockUniformType.id,
};

const mockExistingGenerations = [
    {
        id: 'existing-gen-1',
        name: 'Generation1-1',
        sortOrder: 0,
        fk_uniformType: mockUniformType.id,
        recdelete: null,
    },
    {
        id: 'existing-gen-2',
        name: 'Generation1-2',
        sortOrder: 1,
        fk_uniformType: mockUniformType.id,
        recdelete: null,
    }
];

const mockUniformTypeList = [mockUniformType];
const mockSession = { assosiation: 'test-assosiation-id', username: 'testuser' };

describe('<UniformGeneration> create', () => {

    beforeEach(() => {
        // Setup default successful mocks
        mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue(mockUniformType as any);
        mockPrisma.uniformGeneration.findMany.mockResolvedValue(mockExistingGenerations as any);
        mockPrisma.uniformGeneration.create.mockResolvedValue({
            id: 'new-generation-id',
            name: defaultProps.name,
            outdated: defaultProps.outdated,
            fk_sizelist: defaultProps.fk_sizelist,
            fk_uniformType: defaultProps.uniformTypeId,
            sortOrder: 2,
        } as any);
        mockGetUniformTypeList.mockResolvedValue(mockUniformTypeList as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
        mockPrisma.uniformType.findUniqueOrThrow.mockReset();
        mockPrisma.uniformGeneration.findMany.mockReset();
        mockPrisma.uniformGeneration.create.mockReset();
    });

    describe('successful creation scenarios', () => {
        it('creates generation successfully with all required fields', async () => {
            // Create the generation
            await expect(create(defaultProps)).resolves.toEqual(mockUniformTypeList);

            // Verify database interactions
            expect(mockPrisma.uniformType.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: defaultProps.uniformTypeId }
            });
            expect(mockPrisma.uniformGeneration.findMany).toHaveBeenCalledWith({
                where: {
                    fk_uniformType: defaultProps.uniformTypeId,
                    recdelete: null
                }
            });
            expect(mockPrisma.uniformGeneration.create).toHaveBeenCalledWith({
                data: {
                    name: defaultProps.name,
                    outdated: defaultProps.outdated,
                    fk_sizelist: defaultProps.fk_sizelist,
                    fk_uniformType: defaultProps.uniformTypeId,
                    sortOrder: 2, // Length of existing generations
                }
            });
            expect(mockGetUniformTypeList).toHaveBeenCalledWith(mockSession.assosiation, expect.anything());
        });

        it('creates generation with null sizelist when type does not use sizes', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue(mockUniformTypeNoSizes as any);

            // create the generation with a type that does not use sizes
            const props = {
                ...defaultProps,
                uniformTypeId: mockUniformTypeNoSizes.id,
                fk_sizelist: mockSizeLists[0].id, // Provided but should be nullified
            };
            await expect(create(props)).resolves.toEqual(mockUniformTypeList);

            // Verify database interactions
            expect(mockPrisma.uniformGeneration.create).toHaveBeenCalledWith({
                data: {
                    name: props.name,
                    outdated: props.outdated,
                    fk_sizelist: null, // Should be null for types not using sizes
                    fk_uniformType: props.uniformTypeId,
                    sortOrder: 2,
                }
            });
        });

        it('sets correct sortOrder based on existing generations count', async () => {
            const moreGenerations = [...mockExistingGenerations,
            { id: 'gen-3', name: 'Gen3', sortOrder: 2, fk_uniformType: mockUniformType.id, recdelete: null },
            { id: 'gen-4', name: 'Gen4', sortOrder: 3, fk_uniformType: mockUniformType.id, recdelete: null }
            ];
            mockPrisma.uniformGeneration.findMany.mockResolvedValue(moreGenerations as any);

            // Create the generation with more existing generations
            await expect(create(defaultProps)).resolves.toEqual(mockUniformTypeList);

            // Verify sortOrder is set correctly
            expect(mockPrisma.uniformGeneration.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    sortOrder: 4,
                })
            });
        });
    });

    describe('validation error scenarios', () => {
        it('throws error when type does not use generations', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue(mockUniformTypeNoGenerations as any);

            await expect(create({
                ...defaultProps,
                uniformTypeId: mockUniformTypeNoGenerations.id
            })).rejects.toThrow('generations are not activated for uniformType');

            expect(mockPrisma.uniformGeneration.findMany).not.toHaveBeenCalled();
            expect(mockPrisma.uniformGeneration.create).not.toHaveBeenCalled();
        });

        it('throws error when type uses sizes but no sizelist provided', async () => {
            const props = {
                ...defaultProps,
                fk_sizelist: null,
            };

            await expect(create(props)).rejects.toThrow('fk_sizelist is required for this uniformType');

            expect(mockPrisma.uniformGeneration.create).not.toHaveBeenCalled();
        });

        it('returns soft error for name duplication', async () => {
            const props = {
                ...defaultProps,
                name: 'Generation1-1', // Name that already exists
            };
            const expectedResult = {
                error: {
                    message: "custom.uniform.generation.nameDuplication",
                    formElement: "name",
                }
            };

            await expect(create(props)).resolves.toEqual(expectedResult);
            expect(mockPrisma.uniformGeneration.create).not.toHaveBeenCalled();
            expect(mockGetUniformTypeList).not.toHaveBeenCalled();
        });

        it('throws error when uniform type is not found', async () => {
            mockPrisma.uniformType.findUniqueOrThrow.mockRejectedValue(new Error('Type not found'));

            await expect(create(defaultProps)).rejects.toThrow('Type not found');

            expect(mockPrisma.uniformGeneration.findMany).not.toHaveBeenCalled();
            expect(mockPrisma.uniformGeneration.create).not.toHaveBeenCalled();
        });
    });

    describe('database interaction verification', () => {
        it('verifies transaction usage', async () => {
            await expect(create(defaultProps)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
        });

        it('queries for existing generations with correct parameters', async () => {
            await expect(create(defaultProps)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.uniformGeneration.findMany).toHaveBeenCalledWith({
                where: {
                    fk_uniformType: defaultProps.uniformTypeId,
                    recdelete: null // Only non-deleted generations
                }
            });
        });

        it('uses correct parameters in database queries', async () => {
            const customTypeId = 'custom-type-id';
            const props = {
                ...defaultProps,
                uniformTypeId: customTypeId,
            };

            await expect(create(props)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.uniformType.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: customTypeId }
            });
            expect(mockPrisma.uniformGeneration.findMany).toHaveBeenCalledWith({
                where: {
                    fk_uniformType: customTypeId,
                    recdelete: null
                }
            });
        });
    });

    describe('edge cases', () => {
        it('handles empty existing generations list', async () => {
            mockPrisma.uniformGeneration.findMany.mockResolvedValue([]);

            await expect(create(defaultProps)).resolves.toEqual(mockUniformTypeList);

            expect(mockPrisma.uniformGeneration.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    sortOrder: 0, // First generation gets sortOrder 0
                })
            });
        });
    });
});
