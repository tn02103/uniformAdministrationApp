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
        Promise.resolve([{ assosiation: '1' }, props])
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
    active: true,
    storageUnit: null,
    issuedEntries: [],
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

    it("should add uniform to storage unit and return updated units", async () => {
        prismaUniformFindUniqueOrThrow.mockResolvedValueOnce({
            ...uniformBase,
            storageUnit: null,
            issuedEntries: [],
        });
        prismaStorageUnitFindUniqueOrThrow.mockResolvedValueOnce({
            ...storageUnitBase,
            isReserve: false,
        });
        prismaUniformUpdate.mockResolvedValueOnce({});

        const result = await addUniform(defaultProps);
        expect(prismaUniformFindUniqueOrThrow).toHaveBeenCalledWith({
            where: { id: defaultProps.uniformId },
            include: {
                issuedEntries: { where: { dateReturned: null }, include: { cadet: true } },
                storageUnit: true,
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

    it("should set active=false if storageUnit is isReserve", async () => {
        prismaUniformFindUniqueOrThrow.mockResolvedValueOnce({
            ...uniformBase,
            storageUnit: null,
            issuedEntries: [],
            active: true,
        });
        prismaStorageUnitFindUniqueOrThrow.mockResolvedValueOnce({
            ...storageUnitBase,
            isReserve: true,
        });
        prismaUniformUpdate.mockResolvedValueOnce({});
        getUnitsWithUniformItems.mockResolvedValueOnce("unitsWithUniformItems");

        await addUniform(defaultProps);
        expect(prismaUniformUpdate).toHaveBeenCalledWith({
            where: { id: defaultProps.uniformId },
            data: { storageUnitId: defaultProps.storageUnitId, active: false }
        });
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
});
