
import { updateDeficiency } from "./update";
import { prismaMock } from '@test-utils/prisma-mock';

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

    it('blocks description update when type has cadet+material relation', async () => {
        prismaMock.deficiency.findFirst.mockResolvedValueOnce({
            id: deficiencyId,
            type: { dependent: 'cadet', relation: 'material' },
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

    it('blocks description update when type has uniform dependency', async () => {
        prismaMock.deficiency.findFirst.mockResolvedValueOnce({
            id: deficiencyId,
            type: { dependent: 'uniform', relation: null },
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
