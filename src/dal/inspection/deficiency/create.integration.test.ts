import dayjs from "@/lib/dayjs";
import { createUniformDef } from "./create";

jest.mock('@/lib/db', () => ({
    prisma: {
        deficiency: {
            create: jest.fn(),
        },
        deficiencyType: {
            findUnique: jest.fn(async () => ({
                id: 'typeId',
                dependent: 'uniform',
            })),
            findUniqueOrThrow: jest.fn(),
        },
        inspection: {
            findFirst: jest.fn(),
        },
        uniform: {
            findUnique: jest.fn(async () => ({
                id: '00aceba0-b8db-4d10-9312-049de35c7b3a',
                type: { name: 'UniformType', id: 'typeId' },
                number: '123',
            })),
            findUniqueOrThrow: jest.fn(),
        },
    },
}));
describe('createUniformDeficiency', () => {
    const { prisma } = jest.requireMock('@/lib/db');
    const date = new Date();
    beforeAll(() => {
        global.__ORGANISATION__ = 'fk_assoasiation';
    });
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(date);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => global.__ORGANISATION__ = undefined);

    it('creates a deficiency', async () => {
        // Call the function with the mock data
        const result = createUniformDef({
            uniformId: '00aceba0-b8db-4d10-9312-049de35c7b3a',
            data: {
                comment: 'New comment',
                typeId: '37d06077-f678-45d0-8494-75056c61b0ce',
            },
        });
        await expect(result).resolves.toBeUndefined();

        // validate the prisma calls
        expect(prisma.deficiency.create).toHaveBeenCalledWith({
            data: {
                fk_deficiencyType: '37d06077-f678-45d0-8494-75056c61b0ce',
                comment: 'New comment',
                description: 'UniformType-123',
                userCreated: 'mana',
                dateCreated: date,
                userUpdated: 'mana',
                dateUpdated: date,
                fk_inspection_created: undefined,
                uniformDeficiency: {
                    create: {
                        fk_uniform: '00aceba0-b8db-4d10-9312-049de35c7b3a',
                    }
                }
            },
        });
        expect(prisma.uniform.findUnique).toHaveBeenCalledWith({
            where: { id: '00aceba0-b8db-4d10-9312-049de35c7b3a' },
            include: { type: true },
        });
        expect(prisma.deficiencyType.findUnique).toHaveBeenCalledWith({
            where: { id: '37d06077-f678-45d0-8494-75056c61b0ce' },
        });
    });

    it('throws exception if deficiency type not found', async () => {
        prisma.deficiencyType.findUnique.mockResolvedValueOnce(null);

        const result = createUniformDef({
            uniformId: '00aceba0-b8db-4d10-9312-049de35c7b3a',
            data: {
                comment: 'New comment',
                typeId: '37d06077-f678-45d0-8494-75056c61b0ce',
            },
        });
        await expect(result).rejects.toThrow("Deficiency type not found");
    });
    it('throws exception if deficiency type is not uniform dependent', async () => {
        prisma.deficiencyType.findUnique.mockResolvedValueOnce({
            id: '36ad6161-b0b6-42ab-8013-24aa377e600b',
            dependent: 'cadet',
        });

        const result = createUniformDef({
            uniformId: '00aceba0-b8db-4d10-9312-049de35c7b3a',
            data: {
                comment: 'New comment',
                typeId: '37d06077-f678-45d0-8494-75056c61b0ce',
            },
        });
        await expect(result).rejects.toThrow("Deficiency type is not uniform dependent");
    });

    it('connects active inspection to deficiency', async () => {
        prisma.inspection.findFirst.mockResolvedValueOnce({ id: '0177f740-75ee-4bb8-9875-7f10e3e6af8b' });

        const result = createUniformDef({
            uniformId: '00aceba0-b8db-4d10-9312-049de35c7b3a',
            data: {
                comment: 'New comment',
                typeId: '37d06077-f678-45d0-8494-75056c61b0ce',
            },
        });
        await expect(result).resolves.toBeUndefined();

        expect(prisma.inspection.findFirst).toHaveBeenCalledWith({
            where: {
                organisationId: 'fk_assoasiation',
                date: dayjs(date).format("YYYY-MM-DD"),
                timeStart: { not: null },
                timeEnd: null,
            }
        });
        expect(prisma.deficiency.create).toHaveBeenCalledWith({
            data: {
                fk_deficiencyType: '37d06077-f678-45d0-8494-75056c61b0ce',
                comment: 'New comment',
                description: 'UniformType-123',
                userCreated: 'mana',
                dateCreated: date,
                userUpdated: 'mana',
                dateUpdated: date,
                fk_inspection_created: '0177f740-75ee-4bb8-9875-7f10e3e6af8b',
                uniformDeficiency: {
                    create: {
                        fk_uniform: '00aceba0-b8db-4d10-9312-049de35c7b3a',
                    },
                },
            },
        });
    });
});
