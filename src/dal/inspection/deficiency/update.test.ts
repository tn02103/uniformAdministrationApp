import { prisma } from "@/lib/db";
import { updateUniform } from "./update";

jest.mock('@/lib/db', () => ({
    prisma: {
        deficiency: {
            update: jest.fn(),
            findUnique: jest.fn(),
            findUniqueOrThrow: jest.fn(),
        },
        deficiencyType: {
            findUnique: jest.fn(),
            findUniqueOrThrow: jest.fn(),
        },
    },
}));

describe('updateUniformDeficiency', () => {
    const { prisma } = jest.requireMock('@/lib/db');
    const date = new Date();
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(date);
    })
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('it updates the deficiency', async () => {
        prisma.deficiencyType.findUnique.mockResolvedValueOnce({
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

        expect(prisma.deficiency.update).toHaveBeenCalledWith({
            where: {
                id: '5f09250d-23cb-45f8-a7d0-d0f6d3896f34',
            },
            data: {
                comment: 'Updated comment',
                fk_deficiencyType: '37d06077-f678-45d0-8494-75056c61b0ce',
                userUpdated: 'mana',
                dateUpdated: date,
            },
        });
    });

    it('throws exception if dependend is not uniform', async () => {
        prisma.deficiencyType.findUnique.mockResolvedValueOnce({
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
