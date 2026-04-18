import dayjs from "@/lib/dayjs";
import { createUniformDef, createDeficiency } from "./create";
import { prismaMock } from '@test-utils/prisma-mock';

describe('createUniformDeficiency', () => {
    const date = new Date();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(date);
        prismaMock.deficiencyType.findUnique.mockResolvedValue({
            id: 'typeId',
            dependent: 'uniform',
        } as any);
        prismaMock.uniform.findUnique.mockResolvedValue({
            id: '00aceba0-b8db-4d10-9312-049de35c7b3a',
            type: { name: 'UniformType', id: 'typeId' },
            number: '123',
        } as any);
        prismaMock.inspection.findFirst.mockResolvedValue(null);
        prismaMock.deficiency.create.mockResolvedValue(undefined as any);
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
        expect(prismaMock.deficiency.create).toHaveBeenCalledWith({
            data: {
                fk_deficiencyType: '37d06077-f678-45d0-8494-75056c61b0ce',
                comment: 'New comment',
                description: 'UniformType-123',
                userCreated: 'testuser',
                dateCreated: date,
                userUpdated: 'testuser',
                dateUpdated: date,
                fk_inspection_created: undefined,
                fk_uniform: '00aceba0-b8db-4d10-9312-049de35c7b3a',
            },
        });
        expect(prismaMock.uniform.findUnique).toHaveBeenCalledWith({
            where: { id: '00aceba0-b8db-4d10-9312-049de35c7b3a' },
            include: { type: true },
        });
        expect(prismaMock.deficiencyType.findUnique).toHaveBeenCalledWith({
            where: { id: '37d06077-f678-45d0-8494-75056c61b0ce' },
        });
    });

    it('throws exception if deficiency type not found', async () => {
        prismaMock.deficiencyType.findUnique.mockResolvedValueOnce(null);

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
        prismaMock.deficiencyType.findUnique.mockResolvedValueOnce({
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
        prismaMock.inspection.findFirst.mockResolvedValueOnce({ id: '0177f740-75ee-4bb8-9875-7f10e3e6af8b' } as any);

        const result = createUniformDef({
            uniformId: '00aceba0-b8db-4d10-9312-049de35c7b3a',
            data: {
                comment: 'New comment',
                typeId: '37d06077-f678-45d0-8494-75056c61b0ce',
            },
        });
        await expect(result).resolves.toBeUndefined();

        expect(prismaMock.inspection.findFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: 'test-assosiation-id',
                date: dayjs(date).format("YYYY-MM-DD"),
                timeStart: { not: null },
                timeEnd: null,
            }
        });
        expect(prismaMock.deficiency.create).toHaveBeenCalledWith({
            data: {
                fk_deficiencyType: '37d06077-f678-45d0-8494-75056c61b0ce',
                comment: 'New comment',
                description: 'UniformType-123',
                userCreated: 'testuser',
                dateCreated: date,
                userUpdated: 'testuser',
                dateUpdated: date,
                fk_inspection_created: '0177f740-75ee-4bb8-9875-7f10e3e6af8b',
                fk_uniform: '00aceba0-b8db-4d10-9312-049de35c7b3a',
            },
        });
    });
});

describe('createDeficiency', () => {
    const date = new Date();
    const uniformTypeId = '37d06077-f678-45d0-8494-75056c61b0ce';
    const uniformId = '00aceba0-b8db-4d10-9312-049de35c7b3a';
    const cadetId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(date);
        prismaMock.deficiency.create.mockResolvedValue(undefined as any);
    });

    it('creates a deficiency for uniform-dependent type with auto-generated description', async () => {
        prismaMock.deficiencyType.findUnique.mockResolvedValueOnce({
            id: uniformTypeId,
            dependent: 'uniform',
        } as any);
        prismaMock.uniform.findUnique.mockResolvedValueOnce({
            id: uniformId,
            type: { name: 'Typ1', id: 'typeId' },
            number: '1184',
        } as any);

        const result = createDeficiency({
            typeId: uniformTypeId,
            comment: 'New comment',
            uniformId,
        });
        await expect(result).resolves.toBeUndefined();

        expect(prismaMock.deficiency.create).toHaveBeenCalledWith({
            data: {
                fk_deficiencyType: uniformTypeId,
                comment: 'New comment',
                description: 'Typ1-1184',
                userCreated: 'testuser',
                dateCreated: date,
                userUpdated: 'testuser',
                dateUpdated: date,
                fk_inspection_created: null,
                fk_uniform: uniformId,
                fk_cadet: undefined,
            },
        });
    });

    it('creates a deficiency for cadet-dependent type with provided description', async () => {
        prismaMock.deficiencyType.findUnique.mockResolvedValueOnce({
            id: uniformTypeId,
            dependent: 'cadet',
        } as any);

        const result = createDeficiency({
            typeId: uniformTypeId,
            comment: 'Cadet comment',
            description: 'Ungewaschen',
            cadetId,
        });
        await expect(result).resolves.toBeUndefined();

        expect(prismaMock.deficiency.create).toHaveBeenCalledWith({
            data: {
                fk_deficiencyType: uniformTypeId,
                comment: 'Cadet comment',
                description: 'Ungewaschen',
                userCreated: 'testuser',
                dateCreated: date,
                userUpdated: 'testuser',
                dateUpdated: date,
                fk_inspection_created: null,
                fk_uniform: undefined,
                fk_cadet: cadetId,
            },
        });
    });

    it('sets fk_inspection_created to null regardless of active inspection', async () => {
        prismaMock.deficiencyType.findUnique.mockResolvedValueOnce({
            id: uniformTypeId,
            dependent: 'uniform',
        } as any);
        prismaMock.uniform.findUnique.mockResolvedValueOnce({
            id: uniformId,
            type: { name: 'Typ1', id: 'typeId' },
            number: '1184',
        } as any);

        await createDeficiency({ typeId: uniformTypeId, comment: 'c', uniformId });

        expect(prismaMock.inspection.findFirst).not.toHaveBeenCalled();
        expect(prismaMock.deficiency.create).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ fk_inspection_created: null }) })
        );
    });

    it('throws exception if deficiency type not found', async () => {
        prismaMock.deficiencyType.findUnique.mockResolvedValueOnce(null);

        await expect(createDeficiency({ typeId: uniformTypeId, comment: 'c', uniformId }))
            .rejects.toThrow("Deficiency type not found");
    });

    it('throws exception if uniformId not provided for uniform-dependent type', async () => {
        prismaMock.deficiencyType.findUnique.mockResolvedValueOnce({
            id: uniformTypeId,
            dependent: 'uniform',
        } as any);

        await expect(createDeficiency({ typeId: uniformTypeId, comment: 'c' }))
            .rejects.toThrow("uniformId is required for uniform-dependent deficiency type");
    });

    it('throws exception if cadetId not provided for cadet-dependent type', async () => {
        prismaMock.deficiencyType.findUnique.mockResolvedValueOnce({
            id: uniformTypeId,
            dependent: 'cadet',
        } as any);

        await expect(createDeficiency({ typeId: uniformTypeId, comment: 'c' }))
            .rejects.toThrow("cadetId is required for cadet-dependent deficiency type");
    });
});
