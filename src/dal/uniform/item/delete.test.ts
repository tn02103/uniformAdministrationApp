import { deleteUniformItem } from "./_index";

describe('successfull deletion', () => {
    const mockId = "9fccd605-6a8b-4e1a-98a6-9cc627d5186d";
    const { prisma } = jest.requireMock('@/lib/db');
    const mockDate = new Date();

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(mockDate);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('marks uniformItem as deleted', async () => {
        prisma.uniform.update.mockResolvedValueOnce([]);
        await expect(deleteUniformItem(mockId)).resolves.toBeUndefined();

        expect(prisma.uniform.update).toHaveBeenCalledWith({
            where: { id: mockId },
            data: {
                recdelete: mockDate,
                recdeleteUser: 'testuser',
            },
        });
    });
    it('marks all uniformDeficiencies from item as deleted', async () => {
        await expect(deleteUniformItem(mockId)).resolves.toBeUndefined();

        expect(prisma.deficiency.updateMany).toHaveBeenCalledWith({
            where: { 
                dateResolved: null,
                uniformDeficiency: {
                    fk_uniform: mockId,
                },
             },
            data: {
                dateResolved: mockDate,
                userResolved: 'testuser',
            },
        });
    });
    it('returns item when issued', async () => {
        await expect(deleteUniformItem(mockId)).resolves.toBeUndefined();

        expect(prisma.uniformIssued.updateMany).toHaveBeenCalledWith({
            where: {
                fk_uniform: mockId,
                dateReturned: null,
            },
            data: {
                dateReturned: mockDate,
            }
        });
    });
});
