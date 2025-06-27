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
            findUniqueOrThrow: jest.fn(async () => ({ sortOrder: 2, fk_uniformType: 'typeId' })),
            count: jest.fn(async () => { }),
            updateMany: jest.fn(async () => ({ count: 2 })),
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

    const prismaUpdateMany = prisma.uniformType.updateMany as jest.Mock;
    const prismaUpdate = prisma.uniformType.update as jest.Mock;
    const prismaCount = prisma.uniformType.count as jest.Mock;

    it('should not allow negativ position', async () => {
        const result = changeSortOrder({ typeId: 'SomeTypeId', newPosition: -1 })
        await expect(result).rejects.toThrow('Invalid newPosition');
        expect(prismaUpdate).not.toHaveBeenCalled();
        expect(prismaUpdateMany).not.toHaveBeenCalled();
    });
    it('should work moving up', async () => {
        prismaUpdateMany.mockReturnValueOnce(new Promise((resolve) => resolve({ count: 1 })));
        const result = await changeSortOrder({ typeId: 'SomeTypeId', newPosition: 1 });

        expect(result).toEqual('ReturnedList');
        expect(prismaUpdate).toHaveBeenCalledTimes(1);
        expect(prismaUpdateMany).toHaveBeenCalledTimes(1);
        expect(prismaUpdate).toHaveBeenCalledWith({
            where: { id: 'SomeTypeId' },
            data: { sortOrder: 1 }
        });
        expect(prismaUpdateMany).toHaveBeenCalledWith({
            where: {
                sortOrder: { gte: 1, lte: 1 },
                fk_assosiation: '1',
                recdelete: null
            },
            data: {
                sortOrder: { increment: 1 }
            }
        });
    });
    it('should work moving down', async () => {
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
        const result = await changeSortOrder({ typeId: 'SomeTypeId', newPosition: 0 });
        expect(result).toEqual('ReturnedList');
    });
    it('should not allow position greater/ equal than amount of types', async () => {
        prismaCount.mockResolvedValueOnce(4);
        const result = changeSortOrder({ typeId: 'SomeTypeId', newPosition: 4 });
        await expect(result).rejects.toThrow('Invalid newPosition');

        expect(prismaUpdate).not.toHaveBeenCalled();
        expect(prismaUpdateMany).not.toHaveBeenCalled();
    });
    it('should allow last position in list', async () => {
        prismaCount.mockResolvedValueOnce(5);
        const result = await  changeSortOrder({ typeId: 'SomeTypeId', newPosition: 4 })
        expect(result).toEqual('ReturnedList');
        expect(prismaUpdate).toHaveBeenCalledTimes(1);
        expect(prismaUpdateMany).toHaveBeenCalledTimes(1);
    });
    it('should fail if updateMany returns smaller count', async () => {
        const result = changeSortOrder({ typeId: 'SomeTypeId', newPosition: 5 });
        await expect(result).rejects.toThrow('Could not update sortOrder of other types');
        expect(prismaUpdate).not.toHaveBeenCalled();
    });
    it('should fail if updateMany returns bigger count', async () => {
        const result = changeSortOrder({ typeId: 'SomeTypeId', newPosition: 3 });
        await expect(result).rejects.toThrow('Could not update sortOrder of other types');
        expect(prismaUpdate).not.toHaveBeenCalled();
    });
});