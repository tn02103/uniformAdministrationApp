import { prisma } from "@/lib/db";
import { uniformTypeArgs } from "@/types/globalUniformTypes";
import { __unsecuredGetUniformTypeList, getList, getType } from "./get";

describe('<UniformType> get', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockFindUnique = prisma.uniformType.findUnique as jest.Mock;
    const mockFindMany = prisma.uniformType.findMany as jest.Mock;

    describe('getType', () => {
        it('should return uniform type by id', async () => {
            const mockUniformType = {
                id: 'test-id-123',
                name: 'Test Uniform Type',
                acronym: 'TUT',
                organisationId: 'test-organisation-id',
            };

            mockFindUnique.mockResolvedValue(mockUniformType);

            const result = await getType('test-id-123');

            expect(result).toEqual(mockUniformType);
            expect(mockFindUnique).toHaveBeenCalledWith({
                where: {
                    id: 'test-id-123',
                    organisationId: 'test-organisation-id',
                    recdelete: null
                },
                select: expect.any(Object)
            });
        });

        it('should return null if uniform type not found', async () => {
            mockFindUnique.mockResolvedValue(null);

            const result = await getType('non-existent-id');

            expect(result).toBeNull();
            expect(mockFindUnique).toHaveBeenCalledWith({
                where: {
                    id: 'non-existent-id',
                    organisationId: 'test-organisation-id',
                    recdelete: null
                },
                select: expect.any(Object)
            });
        });
    });

    describe('getList', () => {
        it('should return list of uniform types', async () => {
            const mockUniformTypes = [
                { id: '1', name: 'Type 1', acronym: 'T1', sortOrder: 1 },
                { id: '2', name: 'Type 2', acronym: 'T2', sortOrder: 2 },
            ];

            mockFindMany.mockResolvedValue(mockUniformTypes);

            const result = await getList();

            expect(result).toEqual(mockUniformTypes);
            expect(mockFindMany).toHaveBeenCalledWith({
                where: { organisationId: 'test-organisation-id', recdelete: null },
                orderBy: { sortOrder: "asc" },
                select: expect.any(Object)
            });
        });

        it('should return empty array if no types found', async () => {
            mockFindMany.mockResolvedValue([]);

            const result = await getList();

            expect(result).toEqual([]);
        });
    });

    describe('__unsecuredGetUniformTypeList', () => {
        it('should return uniform types for given association', async () => {
            const mockUniformTypes = [
                { id: '1', name: 'Type 1', sortOrder: 1 },
            ];

            mockFindMany.mockResolvedValue(mockUniformTypes);

            const result = await __unsecuredGetUniformTypeList('test-assoc');

            expect(result).toEqual(mockUniformTypes);
            expect(mockFindMany).toHaveBeenCalledWith({
                where: { organisationId: 'test-assoc', recdelete: null },
                orderBy: { sortOrder: "asc" },
                select: uniformTypeArgs.select,
            });
        });
    });
});
