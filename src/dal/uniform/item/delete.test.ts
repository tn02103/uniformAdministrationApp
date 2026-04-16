
import { prisma } from "@/lib/db";
import { prismaMock } from '@test-utils/prisma-mock';
import { deleteUniformItem } from "./_index";

describe('successfull deletion', () => {
    const mockDate = new Date();

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(mockDate);
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('marks uniformItem as deleted', async () => {
        const mockId = "9fccd605-6a8b-4e1a-98a6-9cc627d5186d";
        prismaMock.uniform.update.mockResolvedValueOnce([]);
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
        const mockId = "9fccd605-6a8b-4e1a-98a6-9cc627d5186d";
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
        const mockId = "9fccd605-6a8b-4e1a-98a6-9cc627d5186d";
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
