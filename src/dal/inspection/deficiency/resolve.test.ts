import dayjs from "@/lib/dayjs";
import { resolve } from "./resolve";
import { prismaMock } from '@test-utils/prisma-mock';


describe('resolveDeficiency', () => {
    const mockPrisma = prismaMock;
    const date = new Date();
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(date);
        mockPrisma.deficiency.update.mockResolvedValue(undefined as any);
        mockPrisma.deficiency.findFirst.mockResolvedValue(null);
        mockPrisma.inspection.findFirst.mockResolvedValue(null);
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('resolves the deficiency', async () => {
        const result = resolve('5f09250d-23cb-45f8-a7d0-d0f6d3896f34');
        await expect(result).resolves.toBeUndefined();

        expect(mockPrisma.deficiency.update).toHaveBeenCalledWith({
            where: {
                id: '5f09250d-23cb-45f8-a7d0-d0f6d3896f34',
            },
            data: {
                dateResolved: date,
                userResolved: 'testuser',
                fk_inspection_resolved: undefined,
            },
        });
    });

    it('throws exception if deficiency already resolved', async () => {
        mockPrisma.deficiency.findFirst.mockResolvedValueOnce({
            id: '5f09250d-23cb-45f8-a7d0-d0f6d3896f34',
            dateResolved: date,
        } as any);

        const result = resolve('5f09250d-23cb-45f8-a7d0-d0f6d3896f34');
        await expect(result).rejects.toThrow("Deficiency already resolved");

        expect(mockPrisma.deficiency.update).not.toHaveBeenCalled();
        expect(mockPrisma.deficiency.findFirst).toHaveBeenCalledWith({
            where: {
                id: '5f09250d-23cb-45f8-a7d0-d0f6d3896f34',
                dateResolved: { not: null }
            }
        });
    });

    it('connects active inspection to deficiency', async () => {
        mockPrisma.inspection.findFirst.mockResolvedValueOnce({ id: '0177f740-75ee-4bb8-9875-7f10e3e6af8b' } as any);

        const result = resolve('5f09250d-23cb-45f8-a7d0-d0f6d3896f34');
        await expect(result).resolves.toBeUndefined();

        expect(mockPrisma.inspection.findFirst).toHaveBeenCalledWith({
            where: {
                organisationId: 'test-organisation-id',
                date: dayjs(date).format("YYYY-MM-DD"),
                timeStart: { not: null },
                timeEnd: null,
            }
        });

        expect(mockPrisma.deficiency.update).toHaveBeenCalledWith({
            where: {
                id: '5f09250d-23cb-45f8-a7d0-d0f6d3896f34',
            },
            data: {
                dateResolved: date,
                userResolved: 'testuser',
                fk_inspection_resolved: '0177f740-75ee-4bb8-9875-7f10e3e6af8b',
            },
        });
    });
});
