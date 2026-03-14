import { vi } from 'vitest';
import { prisma } from "@/lib/db";
import { prismaMock } from '@test-utils/prisma-mock';
import { __unsecuredGetUnitsWithUniformItems } from "./get";
import { update } from "./update";

vi.mock("./get", () => ({
    __unsecuredGetUnitsWithUniformItems: vi.fn(async () => []),
}));

describe("update", () => {
    const assosiationId = "test-assosiation-id"
    const mockProps = {
        id: "b101fce1-9297-4978-bc34-ce357ab1d6d4",
        data: {
            name: "New Storage Unit",
            description: "A new storage unit",
            capacity: 10,
            isReserve: false,
        },
    };


    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(prisma.storageUnit.findFirst).mockResolvedValue(null);
        prismaMock.storageUnit.findUniqueOrThrow.mockResolvedValue({ id: "b101fce1-9297-4978-bc34-ce357ab1d6d4" });
        vi.mocked(prisma.storageUnit.update).mockResolvedValue({ id: "b101fce1-9297-4978-bc34-ce357ab1d6d4", ...mockProps.data });
    });

    it("should update the storage unit successfully", async () => {
        const result = await update(mockProps);

        expect(prisma.storageUnit.findFirst).toHaveBeenCalledWith({
            where: {
                assosiationId,
                name: mockProps.data.name,
                id: { not: mockProps.id } // Exclude the current unit being updated
            },
        });
        expect(prisma.storageUnit.update).toHaveBeenCalledWith({
            where: { id: mockProps.id },
            data: mockProps.data,
        });
        expect(__unsecuredGetUnitsWithUniformItems).toHaveBeenCalledWith(assosiationId, prisma);
        expect(result).toEqual([]);
    });

    it("should return an error if the storage unit name is duplicated", async () => {
        (prisma.storageUnit.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue([
            { id: "another-uuid", name: "New Storage Unit" },
        ]);
        const result = await update(mockProps);

        expect(prisma.storageUnit.findFirst).toHaveBeenCalledWith({
            where: {
                assosiationId,
                name: mockProps.data.name,
                id: { not: mockProps.id } // Exclude the current unit being updated
            },
        });
        expect(result).toEqual({
            error: {
                formElement: "name",
                message: "custom.nameDuplication.storageUnit",
            },
        });
    });

    it("should handle database errors gracefully", async () => {
        (prisma.storageUnit.findFirst as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Database error"));
        (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback) => callback(prisma));

        await expect(update(mockProps)).rejects.toThrow("Database error");
    });
});
