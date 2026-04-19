
import { updateUniform, updateDeficiency } from "./update";
import { prismaMock } from '@test-utils/prisma-mock';

describe('updateUniformDeficiency', () => {
    const date = new Date();
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(date);
        prismaMock.deficiency.update.mockResolvedValue(undefined);
    })
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('updates the deficiency', async () => {
        prismaMock.deficiencyType.findFirst.mockResolvedValueOnce({
            id: 'typeId',
            dependent: 'uniform',
        });

        const result = updateUniform({
            id: '5f09250d-23cb-45f8-a7d0-d0f6d3896f34',
            data: {
                comment: 'Updated comment',
                typeId: '37d06077-f678-45d0-8494-75056c61b0ce',
            },
        });
        await expect(result).resolves.toBeUndefined();

        expect(prismaMock.deficiencyType.findFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ fk_assosiation: 'test-assosiation-id' }),
        }));
        expect(prismaMock.deficiency.update).toHaveBeenCalledWith({
            where: {
                id: '5f09250d-23cb-45f8-a7d0-d0f6d3896f34',
                type: { fk_assosiation: 'test-assosiation-id' },
            },
            data: {
                comment: 'Updated comment',
                fk_deficiencyType: '37d06077-f678-45d0-8494-75056c61b0ce',
                userUpdated: 'testuser',
                dateUpdated: date,
            },
        });
    });

    it('throws exception if dependend is not uniform', async () => {
        prismaMock.deficiencyType.findFirst.mockResolvedValueOnce({
            id: 'typeId',
            dependent: 'cadet',
        });

        await expect(updateUniform({
            id: 'ac41027d-b9aa-4dbf-b797-ff5f71c524a9',
            data: {
                comment: 'Updated comment',
                typeId: '654d9dd9-60dc-4cc2-810f-0b1ac17351af',
            },
        })).rejects.toThrow('Deficiency type is not uniform dependent');
    });
});

describe('updateDeficiency', () => {
    const date = new Date();
    const deficiencyId = '5f09250d-23cb-45f8-a7d0-d0f6d3896f34';

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(date);
        prismaMock.deficiency.update.mockResolvedValue(undefined as any);
        // Default: cadet type with null relation — canUpdateDescription is true
        prismaMock.deficiency.findFirst.mockResolvedValue({
            id: deficiencyId,
            type: { dependent: 'cadet', relation: null },
        } as any);
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('updates comment and description', async () => {
        await expect(updateDeficiency({
            id: deficiencyId,
            data: { comment: 'Updated comment', description: 'New desc' },
        })).resolves.toBeUndefined();

        expect(prismaMock.deficiency.findFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                type: expect.objectContaining({ fk_assosiation: 'test-assosiation-id' }),
            }),
        }));
        expect(prismaMock.deficiency.update).toHaveBeenCalledWith({
            where: { id: deficiencyId, type: { fk_assosiation: 'test-assosiation-id' } },
            data: {
                description: 'New desc',
                comment: 'Updated comment',
                userUpdated: 'testuser',
                dateUpdated: date,
            },
        });
    });

    it('updates only comment when description is not provided', async () => {
        await expect(updateDeficiency({
            id: deficiencyId,
            data: { comment: 'Only comment' },
        })).resolves.toBeUndefined();

        const callArg = prismaMock.deficiency.update.mock.calls[0][0];
        expect(callArg.data).not.toHaveProperty('description');
        expect(callArg.data).toEqual({
            comment: 'Only comment',
            userUpdated: 'testuser',
            dateUpdated: date,
        });
    });

    it('does not change typeId, uniformId or cadetId', async () => {
        await updateDeficiency({
            id: deficiencyId,
            data: { comment: 'c', description: 'd' },
        });

        const callArg = prismaMock.deficiency.update.mock.calls[0][0];
        expect(callArg.data).not.toHaveProperty('fk_deficiencyType');
        expect(callArg.data).not.toHaveProperty('fk_uniform');
        expect(callArg.data).not.toHaveProperty('fk_cadet');
    });

    it('blocks description update when type has cadet+uniform relation', async () => {
        prismaMock.deficiency.findFirst.mockResolvedValueOnce({
            id: deficiencyId,
            type: { dependent: 'cadet', relation: 'uniform' },
        } as any);

        await expect(updateDeficiency({
            id: deficiencyId,
            data: { comment: 'comment', description: 'should be blocked' },
        })).resolves.toBeUndefined();

        const callArg = prismaMock.deficiency.update.mock.calls[0][0];
        expect(callArg.data).not.toHaveProperty('description');
        expect(callArg.data).toEqual({
            comment: 'comment',
            userUpdated: 'testuser',
            dateUpdated: date,
        });
    });
});
