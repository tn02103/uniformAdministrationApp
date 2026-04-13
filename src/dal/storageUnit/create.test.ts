import { vi } from 'vitest';
import { prismaMock } from '@test-utils/prisma-mock';
import { create } from "./create";
import { prisma } from "@/lib/db";
import { __unsecuredGetUnitsWithUniformItems } from "./get";

vi.mock("./get", () => ({
    __unsecuredGetUnitsWithUniformItems: vi.fn(() => "unitsWithUniformItems"),
}));

const testUnit = {
    name: 'Unit1',
    description: 'For Broken uniformItems',
    capacity: 10,
    isReserve: true,
};

describe('<StorageUnit> create', () => {
    afterEach(vi.clearAllMocks);

    const prismafindFirst = prismaMock.storageUnit.findFirst;
    const prismaCreate = prismaMock.storageUnit.create;
    const getUnitsWithUniformItems = vi.mocked(__unsecuredGetUnitsWithUniformItems);

    it('should create storage unit', async () => {
        prismafindFirst.mockResolvedValueOnce(null);
        prismaCreate.mockResolvedValueOnce({ ...testUnit });
        getUnitsWithUniformItems.mockResolvedValueOnce([
            { ...testUnit }
        ] as any);

        const result = await create(testUnit);
        expect(result).toEqual([
            expect.objectContaining(testUnit)
        ]);
        expect(prismafindFirst).toHaveBeenCalledWith({
            where: { organisationId: 'test-organisation-id', name: testUnit.name }
        });
        expect(prismaCreate).toHaveBeenCalledWith({
            data: {
                organisationId: 'test-organisation-id',
                ...testUnit,
            }
        });
        expect(getUnitsWithUniformItems).toHaveBeenCalledWith('test-organisation-id', prisma);
    });

    it('throws soft error if name is duplicated', async () => {
        prismafindFirst.mockResolvedValueOnce(
            { name: 'Kiste 01', description: '', capacity: 1, isReserve: false }
        );
        const result = await create({
            ...testUnit,
            name: 'Kiste 01'
        });
        expect(result).toEqual({
            error: {
                message: "custom.nameDuplication.storageUnit",
                formElement: "name",
            }
        });
        expect(prismaCreate).not.toHaveBeenCalled();
    });

    it('should work with no previous units', async () => {
        prismafindFirst.mockResolvedValueOnce(null);
        prismaCreate.mockResolvedValueOnce({ ...testUnit });
        getUnitsWithUniformItems.mockResolvedValueOnce([
            { ...testUnit }
        ] as any);
        const result = await create(testUnit);
        expect(result).toStrictEqual([
            expect.objectContaining(testUnit)
        ]);
        expect(prismaCreate).toHaveBeenCalled();
    });
});


