import dayjs from "@/lib/dayjs";
import { createUniformDef } from "./create";
import { prismaMock } from '@test-utils/prisma-mock';

describe('createUniformDeficiency', () => {
    const mockPrisma = prismaMock;
    const date = new Date();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(date);
        mockPrisma.deficiencyType.findUnique.mockResolvedValue({
            id: 'typeId',
            dependent: 'uniform',
        } as any);
        mockPrisma.uniform.findUnique.mockResolvedValue({
            id: '00aceba0-b8db-4d10-9312-049de35c7b3a',
            type: { name: 'UniformType', id: 'typeId' },
            number: '123',
        } as any);
        mockPrisma.inspection.findFirst.mockResolvedValue(null);
        mockPrisma.deficiency.create.mockResolvedValue(undefined as any);
    });

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
        expect(mockPrisma.deficiency.create).toHaveBeenCalledWith({
            data: {
                fk_deficiencyType: '37d06077-f678-45d0-8494-75056c61b0ce',
                comment: 'New comment',
                description: 'UniformType-123',
                userCreated: 'testuser',
                dateCreated: date,
                userUpdated: 'testuser',
                dateUpdated: date,
                fk_inspection_created: undefined,
                uniformDeficiency: {
                    create: {
                        fk_uniform: '00aceba0-b8db-4d10-9312-049de35c7b3a',
                    }
                }
            },
        });
        expect(mockPrisma.uniform.findUnique).toHaveBeenCalledWith({
            where: { id: '00aceba0-b8db-4d10-9312-049de35c7b3a' },
            include: { type: true },
        });
        expect(mockPrisma.deficiencyType.findUnique).toHaveBeenCalledWith({
            where: { id: '37d06077-f678-45d0-8494-75056c61b0ce' },
        });
    });

    it('throws exception if deficiency type not found', async () => {
        mockPrisma.deficiencyType.findUnique.mockResolvedValueOnce(null);

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
        mockPrisma.deficiencyType.findUnique.mockResolvedValueOnce({
            id: '36ad6161-b0b6-42ab-8013-24aa377e600b',
            dependent: 'cadet',
        } as any);

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
        mockPrisma.inspection.findFirst.mockResolvedValueOnce({ id: '0177f740-75ee-4bb8-9875-7f10e3e6af8b' } as any);

        const result = createUniformDef({
            uniformId: '00aceba0-b8db-4d10-9312-049de35c7b3a',
            data: {
                comment: 'New comment',
                typeId: '37d06077-f678-45d0-8494-75056c61b0ce',
            },
        });
        await expect(result).resolves.toBeUndefined();

        expect(mockPrisma.inspection.findFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: 'test-assosiation-id',
                date: dayjs(date).format("YYYY-MM-DD"),
                timeStart: { not: null },
                timeEnd: null,
            }
        });
        expect(mockPrisma.deficiency.create).toHaveBeenCalledWith({
            data: {
                fk_deficiencyType: '37d06077-f678-45d0-8494-75056c61b0ce',
                comment: 'New comment',
                description: 'UniformType-123',
                userCreated: 'testuser',
                dateCreated: date,
                userUpdated: 'testuser',
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
