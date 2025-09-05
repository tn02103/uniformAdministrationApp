import { create } from "./create";
import { prisma } from "@/lib/db";

jest.mock('@/lib/db', () => ({
    prisma: {
        storageUnit: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        organisation: {
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
        Promise.resolve([{ organisation: 'test-organisation' }, props])
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

    const prismafindFirst = prisma.storageUnit.findFirst as jest.Mock;
    const prismaCreate = prisma.storageUnit.create as jest.Mock;
    const getUnitsWithUniformItems = jest.requireMock("./get").__unsecuredGetUnitsWithUniformItems as jest.Mock;

    it('should create storage unit', async () => {
        prismafindFirst.mockResolvedValueOnce(null);
        prismaCreate.mockResolvedValueOnce({ ...testUnit });
        getUnitsWithUniformItems.mockResolvedValueOnce([
            { ...testUnit }
        ]);

        const result = await create(testUnit);
        expect(result).toEqual([
            expect.objectContaining(testUnit)
        ]);
        expect(prismafindFirst).toHaveBeenCalledWith({
            where: { organisationId: 'test-organisation', name: testUnit.name }
        });
        expect(prismaCreate).toHaveBeenCalledWith({
            data: {
                organisationId: 'test-organisation',
                ...testUnit,
            }
        });
        expect(getUnitsWithUniformItems).toHaveBeenCalledWith('test-organisation', prisma);
    });

    it('throws soft error if name is duplicated', async () => {
        prismafindFirst.mockResolvedValueOnce(
            { name: 'Kiste 01', description: '', capacity: 1, isReserve: false }
        );
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
        prismafindFirst.mockResolvedValueOnce(null);
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


