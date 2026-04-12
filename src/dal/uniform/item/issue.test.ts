import { ExceptionType } from "@/errors/CustomException";
import { AuthRole } from "@/lib/AuthRoles";
import { prismaMock } from '@test-utils/prisma-mock';
import { genericSAValidator } from "@/actions/validations";
import { __unsecuredReturnUniformitem } from "./return";
import { __unsecuredGetCadetUniformMap } from "@/dal/cadet/uniformMap";
import { mockGenerationLists, mockTypeList, mockUniformList } from "../../../../tests/_jestConfig/staticMockData";
import { issue } from "./issue";

// Mock the dependencies
vi.mock("./return");
vi.mock("@/dal/cadet/uniformMap");

const mockCadetId = 'cadet-123';
const mockUniformId = 'uniform-456';
const mockUniformToReplaceId = 'uniform-to-replace-789';

const defaultIssueProps = {
    number: 2001,
    uniformTypeId: mockTypeList[0].id,
    cadetId: mockCadetId,
    options: {}
};

// Mock uniform data
const mockUniform = {
    id: mockUniformId,
    number: 2001,
    fk_uniformType: mockTypeList[0].id,
    isReserve: false,
    storageUnitId: null,
    generation: null,
    type: {
        id: mockTypeList[0].id,
        name: mockTypeList[0].name,
    },
    issuedEntries: []
};

const mockReserveUniform = {
    ...mockUniform,
    isReserve: true
};

// Use existing mock generation data from staticMockData.ts
const mockReserveGeneration = mockGenerationLists[0][0]; // isReserve: true

const mockUniformWithReserveGeneration = {
    ...mockUniform,
    generation: mockReserveGeneration
};

const mockUniformWithoutGeneration = {
    ...mockUniform,
    generation: null
};

// Use existing mock type data from staticMockData.ts
const mockTypeWithGenerations = mockTypeList[0]; // usingGenerations: true
const mockTypeWithoutGenerations = mockTypeList[2]; // usingGenerations: false

const mockUniformWithReserveGenerationButTypeNotUsingGenerations = {
    ...mockUniform,
    fk_uniformType: mockTypeList[2].id,
    type: mockTypeWithoutGenerations,
    generation: mockReserveGeneration
};

// Update existing mocks to include type with usingGenerations info
const mockUniformWithReserveGenerationAndType = {
    ...mockUniformWithReserveGeneration,
    type: mockTypeWithGenerations
};

const mockIssuedUniform = {
    ...mockUniform,
    issuedEntries: [{
        id: 'issued-entry-1',
        fk_cadet: 'other-cadet-123',
        dateIssued: new Date('2025-01-01'),
        cadet: {
            id: 'other-cadet-123',
            firstname: 'John',
            lastname: 'Doe'
        }
    }]
};

const mockCadet = {
    id: mockCadetId,
    firstname: 'Jane',
    lastname: 'Smith'
};

const mockIssuedEntry = {
    id: 'issued-entry-replace',
    fk_cadet: mockCadetId,
    dateIssued: new Date('2025-01-01')
};

