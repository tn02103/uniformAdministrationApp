import { create } from "./create";
import { prisma } from "@/lib/db";

jest.mock('@/lib/db', () => ({
    prisma: {
        storageUnit: {
            findMany: jest.fn(),
            create: jest.fn(),
        },
        assosiation: {
            create: jest.fn(),
            delete: jest.fn(),
        },
        uniformType: {
            deleteMany: jest.fn(),
        },
        $transaction: jest.fn((fn) => fn(prisma)),
    }
}));
jest.mock("@/actions/validations", () => ({
    genericSAValidator: jest.fn((_, props) =>
        Promise.resolve([{ assosiation: 'test-assosiation' }, props])
    ),
}));
jest.mock("./get", () => ({
    __unsecuredGetUnitsWithUniformItems: jest.fn(() => "unitsWithUniformItems"),
}));

const testUnit = {
    name: 'Unit1',
    description: 'For Broken uniformItems',
    capacity: 10,
    isReserve: true,
};

describe('<StorageUnit> create', () => {
    afterEach(jest.clearAllMocks);

    const prismaFindMany = prisma.storageUnit.findMany as jest.Mock;
    const prismaCreate = prisma.storageUnit.create as jest.Mock;
    const getUnitsWithUniformItems = jest.requireMock("./get").__unsecuredGetUnitsWithUniformItems as jest.Mock;

    it('should create storage unit', async () => {
        prismaFindMany.mockResolvedValueOnce([]);
        prismaCreate.mockResolvedValueOnce({ ...testUnit });
        getUnitsWithUniformItems.mockResolvedValueOnce([
            { ...testUnit }
        ]);

        const result = await create(testUnit);
        expect(result).toEqual([
            expect.objectContaining(testUnit)
        ]);
        expect(prismaFindMany).toHaveBeenCalledWith({
            where: { assosiationId: 'test-assosiation' }
        });
        expect(prismaCreate).toHaveBeenCalledWith({
            data: {
                assosiationId: 'test-assosiation',
                ...testUnit,
            }
        });
        expect(getUnitsWithUniformItems).toHaveBeenCalledWith('test-assosiation', prisma);
    });

    it('throws soft error if name is duplicated', async () => {
        prismaFindMany.mockResolvedValueOnce([
            { name: 'Kiste 01', description: '', capacity: 1, isReserve: false }
        ]);
        const result = await create({
            ...testUnit,
            name: 'Kiste 01'
        });
        expect(result).toEqual({
            error: {
                message: "custom.nameDuplication.storageUnit",
                formElement: "name",
            }
        });
        expect(prismaCreate).not.toHaveBeenCalled();
    });

    it('should work with no previous units', async () => {
        prismaFindMany.mockResolvedValueOnce([]);
        prismaCreate.mockResolvedValueOnce({ ...testUnit });
        getUnitsWithUniformItems.mockResolvedValueOnce([
            { ...testUnit }
        ]);
        const result = await create(testUnit);
        expect(result).toStrictEqual([
            expect.objectContaining(testUnit)
        ]);
        expect(prismaCreate).toHaveBeenCalled();
    });
});


