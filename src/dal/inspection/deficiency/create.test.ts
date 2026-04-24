import { unsecuredGetActiveInspection } from "../state";
import { createDeficiency } from "./create";
import { prismaMock } from '@test-utils/prisma-mock';

vi.mock("../state", () => ({
    unsecuredGetActiveInspection: vi.fn(),
}));

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
        vi.mocked(unsecuredGetActiveInspection).mockResolvedValue(null);
    });

    it('creates a deficiency for cadet-dependent type with provided description', async () => {
        prismaMock.deficiencyType.findFirst.mockResolvedValueOnce({
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

    it('sets fk_inspection_created to null when no active inspection exists', async () => {
        prismaMock.deficiencyType.findFirst.mockResolvedValueOnce({
            id: uniformTypeId,
            dependent: 'uniform',
        } as any);
        prismaMock.uniform.findUnique.mockResolvedValueOnce({
            id: uniformId,
            type: { name: 'Typ1', id: 'typeId' },
            number: '1184',
        } as any);
        vi.mocked(unsecuredGetActiveInspection).mockResolvedValueOnce(null);

        await createDeficiency({ typeId: uniformTypeId, comment: 'c', uniformId });

        expect(prismaMock.deficiency.create).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ fk_inspection_created: null }) })
        );
    });

    it('sets fk_inspection_created to active inspection id when inspection is active', async () => {
        const activeInspectionId = 'f1e2d3c4-b5a6-7890-abcd-ef1234567890';
        prismaMock.deficiencyType.findFirst.mockResolvedValueOnce({
            id: uniformTypeId,
            dependent: 'uniform',
        } as any);
        prismaMock.uniform.findUnique.mockResolvedValueOnce({
            id: uniformId,
            type: { name: 'Typ1', id: 'typeId' },
            number: '1184',
        } as any);
        vi.mocked(unsecuredGetActiveInspection).mockResolvedValueOnce({
            id: activeInspectionId,
            date: new Date().toISOString().split('T')[0],
            timeStart: '09:00',
            timeEnd: null,
        } as any);

        await createDeficiency({ typeId: uniformTypeId, comment: 'c', uniformId });

        expect(prismaMock.deficiency.create).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ fk_inspection_created: activeInspectionId }) })
        );
    });

    it('throws exception if deficiency type not found', async () => {
        prismaMock.deficiencyType.findFirst.mockResolvedValueOnce(null);

        await expect(createDeficiency({ typeId: uniformTypeId, comment: 'c', uniformId }))
            .rejects.toThrow("Deficiency type not found");
    });

    it('throws exception if uniformId not provided for uniform-dependent type', async () => {
        prismaMock.deficiencyType.findFirst.mockResolvedValueOnce({
            id: uniformTypeId,
            dependent: 'uniform',
        } as any);

        await expect(createDeficiency({ typeId: uniformTypeId, comment: 'c' }))
            .rejects.toThrow("uniformId is required for uniform-dependent deficiency type");
    });

    it('throws exception if cadetId not provided for cadet-dependent type', async () => {
        prismaMock.deficiencyType.findFirst.mockResolvedValueOnce({
            id: uniformTypeId,
            dependent: 'cadet',
        } as any);

        await expect(createDeficiency({ typeId: uniformTypeId, comment: 'c' }))
            .rejects.toThrow("cadetId is required for cadet-dependent deficiency type");
    });

    describe('auto-generates description', () => {
        it('creates a deficiency for uniform-dependent type with auto-generated description', async () => {
            prismaMock.deficiencyType.findFirst.mockResolvedValueOnce({
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

        it('creates deficiency with auto-generated description and fk_uniform for cadet+uniform-relation type', async () => {
            prismaMock.deficiencyType.findFirst.mockResolvedValueOnce({
                id: uniformTypeId,
                dependent: 'cadet',
                relation: 'uniform',
            } as any);
            prismaMock.uniformIssued.findFirst.mockResolvedValueOnce({
                fk_cadet: cadetId,
                fk_uniform: uniformId,
                uniform: {
                    id: uniformId,
                    number: '42',
                    type: { name: 'Typ2', id: 'typeId' },
                },
            } as any);

            const result = createDeficiency({
                typeId: uniformTypeId,
                comment: 'Uniform relation comment',
                cadetId,
                uniformId,
            });
            await expect(result).resolves.toBeUndefined();

            expect(prismaMock.deficiency.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    description: 'Typ2-42',
                    fk_uniform: uniformId,
                    fk_cadet: cadetId,
                }),
            });
        });

        it('creates deficiency with auto-generated description and fk_material for cadet+material-relation type', async () => {
            const materialId = 'b1c2d3e4-f5a6-7890-bcde-f12345678901';
            prismaMock.deficiencyType.findFirst.mockResolvedValueOnce({
                id: uniformTypeId,
                dependent: 'cadet',
                relation: 'material',
            } as any);
            prismaMock.material.findUnique.mockResolvedValueOnce({
                id: materialId,
                typename: 'Helm',
                materialGroup: { description: 'Kopfbedeckung' },
            } as any);

            const result = createDeficiency({
                typeId: uniformTypeId,
                comment: 'Material relation comment',
                cadetId,
                materialId,
            });
            await expect(result).resolves.toBeUndefined();

            expect(prismaMock.deficiency.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    description: 'Kopfbedeckung-Helm',
                    fk_material: materialId,
                    fk_cadet: cadetId,
                }),
            });
        });
    });
});
