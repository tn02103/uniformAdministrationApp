import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { changeSortOrder } from "./sortOrder";

beforeAll(() => {
    global.__ASSOSIATION__ = '1';
    global.__ROLE__ = AuthRole.admin;
});
afterAll(() => {
    global.__ASSOSIATION__ = undefined;
    global.__ROLE__ = undefined;
});

jest.mock('@/lib/db', () => ({
    prisma: {
        uniformType: {
            update: jest.fn(),
            findUniqueOrThrow: jest.fn(),
            count: jest.fn(),
            updateMany: jest.fn(),
            findMany: jest.fn(() => 'ReturnedList'),
        },
        $transaction: jest.fn((func) => func(prisma)),
    }
}));
jest.mock("@/actions/validations", () => ({
    genericSAValidator: jest.fn((_, props) => Promise.resolve([{ assosiation: '1' }, props])),
}));
describe('<UniformType> sortOrder', () => {
    afterEach(jest.clearAllMocks);

    const prismafindUnique = prisma.uniformType.findUniqueOrThrow as jest.Mock;
    const prismaUpdateMany = prisma.uniformType.updateMany as jest.Mock;
    const prismaUpdate = prisma.uniformType.update as jest.Mock;
    const prismaCount = prisma.uniformType.count as jest.Mock;

    it('should not allow negativ position', async () => {
        prismafindUnique.mockResolvedValue({ sortOrder: 1 });
        prismaCount.mockResolvedValue(4);

        const result = changeSortOrder({ typeId: 'SomeTypeId', newPosition: -1 })
        await expect(result).rejects.toThrow('Invalid newPosition');
        expect(prismaUpdate).not.toHaveBeenCalled();
        expect(prismaUpdateMany).not.toHaveBeenCalled();
    });
    it('should work moving up', async () => {
        prismafindUnique.mockResolvedValue({ sortOrder: 4 });
        prismaCount.mockResolvedValue(6);
        prismaUpdateMany.mockResolvedValue({ count: 2 });
        const result = await changeSortOrder({ typeId: 'SomeTypeId', newPosition: 2 });

        expect(result).toEqual('ReturnedList');
        expect(prismaUpdate).toHaveBeenCalledTimes(1);
        expect(prismaUpdateMany).toHaveBeenCalledTimes(1);
        expect(prismaUpdate).toHaveBeenCalledWith({
            where: { id: 'SomeTypeId' },
            data: { sortOrder: 2 }
        });
        expect(prismaUpdateMany).toHaveBeenCalledWith({
            where: {
                sortOrder: { gte: 2, lte: 3 },
                fk_assosiation: '1',
                recdelete: null
            },
            data: {
                sortOrder: { increment: 1 }
            }
        });
    });
    it('should work moving down', async () => {
        prismafindUnique.mockResolvedValue({ sortOrder: 2 });
        prismaCount.mockResolvedValue(6);
        prismaUpdateMany.mockResolvedValue({ count: 2 });
        const result = await changeSortOrder({ typeId: 'SomeTypeId', newPosition: 4 });

        expect(result).toEqual('ReturnedList');
        expect(prismaUpdate).toHaveBeenCalledTimes(1);
        expect(prismaUpdateMany).toHaveBeenCalledTimes(1);
        expect(prismaUpdate).toHaveBeenCalledWith({
            where: { id: 'SomeTypeId' },
            data: { sortOrder: 4 }
        });
        expect(prismaUpdateMany).toHaveBeenCalledWith({
            where: {
                sortOrder: { gte: 3, lte: 4 },
                fk_assosiation: '1',
                recdelete: null
            },
            data: {
                sortOrder: { decrement: 1 }
            }
        });
    });
    it('should allow zero position', async () => {
        prismafindUnique.mockResolvedValue({ sortOrder: 2 });
        prismaCount.mockResolvedValue(4);
        prismaUpdateMany.mockResolvedValue({ count: 2 });
        const result = await changeSortOrder({ typeId: 'SomeTypeId', newPosition: 0 });
        expect(result).toEqual('ReturnedList');
    });
    it('should not allow position greater/ equal than amount of types', async () => {
        prismafindUnique.mockResolvedValue({ sortOrder: 1 });
        prismaCount.mockResolvedValue(4);
        prismaUpdateMany.mockResolvedValue({ count: 2 });
        const result = changeSortOrder({ typeId: 'SomeTypeId', newPosition: 5 });
        expect(result).rejects.toThrow('Invalid newPosition');

        expect(prismaUpdate).not.toHaveBeenCalled();
        expect(prismaUpdateMany).not.toHaveBeenCalled();
    });
    it('should allow last position in list', async () => {
        prismafindUnique.mockResolvedValue({ sortOrder: 1 });
        prismaCount.mockResolvedValue(4);
        prismaUpdateMany.mockResolvedValue({ count: 2 });
        const result = await  changeSortOrder({ typeId: 'SomeTypeId', newPosition: 3 })
        expect(result).toEqual('ReturnedList');
        expect(prismaUpdate).toHaveBeenCalledTimes(1);
        expect(prismaUpdateMany).toHaveBeenCalledTimes(1);
    });
    it('should fail if updateMany returns smaller count', async () => {
        prismafindUnique.mockResolvedValue({ sortOrder: 0 });
        prismaCount.mockResolvedValue(4);
        prismaUpdateMany.mockResolvedValue({ count: 1 });
        const result = changeSortOrder({ typeId: 'SomeTypeId', newPosition: 2 });
        await expect(result).rejects.toThrow('Could not update sortOrder of other types');
        expect(prismaUpdate).not.toHaveBeenCalled();
    });
    it('should fail if updateMany returns bigger count', async () => {
        prismafindUnique.mockResolvedValue({ sortOrder: 0 });
        prismaCount.mockResolvedValue(4);
        prismaUpdateMany.mockResolvedValue({ count: 3 });
        const result = changeSortOrder({ typeId: 'SomeTypeId', newPosition: 2 });
        await expect(result).rejects.toThrow('Could not update sortOrder of other types');
        expect(prismaUpdate).not.toHaveBeenCalled();
    });
});