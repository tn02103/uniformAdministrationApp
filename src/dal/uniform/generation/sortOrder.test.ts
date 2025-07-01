import { changeSortOrder } from "./sortOrder";

describe('<UniformGeneration> sortOrder', () => {
    const { prisma } = jest.requireMock('@/lib/db');

    afterEach(jest.clearAllMocks);
    beforeEach(() => {
        jest.clearAllMocks();
        prisma.uniformGeneration.update.mockResolvedValue();
        prisma.uniformGeneration.findUniqueOrThrow.mockResolvedValue({ sortOrder: 2, fk_uniformType: 'typeId' });
        prisma.uniformGeneration.count.mockResolvedValue(5);
        prisma.uniformGeneration.updateMany.mockResolvedValue({ count: 2 });
        prisma.uniformType.findMany.mockResolvedValue('ReturnedList');
    });


    const prismaUpdateMany = prisma.uniformGeneration.updateMany;
    const prismaUpdate = prisma.uniformGeneration.update;

    it('should work moving up', async () => {
        prismaUpdateMany.mockResolvedValueOnce({ count: 1 });
        const result = await changeSortOrder({ id: 'SomeGenerationId', newPosition: 1 });

        expect(result).toEqual('ReturnedList');
        expect(prismaUpdate).toHaveBeenCalledTimes(1);
        expect(prismaUpdateMany).toHaveBeenCalledTimes(1);
        expect(prismaUpdate).toHaveBeenCalledWith({
            where: { id: 'SomeGenerationId' },
            data: { sortOrder: 1 }
        });
        expect(prismaUpdateMany).toHaveBeenCalledWith({
            where: {
                sortOrder: { gte: 1, lte: 1 },
                fk_uniformType: 'typeId',
                recdelete: null,
            },
            data: {
                sortOrder: { increment: 1 },
            },
        });
    });
    it('should work moving down', async () => {
        const result = await changeSortOrder({ id: 'SomeGenerationId', newPosition: 4 });

        expect(result).toEqual('ReturnedList');
        expect(prismaUpdate).toHaveBeenCalledTimes(1);
        expect(prismaUpdateMany).toHaveBeenCalledTimes(1);
        expect(prismaUpdate).toHaveBeenCalledWith({
            where: { id: 'SomeGenerationId' },
            data: { sortOrder: 4 }
        });
        expect(prismaUpdateMany).toHaveBeenCalledWith({
            where: {
                sortOrder: { gte: 3, lte: 4 },
                fk_uniformType: 'typeId',
                recdelete: null
            },
            data: {
                sortOrder: { decrement: 1 }
            }
        });
    });
    it('should not allow negativ position', async () => {
        const result = changeSortOrder({ id: 'SomeGenerationId', newPosition: -1 })
        await expect(result).rejects.toThrow('Invalid newPosition');
        expect(prismaUpdate).not.toHaveBeenCalled();
        expect(prismaUpdateMany).not.toHaveBeenCalled();
    });
    it('should allow zero position', async () => {
        const result = await changeSortOrder({ id: 'SomeGenerationId', newPosition: 0 });
        expect(result).toEqual('ReturnedList');
    });
    it('should not allow position greater/ equal than amount of types', async () => {
        const result = changeSortOrder({ id: 'SomeGenerationId', newPosition: 5 });
        await expect(result).rejects.toThrow('Invalid newPosition');

        expect(prismaUpdate).not.toHaveBeenCalled();
        expect(prismaUpdateMany).not.toHaveBeenCalled();
    });
    it('should allow last position in list', async () => {
        const result = await changeSortOrder({ id: 'SomeGenerationId', newPosition: 4 })
        expect(result).toEqual('ReturnedList');
        expect(prismaUpdate).toHaveBeenCalledTimes(1);
        expect(prismaUpdateMany).toHaveBeenCalledTimes(1);
    });
    it('should fail if updateMany returns smaller count', async () => {
        prisma.uniformGeneration.count.mockResolvedValue(10);
        const result = changeSortOrder({ id: 'SomeGenerationId', newPosition: 5 });
        await expect(result).rejects.toThrow('Could not update sortOrder of other types');
        expect(prismaUpdate).not.toHaveBeenCalled();
    });
    it('should fail if updateMany returns bigger count', async () => {
        const result = changeSortOrder({ id: 'SomeGenerationId', newPosition: 1 });
        await expect(result).rejects.toThrow('Could not update sortOrder of other types');
        expect(prismaUpdate).not.toHaveBeenCalled();
    });
});