describe('<UniformItem> issue', () => {

    // Get the mocked functions from the modules mocked above
    const mockUnsecuredReturnUniformitem = vi.mocked(__unsecuredReturnUniformitem);
    const mockUnsecuredGetCadetUniformMap = vi.mocked(__unsecuredGetCadetUniformMap);

    beforeAll(() => {
        // Set up mock return values that depend on imported data
        mockUnsecuredGetCadetUniformMap.mockResolvedValue([mockUniformList[0]] as any);
    });

    beforeEach(() => {
        // Default mock responses
        prismaMock.uniform.findFirst.mockResolvedValue(mockUniform as any);
        prismaMock.uniform.create.mockResolvedValue(mockUniform as any);
        prismaMock.uniform.update.mockResolvedValue(mockUniform as any);
        prismaMock.uniformIssued.create.mockResolvedValue({ id: 'new-issued-entry' } as any);
        prismaMock.cadet.findUniqueOrThrow.mockResolvedValue(mockCadet as any);
        prismaMock.$executeRaw.mockResolvedValue(1);
    });

    afterEach(() => {
        vi.clearAllMocks();
        prismaMock.uniform.findFirst.mockReset();
        prismaMock.uniform.create.mockReset();
        prismaMock.uniform.update.mockReset();
        prismaMock.uniformIssued.create.mockReset();
        prismaMock.uniformIssued.findFirst.mockReset();
        prismaMock.cadet.findUniqueOrThrow.mockReset();
        prismaMock.$executeRaw.mockReset();
        mockUnsecuredReturnUniformitem.mockReset();
    });


    describe('successful issue scenarios', () => {
        it('issues uniform to cadet successfully', async () => {
            await expect(issue(defaultIssueProps)).resolves.toEqual([mockUniformList[0]]);

            expect(prismaMock.uniform.findFirst).toHaveBeenCalledWith({
                where: {
                    number: 2001,
                    fk_uniformType: mockTypeList[0].id,
                    recdelete: null,
                },
                include: {
                    type: true,
                    generation: true,
                    issuedEntries: {
                        where: {
                            dateReturned: null,
                        },
                        include: { cadet: expect.any(Object) }
                    },
                }
            });
            expect(prismaMock.uniformIssued.create).toHaveBeenCalledWith({
                data: {
                    fk_uniform: mockUniformId,
                    fk_cadet: mockCadetId,
                }
            });
        });

        it('creates and issues uniform when uniform does not exist and create option is true', async () => {
            prismaMock.uniform.findFirst.mockResolvedValue(null);

            await expect(
                issue({
                    ...defaultIssueProps,
                    options: { create: true }
                })
            ).resolves.toEqual([mockUniformList[0]]);

            expect(prismaMock.uniform.create).toHaveBeenCalledWith({
                data: {
                    number: 2001,
                    fk_uniformType: mockTypeList[0].id,
                    isReserve: false,
                    issuedEntries: {
                        create: {
                            fk_cadet: mockCadetId,
                        }
                    }
                }
            });
            expect(prismaMock.uniformIssued.create).not.toHaveBeenCalled(); // uniform.create handles this
        });

        it('issues reserve uniform when ignoreReserve option is true', async () => {
            prismaMock.uniform.findFirst.mockResolvedValue(mockReserveUniform as any);

            await expect(
                issue({
                    ...defaultIssueProps,
                    options: { ignoreReserve: true }
                })
            ).resolves.toEqual([mockUniformList[0]]);

            expect(prismaMock.uniformIssued.create).toHaveBeenCalled();
        });

        it('issues uniform with reserve generation when ignoreReserve option is true', async () => {
            prismaMock.uniform.findFirst.mockResolvedValue(mockUniformWithReserveGenerationAndType as any);

            await expect(
                issue({
                    ...defaultIssueProps,
                    options: { ignoreReserve: true }
                })
            ).resolves.toEqual([mockUniformList[0]]);

            expect(prismaMock.uniformIssued.create).toHaveBeenCalled();
        });

        it('issues uniform without generation when uniformtype uses generations', async () => {
            prismaMock.uniform.findFirst.mockResolvedValue(mockUniformWithoutGeneration as any);

            await expect(issue(defaultIssueProps)).resolves.toEqual([mockUniformList[0]]);

            expect(prismaMock.uniformIssued.create).toHaveBeenCalled();
        });

        it('issues uniform with reserve generation when uniform type does not use generations', async () => {
            // When uniformType.usingGenerations is false, generation.isReserve should be ignored
            prismaMock.uniform.findFirst.mockResolvedValue(mockUniformWithReserveGenerationButTypeNotUsingGenerations as any);

            await expect(issue({
                ...defaultIssueProps,
                uniformTypeId: mockTypeList[2].id
            })).resolves.toEqual([mockUniformList[0]]);

            expect(prismaMock.uniformIssued.create).toHaveBeenCalled();
        });

        it('forcefully issues already issued uniform', async () => {
            prismaMock.uniform.findFirst.mockResolvedValue(mockIssuedUniform as any);

            await expect(
                issue({
                    ...defaultIssueProps,
                    options: { force: true }
                })
            ).resolves.toEqual([mockUniformList[0]]);

            // Should add comment to previous owner
            expect(prismaMock.$executeRaw).toHaveBeenCalledWith(
                expect.any(Array), // Template literal parts
                expect.stringContaining(`<<Das Uniformteil ${mockTypeList[0].name} 2001 wurde Jane Smith Überschrieben>>`),
                'other-cadet-123'
            );

            // Should return the uniform from previous owner
            expect(mockUnsecuredReturnUniformitem).toHaveBeenCalledWith(
                'issued-entry-1',
                new Date('2025-01-01'),
                expect.anything(),
            );

            expect(prismaMock.uniformIssued.create).toHaveBeenCalled();
        });

        it('removes uniform from storage unit when issuing', async () => {
            const uniformInStorage = {
                ...mockUniform,
                storageUnitId: 'storage-unit-123'
            };
            prismaMock.uniform.findFirst.mockResolvedValue(uniformInStorage as any);

            await expect(issue(defaultIssueProps)).resolves.toEqual([mockUniformList[0]]);

            expect(prismaMock.uniform.update).toHaveBeenCalledWith({
                where: { id: mockUniformId },
                data: {
                    storageUnitId: null,
                }
            });
            expect(prismaMock.uniformIssued.create).toHaveBeenCalled();
        });

        it('returns previous uniform when replacing', async () => {
            prismaMock.uniformIssued.findFirst.mockResolvedValue(mockIssuedEntry as any);

            await expect(
                issue({
                    ...defaultIssueProps,
                    idToReplace: mockUniformToReplaceId
                })
            ).resolves.toEqual([mockUniformList[0]]);

            // Should find the issued entry to replace
            expect(prismaMock.uniformIssued.findFirst).toHaveBeenCalledWith({
                where: {
                    dateReturned: null,
                    fk_cadet: mockCadetId,
                    uniform: {
                        id: mockUniformToReplaceId,
                        fk_uniformType: mockTypeList[0].id,
                        recdelete: null,
                    }
                }
            });

            // Should return the previous uniform
            expect(mockUnsecuredReturnUniformitem).toHaveBeenCalledWith(
                'issued-entry-replace',
                new Date('2025-01-01'),
                expect.anything(),
            );

            expect(prismaMock.uniformIssued.create).toHaveBeenCalled();
        });
    });

    describe('error scenarios', () => {
        it('throws error when uniform not found and create option is false', async () => {
            prismaMock.uniform.findFirst.mockResolvedValue(null);

            await expect(issue(defaultIssueProps)).resolves.toMatchObject({
                error: {
                    exceptionType: ExceptionType.NullValueException,
                }
            });

            expect(prismaMock.uniform.create).not.toHaveBeenCalled();
            expect(prismaMock.uniformIssued.create).not.toHaveBeenCalled();
        });

        it('throws error when uniform is reserve and ignoreReserve is false', async () => {
            prismaMock.uniform.findFirst.mockResolvedValue(mockReserveUniform as any);

            await expect(issue(defaultIssueProps)).resolves.toMatchObject({
                error: {
                    exceptionType: ExceptionType.InactiveException,
                }
            });

            expect(prismaMock.uniformIssued.create).not.toHaveBeenCalled();
        });

        it('throws error when generation is reserve and ignoreReserve is false', async () => {
            prismaMock.uniform.findFirst.mockResolvedValue(mockUniformWithReserveGenerationAndType as any);

            await expect(issue(defaultIssueProps)).resolves.toMatchObject({
                error: {
                    exceptionType: ExceptionType.InactiveException,
                }
            });

            expect(prismaMock.uniformIssued.create).not.toHaveBeenCalled();
        });

        it('throws error when uniform is already issued and force is false', async () => {
            prismaMock.uniform.findFirst.mockResolvedValue(mockIssuedUniform as any);

            await expect(issue(defaultIssueProps)).resolves.toMatchObject({
                error: {
                    exceptionType: ExceptionType.UniformIssuedException,
                }
            });

            expect(prismaMock.uniformIssued.create).not.toHaveBeenCalled();
        });

        it('throws error when uniform to replace is not found', async () => {
            prismaMock.uniformIssued.findFirst.mockResolvedValue(null);

            await expect(issue({
                ...defaultIssueProps,
                idToReplace: mockUniformToReplaceId
            })).rejects.toThrow('Could not return UniformToReplace. Issued Entry not found: ' + mockUniformToReplaceId);

            expect(prismaMock.uniformIssued.create).not.toHaveBeenCalled();
        });

        it('throws error when comment cannot be added to previous owner', async () => {
            prismaMock.uniform.findFirst.mockResolvedValue(mockIssuedUniform as any);
            prismaMock.$executeRaw.mockResolvedValue(0); // Simulate failure

            await expect(issue({
                ...defaultIssueProps,
                options: { force: true }
            })).rejects.toThrow('Could not add comment to previous owner');

            expect(prismaMock.uniformIssued.create).not.toHaveBeenCalled();
        });
    });

    describe('validation scenarios', () => {
        it('calls genericSAValidator with correct parameters', async () => {
            await expect(issue(defaultIssueProps)).resolves.toEqual([mockUniformList[0]]);

            expect(prismaMock.uniformIssued.create).toHaveBeenCalled();
            expect(vi.mocked(genericSAValidator)).toHaveBeenCalledWith(
                AuthRole.inspector,
                defaultIssueProps,
                expect.anything(),
                {
                    cadetId: mockCadetId,
                    uniformId: undefined,
                    uniformTypeId: defaultIssueProps.uniformTypeId,
                }
            );
        });
    });

    describe('database interaction verification', () => {
        it('verifies cadet lookup when forcing issue', async () => {
            prismaMock.uniform.findFirst.mockResolvedValue(mockIssuedUniform as any);

            await issue({
                ...defaultIssueProps,
                options: { force: true }
            });

            expect(prismaMock.cadet.findUniqueOrThrow).toHaveBeenCalledWith({
                where: {
                    id: mockCadetId,
                    recdelete: null,
                }
            });
        });

        it('verifies correct uniform lookup parameters', async () => {
            await issue(defaultIssueProps);

            expect(prismaMock.uniform.findFirst).toHaveBeenCalledWith({
                where: {
                    number: 2001,
                    fk_uniformType: mockTypeList[0].id,
                    recdelete: null,
                },
                include: {
                    type: true,
                    generation: true,
                    issuedEntries: {
                        where: {
                            dateReturned: null,
                        },
                        include: { cadet: expect.any(Object) }
                    },
                }
            });
        });
    });
});
