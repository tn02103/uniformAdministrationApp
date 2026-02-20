import CustomException, { ExceptionType } from "@/errors/CustomException";
import { UniformIssuedException } from "@/errors/SaveDataException";
import { prisma } from "@/lib/db";
import { addUniform } from "./addUniform";

jest.mock('@/lib/db', () => ({
    prisma: {
        uniform: {
            findUniqueOrThrow: jest.fn(),
            update: jest.fn(),
        },
        storageUnit: {
            findUniqueOrThrow: jest.fn(),
        },
        $transaction: jest.fn((fn) => fn(prisma)),
    }
}));
jest.mock("@/actions/validations", () => ({
    genericSAValidator: jest.fn((_, props,) =>
        Promise.resolve([{ organisation: '1' }, props])
    ),
}));
jest.mock("./get", () => ({
    __unsecuredGetUnitsWithUniformItems: jest.fn(async () => "unitsWithUniformItems"),
}));

const defaultProps = {
    storageUnitId: "storage-unit-uuid",
    uniformId: "uniform-uuid",
};

const uniformBase = {
    id: "uniform-uuid",
    number: "U-001",
    isReserve: false,
    storageUnit: null,
    issuedEntries: [],
    type: {
        usingGenerations: true,
    },
    generation: {
        isReserve: false,
    }
};

const storageUnitBase = {
    id: "storage-unit-uuid",
    name: "Main Storage",
    description: "Main storage unit",
    isReserve: false,
    uniformList: [],
};

describe("<StorageUnit> addUniform", () => {
    afterEach(jest.clearAllMocks);

    const prismaUniformFindUniqueOrThrow = prisma.uniform.findUniqueOrThrow as jest.Mock;
    const prismaUniformUpdate = prisma.uniform.update as jest.Mock;
    const prismaStorageUnitFindUniqueOrThrow = prisma.storageUnit.findUniqueOrThrow as jest.Mock;
    const getUnitsWithUniformItems = jest.requireMock('./get.ts').__unsecuredGetUnitsWithUniformItems as jest.Mock;

    beforeEach(() => {
        prismaUniformFindUniqueOrThrow.mockResolvedValue(uniformBase);
        prismaStorageUnitFindUniqueOrThrow.mockResolvedValue(storageUnitBase);
        prismaUniformUpdate.mockResolvedValue({});
        getUnitsWithUniformItems.mockResolvedValue("unitsWithUniformItems");
    })

    it("should add uniform to storage unit and return updated units", async () => {
        const result = await addUniform(defaultProps);
        expect(prismaUniformFindUniqueOrThrow).toHaveBeenCalledWith({
            where: { id: defaultProps.uniformId },
            include: {
                issuedEntries: { where: { dateReturned: null }, include: { cadet: true } },
                storageUnit: true,
                type: true,
                generation: true,
            }
        });
        expect(prismaStorageUnitFindUniqueOrThrow).toHaveBeenCalledWith({
            where: { id: defaultProps.storageUnitId },
            include: { uniformList: true }
        });
        expect(prismaUniformUpdate).toHaveBeenCalledWith({
            where: { id: defaultProps.uniformId },
            data: { storageUnitId: defaultProps.storageUnitId }
        });
        expect(getUnitsWithUniformItems).toHaveBeenCalledWith('1', prisma);
        expect(result).toBe("unitsWithUniformItems");
    });

    it("should throw CustomException if uniform already in a storage unit", async () => {
        prismaUniformFindUniqueOrThrow.mockResolvedValueOnce({
            ...uniformBase,
            storageUnit: {
                id: "other-storage-unit",
                name: "Other",
                description: "Other desc",
            },
            issuedEntries: [],
        });
        prismaStorageUnitFindUniqueOrThrow.mockResolvedValueOnce({
            ...storageUnitBase,
            isReserve: false,
        });
        const result = addUniform(defaultProps)
        await expect(result).rejects.toThrow(CustomException);
        await expect(result).rejects.toMatchObject(
            new CustomException(
                "uniform already is in a storage unit",
                ExceptionType.InUseException,
                {
                    storageUnit: {
                        id: "other-storage-unit",
                        name: "Other",
                        description: "Other desc",
                    }
                }
            )
        );
        expect(prismaUniformUpdate).not.toHaveBeenCalled();
    });

    it("should throw UniformIssuedException if uniform is issued", async () => {
        prismaUniformFindUniqueOrThrow.mockResolvedValueOnce({
            ...uniformBase,
            storageUnit: null,
            issuedEntries: [
                { cadet: { id: "cadet-1", name: "Cadet 1" } }
            ],
        });

        await expect(addUniform(defaultProps)).rejects.toThrow(UniformIssuedException);
        expect(prismaUniformUpdate).not.toHaveBeenCalled();
    });

    describe('isReserve handling', () => {
        beforeEach(() => {
            prismaStorageUnitFindUniqueOrThrow.mockResolvedValue({
                ...storageUnitBase,
                isReserve: true,
            });
        });
        it('should set if neither uniform nor generation is reserve', async () => {
            const result = await addUniform(defaultProps);
            expect(result).toBe("unitsWithUniformItems");
            expect(prismaUniformUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ isReserve: true })
                })
            );
        });

        it('should set if !usingGenerations and uniform is not reserve and generation is reserve', async () => {
            prismaUniformFindUniqueOrThrow.mockResolvedValue({
                ...uniformBase,
                type: { usingGenerations: false },
                generation: { isReserve: true },
            });

            const result = await addUniform(defaultProps);
            expect(result).toBe("unitsWithUniformItems");
            expect(prismaUniformUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ isReserve: true })
                })
            );
        });

        it('should not set if uniform is already reserve', async () => {
            prismaUniformFindUniqueOrThrow.mockResolvedValue({
                ...uniformBase,
                isReserve: true,
            });

            const result = await addUniform(defaultProps);
            expect(result).toBe("unitsWithUniformItems");
            expect(prismaUniformUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.not.objectContaining({ isReserve: true })
                })
            );
        });

        it('should not set if usingGenerations and generation is reserve', async () => {
            prismaUniformFindUniqueOrThrow.mockResolvedValue({
                ...uniformBase,
                type: { usingGenerations: true },
                generation: { isReserve: true },
            });

            const result = await addUniform(defaultProps);
            expect(result).toBe("unitsWithUniformItems");
            expect(prismaUniformUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.not.objectContaining({ isReserve: true })
                })
            );
        });
        it('should not set if storage unit is not reserve', async () => {
            prismaStorageUnitFindUniqueOrThrow.mockResolvedValueOnce({
                ...storageUnitBase,
                isReserve: false,
            });

            const result = await addUniform(defaultProps);
            expect(result).toBe("unitsWithUniformItems");
            expect(prismaUniformUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.not.objectContaining({ isReserve: true })
                })
            );
        });
    });
});
