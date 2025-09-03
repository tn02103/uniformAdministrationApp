import dayjs from "@/lib/dayjs";
import { resolve } from "./resolve";


jest.mock('@/lib/db', () => ({
    prisma: {
        deficiency: {
            update: jest.fn(),
            findFirst: jest.fn(),
            findUniqueOrThrow: jest.fn(),
        },
        inspection: {
            findFirst: jest.fn(),
        }
    },
}));

describe('resolveDeficiency', () => {
    const { prisma } = jest.requireMock('@/lib/db');
    const date = new Date();
    beforeAll(() => {
        global.__ASSOSIATION__ = 'fk_assoasiation';
    })
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(date);
    })
    afterEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => global.__ASSOSIATION__ = undefined)

    it('resolves the deficiency', async () => {
        prisma.inspection.findFirst.mockResolvedValueOnce(null);
        prisma.deficiency.findFirst.mockResolvedValueOnce(null);

        const result = resolve('5f09250d-23cb-45f8-a7d0-d0f6d3896f34');
        await expect(result).resolves.toBeUndefined();

        expect(prisma.deficiency.update).toHaveBeenCalledWith({
            where: {
                id: '5f09250d-23cb-45f8-a7d0-d0f6d3896f34',
            },
            data: {
                dateResolved: date,
                userResolved: 'mana',
                fk_inspection_resolved: undefined,
            },
        });
    });

    it('throws exception if deficiency already resolved', async () => {
        prisma.inspection.findFirst.mockResolvedValueOnce(null);
        prisma.deficiency.findFirst.mockResolvedValueOnce({
            id: '5f09250d-23cb-45f8-a7d0-d0f6d3896f34',
            dateResolved: date,
        });

        const result = resolve('5f09250d-23cb-45f8-a7d0-d0f6d3896f34');
        await expect(result).rejects.toThrow("Deficiency already resolved");

        expect(prisma.deficiency.update).not.toHaveBeenCalled();
        expect(prisma.deficiency.findFirst).toHaveBeenCalledWith({
            where: {
                id: '5f09250d-23cb-45f8-a7d0-d0f6d3896f34',
                dateResolved: { not: null }
            }
        });
    });

    it('connects active inspection to deficiency', async () => {
        prisma.inspection.findFirst.mockResolvedValueOnce({ id: '0177f740-75ee-4bb8-9875-7f10e3e6af8b' });
        prisma.deficiency.findFirst.mockResolvedValueOnce(null);

        const result = resolve('5f09250d-23cb-45f8-a7d0-d0f6d3896f34');
        await expect(result).resolves.toBeUndefined();

        expect(prisma.inspection.findFirst).toHaveBeenCalledWith({
            where: {
                organisationId: 'fk_assoasiation',
                date: dayjs(date).format("YYYY-MM-DD"),
                timeStart: { not: null },
                timeEnd: null,
            }
        });

        expect(prisma.deficiency.update).toHaveBeenCalledWith({
            where: {
                id: '5f09250d-23cb-45f8-a7d0-d0f6d3896f34',
            },
            data: {
                dateResolved: date,
                userResolved: 'mana',
                fk_inspection_resolved: '0177f740-75ee-4bb8-9875-7f10e3e6af8b',
            },
        });
    });
});
