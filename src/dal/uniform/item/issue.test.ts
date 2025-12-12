/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@/prisma/client";
import { DeepMockProxy } from "jest-mock-extended";
import { mockTypeList, mockUniformList } from "../../../../tests/_jestConfig/staticMockData";
import { issue } from "./issue";
import { AuthRole } from "@/lib/AuthRoles";
import { ExceptionType } from "@/errors/CustomException";

// Mock the dependencies
jest.mock("./return");
jest.mock("@/dal/cadet/uniformMap");

// Get the mocked prisma client
const mockPrisma = jest.requireMock("@/lib/db").prisma as DeepMockProxy<PrismaClient>;

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
    active: true,
    storageUnitId: null,
    type: {
        id: mockTypeList[0].id,
        name: mockTypeList[0].name,
    },
    issuedEntries: []
};

const mockInactiveUniform = {
    ...mockUniform,
    active: false
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
    const mockUnsecuredReturnUniformitem = jest.requireMock("./return").__unsecuredReturnUniformitem;
    const mockUnsecuredGetCadetUniformMap = jest.requireMock("@/dal/cadet/uniformMap").__unsecuredGetCadetUniformMap;

    beforeAll(() => {
        // Set up mock return values that depend on imported data
        mockUnsecuredGetCadetUniformMap.mockResolvedValue([mockUniformList[0]]);
    });

    beforeEach(() => {
        // Default mock responses
        mockPrisma.uniform.findFirst.mockResolvedValue(mockUniform as any);
        mockPrisma.uniform.create.mockResolvedValue(mockUniform as any);
        mockPrisma.uniform.update.mockResolvedValue(mockUniform as any);
        mockPrisma.uniformIssued.create.mockResolvedValue({ id: 'new-issued-entry' } as any);
        mockPrisma.cadet.findUniqueOrThrow.mockResolvedValue(mockCadet as any);
        mockPrisma.$executeRaw.mockResolvedValue(1);
    });

    afterEach(() => {
        jest.clearAllMocks();
        mockPrisma.uniform.findFirst.mockReset();
        mockPrisma.uniform.create.mockReset();
        mockPrisma.uniform.update.mockReset();
        mockPrisma.uniformIssued.create.mockReset();
        mockPrisma.uniformIssued.findFirst.mockReset();
        mockPrisma.cadet.findUniqueOrThrow.mockReset();
        mockPrisma.$executeRaw.mockReset();
        mockUnsecuredReturnUniformitem.mockReset();
    });


    describe('successful issue scenarios', () => {
        it('issues uniform to cadet successfully', async () => {
            await expect(issue(defaultIssueProps)).resolves.toEqual([mockUniformList[0]]);

            expect(mockPrisma.uniform.findFirst).toHaveBeenCalledWith({
                where: {
                    number: 2001,
                    fk_uniformType: mockTypeList[0].id,
                    recdelete: null,
                },
                include: {
                    type: true,
                    issuedEntries: {
                        where: {
                            dateReturned: null,
                        },
                        include: { cadet: expect.any(Object) }
                    },
                }
            });
            expect(mockPrisma.uniformIssued.create).toHaveBeenCalledWith({
                data: {
                    fk_uniform: mockUniformId,
                    fk_cadet: mockCadetId,
                }
            });
        });

        it('creates and issues uniform when uniform does not exist and create option is true', async () => {
            mockPrisma.uniform.findFirst.mockResolvedValue(null);

            await expect(
                issue({
                    ...defaultIssueProps,
                    options: { create: true }
                })
            ).resolves.toEqual([mockUniformList[0]]);

            expect(mockPrisma.uniform.create).toHaveBeenCalledWith({
                data: {
                    number: 2001,
                    fk_uniformType: mockTypeList[0].id,
                    active: true,
                    issuedEntries: {
                        create: {
                            fk_cadet: mockCadetId,
                        }
                    }
                }
            });
            expect(mockPrisma.uniformIssued.create).not.toHaveBeenCalled(); // uniform.create handles this
        });

        it('issues inactive uniform when ignoreInactive option is true', async () => {
            mockPrisma.uniform.findFirst.mockResolvedValue(mockInactiveUniform as any);

            await expect(
                issue({
                    ...defaultIssueProps,
                    options: { ignoreInactive: true }
                })
            ).resolves.toEqual([mockUniformList[0]]);

            expect(mockPrisma.uniformIssued.create).toHaveBeenCalled();
        });

        it('forcefully issues already issued uniform', async () => {
            mockPrisma.uniform.findFirst.mockResolvedValue(mockIssuedUniform as any);

            await expect(
                issue({
                    ...defaultIssueProps,
                    options: { force: true }
                })
            ).resolves.toEqual([mockUniformList[0]]);

            // Should add comment to previous owner
            expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
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

            expect(mockPrisma.uniformIssued.create).toHaveBeenCalled();
        });

        it('removes uniform from storage unit when issuing', async () => {
            const uniformInStorage = {
                ...mockUniform,
                storageUnitId: 'storage-unit-123'
            };
            mockPrisma.uniform.findFirst.mockResolvedValue(uniformInStorage as any);

            await expect(issue(defaultIssueProps)).resolves.toEqual([mockUniformList[0]]);

            expect(mockPrisma.uniform.update).toHaveBeenCalledWith({
                where: { id: mockUniformId },
                data: {
                    storageUnitId: null,
                }
            });
            expect(mockPrisma.uniformIssued.create).toHaveBeenCalled();
        });

        it('returns previous uniform when replacing', async () => {
            mockPrisma.uniformIssued.findFirst.mockResolvedValue(mockIssuedEntry as any);

            await expect(
                issue({
                    ...defaultIssueProps,
                    idToReplace: mockUniformToReplaceId
                })
            ).resolves.toEqual([mockUniformList[0]]);

            // Should find the issued entry to replace
            expect(mockPrisma.uniformIssued.findFirst).toHaveBeenCalledWith({
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

            expect(mockPrisma.uniformIssued.create).toHaveBeenCalled();
        });
    });

    describe('error scenarios', () => {
        it('throws error when uniform not found and create option is false', async () => {
            mockPrisma.uniform.findFirst.mockResolvedValue(null);

            await expect(issue(defaultIssueProps)).resolves.toMatchObject({
                error: {
                    exceptionType: ExceptionType.NullValueException,
                }
            });

            expect(mockPrisma.uniform.create).not.toHaveBeenCalled();
            expect(mockPrisma.uniformIssued.create).not.toHaveBeenCalled();
        });

        it('throws error when uniform is inactive and ignoreInactive is false', async () => {
            mockPrisma.uniform.findFirst.mockResolvedValue(mockInactiveUniform as any);

            await expect(issue(defaultIssueProps)).resolves.toMatchObject({
                error: {
                    exceptionType: ExceptionType.InactiveException,
                }
            })

            expect(mockPrisma.uniformIssued.create).not.toHaveBeenCalled();
        });

        it('throws error when uniform is already issued and force is false', async () => {
            mockPrisma.uniform.findFirst.mockResolvedValue(mockIssuedUniform as any);

            await expect(issue(defaultIssueProps)).resolves.toMatchObject({
                error: {
                    exceptionType: ExceptionType.UniformIssuedException,
                }
            });

            expect(mockPrisma.uniformIssued.create).not.toHaveBeenCalled();
        });

        it('throws error when uniform to replace is not found', async () => {
            mockPrisma.uniformIssued.findFirst.mockResolvedValue(null);

            await expect(issue({
                ...defaultIssueProps,
                idToReplace: mockUniformToReplaceId
            })).rejects.toThrow('Could not return UniformToReplace. Issued Entry not found: ' + mockUniformToReplaceId);

            expect(mockPrisma.uniformIssued.create).not.toHaveBeenCalled();
        });

        it('throws error when comment cannot be added to previous owner', async () => {
            mockPrisma.uniform.findFirst.mockResolvedValue(mockIssuedUniform as any);
            mockPrisma.$executeRaw.mockResolvedValue(0); // Simulate failure

            await expect(issue({
                ...defaultIssueProps,
                options: { force: true }
            })).rejects.toThrow('Could not add comment to previous owner');

            expect(mockPrisma.uniformIssued.create).not.toHaveBeenCalled();
        });
    });

    describe('validation scenarios', () => {
        it('calls genericSAValidator with correct parameters', async () => {
            const { genericSAValidator } = jest.requireMock("@/actions/validations");
            await expect(issue(defaultIssueProps)).resolves.toEqual([mockUniformList[0]]);

            expect(mockPrisma.uniformIssued.create).toHaveBeenCalled();
            expect(genericSAValidator).toHaveBeenCalledWith(
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
            mockPrisma.uniform.findFirst.mockResolvedValue(mockIssuedUniform as any);

            await issue({
                ...defaultIssueProps,
                options: { force: true }
            });

            expect(mockPrisma.cadet.findUniqueOrThrow).toHaveBeenCalledWith({
                where: {
                    id: mockCadetId,
                    recdelete: null,
                }
            });
        });

        it('verifies correct uniform lookup parameters', async () => {
            await issue(defaultIssueProps);

            expect(mockPrisma.uniform.findFirst).toHaveBeenCalledWith({
                where: {
                    number: 2001,
                    fk_uniformType: mockTypeList[0].id,
                    recdelete: null,
                },
                include: {
                    type: true,
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
