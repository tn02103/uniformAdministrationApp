
import { prismaMock } from '@test-utils/prisma-mock';
import { __unsecuredGetUniformTypeList } from "./get";
import { changeSortOrder } from "./sortOrder";


vi.mock("./get", () => ({
    __unsecuredGetUniformTypeList: vi.fn(() => Promise.resolve('ReturnedList')),
}));

describe('<UniformType> sortOrder', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        prismaMock.uniformType.findUniqueOrThrow.mockResolvedValue({ sortOrder: 2, fk_uniformType: '1' });
        prismaMock.uniformType.update.mockResolvedValue({ sortOrder: 1 });
        prismaMock.uniformType.updateMany.mockResolvedValue({ count: 2 });
        prismaMock.uniformType.count.mockResolvedValue({ });
    });
    afterEach(vi.clearAllMocks);
    
    afterAll(() => {
        prismaMock.uniformType.update.mockReset();
        prismaMock.uniformType.updateMany.mockReset();
        prismaMock.uniformType.count.mockReset();
    });

    it('should not allow negativ position', async () => {
        const result = changeSortOrder({ typeId: 'SomeTypeId', newPosition: -1 })
        await expect(result).rejects.toThrow('Invalid newPosition');
        expect(prismaMock.uniformType.update).not.toHaveBeenCalled();
        expect( prismaMock.uniformType.updateMany).not.toHaveBeenCalled();
    });
    it('should work moving up', async () => {
         prismaMock.uniformType.updateMany.mockResolvedValueOnce({ count: 1 });
        const result = await changeSortOrder({ typeId: 'SomeTypeId', newPosition: 1 });

        expect(result).toEqual('ReturnedList');
        expect(prismaMock.uniformType.update).toHaveBeenCalledTimes(1);
        expect( prismaMock.uniformType.updateMany).toHaveBeenCalledTimes(1);
        expect(prismaMock.uniformType.update).toHaveBeenCalledWith({
            where: { id: 'SomeTypeId' },
            data: { sortOrder: 1 }
        });
        expect( prismaMock.uniformType.updateMany).toHaveBeenCalledWith({
            where: {
                sortOrder: { gte: 1, lte: 1 },
                fk_assosiation: 'test-assosiation-id',
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
        expect(prismaMock.uniformType.update).toHaveBeenCalledTimes(1);
        expect( prismaMock.uniformType.updateMany).toHaveBeenCalledTimes(1);
        expect(prismaMock.uniformType.update).toHaveBeenCalledWith({
            where: { id: 'SomeTypeId' },
            data: { sortOrder: 4 }
        });
        expect( prismaMock.uniformType.updateMany).toHaveBeenCalledWith({
            where: {
                sortOrder: { gte: 3, lte: 4 },
                fk_assosiation: "test-assosiation-id",
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
         prismaMock.uniformType.count.mockResolvedValueOnce(4);
        const result = changeSortOrder({ typeId: 'SomeTypeId', newPosition: 4 });
        await expect(result).rejects.toThrow('Invalid newPosition');

        expect(prismaMock.uniformType.update).not.toHaveBeenCalled();
        expect( prismaMock.uniformType.updateMany).not.toHaveBeenCalled();
    });
    it('should allow last position in list', async () => {
         prismaMock.uniformType.count.mockResolvedValueOnce(5);
        const result = await  changeSortOrder({ typeId: 'SomeTypeId', newPosition: 4 })
        expect(result).toEqual('ReturnedList');
        expect(prismaMock.uniformType.update).toHaveBeenCalledTimes(1);
        expect( prismaMock.uniformType.updateMany).toHaveBeenCalledTimes(1);
    });
    it('should fail if updateMany returns smaller count', async () => {
        const result = changeSortOrder({ typeId: 'SomeTypeId', newPosition: 5 });
        await expect(result).rejects.toThrow('Could not update sortOrder of other types');
        expect(prismaMock.uniformType.update).not.toHaveBeenCalled();
    });
    it('should fail if updateMany returns bigger count', async () => {
        const result = changeSortOrder({ typeId: 'SomeTypeId', newPosition: 3 });
        await expect(result).rejects.toThrow('Could not update sortOrder of other types');
        expect(prismaMock.uniformType.update).not.toHaveBeenCalled();
    });
    it('calls __unsecuredGetUniformTypeList', async () => {
        const result = await changeSortOrder({ typeId: 'SomeTypeId', newPosition: 4 });
        
        expect(__unsecuredGetUniformTypeList).toHaveBeenCalledWith('test-assosiation-id', expect.anything());
        expect(result).toEqual('ReturnedList');
    });
});