import dayjs from "@/lib/dayjs";
import { resolve } from "./resolve";
import { prismaMock } from '@test-utils/prisma-mock';


describe('resolveDeficiency', () => {
    const date = new Date();

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(date);
        prismaMock.deficiency.update.mockResolvedValue(undefined as any);
        prismaMock.deficiency.findFirst.mockResolvedValue(null);
        prismaMock.inspection.findFirst.mockResolvedValue(null);
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('resolves the deficiency', async () => {
        const result = resolve('5f09250d-23cb-45f8-a7d0-d0f6d3896f34');
        await expect(result).resolves.toBeUndefined();

        expect(prismaMock.deficiency.update).toHaveBeenCalledWith({
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
        prismaMock.deficiency.findFirst.mockResolvedValueOnce({
            id: '5f09250d-23cb-45f8-a7d0-d0f6d3896f34',
            dateResolved: date,
        } as any);

        const result = resolve('5f09250d-23cb-45f8-a7d0-d0f6d3896f34');
        await expect(result).rejects.toThrow("Deficiency already resolved");

        expect(prismaMock.deficiency.update).not.toHaveBeenCalled();
        expect(prismaMock.deficiency.findFirst).toHaveBeenCalledWith({
            where: {
                id: '5f09250d-23cb-45f8-a7d0-d0f6d3896f34',
                dateResolved: { not: null }
            }
        });
    });

    it('connects active inspection to deficiency', async () => {
        prismaMock.inspection.findFirst.mockResolvedValueOnce({ id: '0177f740-75ee-4bb8-9875-7f10e3e6af8b' } as any);

        const result = resolve('5f09250d-23cb-45f8-a7d0-d0f6d3896f34');
        await expect(result).resolves.toBeUndefined();

        expect(prismaMock.inspection.findFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: 'test-assosiation-id',
                date: dayjs(date).format("YYYY-MM-DD"),
                timeStart: { not: null },
                timeEnd: null,
            }
        });

        expect(prismaMock.deficiency.update).toHaveBeenCalledWith({
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
