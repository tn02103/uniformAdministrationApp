import { prisma } from "@/lib/db";
import { __unsecuredGetUnitsWithUniformItems } from "./get";
import { update } from "./update";

jest.mock("@/lib/db", () => ({
    prisma: {
        $transaction: jest.fn(async (callback) => callback(prisma)),
        storageUnit: {
            findFirst: jest.fn(() => null),
            findUniqueOrThrow: jest.fn(() => ({ id: "b101fce1-9297-4978-bc34-ce357ab1d6d4" })),
            update: jest.fn(async () => { }),
        },
    },
}));

jest.mock("./get", () => ({
    __unsecuredGetUnitsWithUniformItems: jest.fn(async () => []),
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
        jest.clearAllMocks();
    });

    it("should update the storage unit successfully", async () => {
        const result = await update(mockProps);

        expect(prisma.storageUnit.findFirst).toHaveBeenCalledWith({
            where: {
                organisationId,
                name: mockProps.data.name,
                id: { not: mockProps.id } // Exclude the current unit being updated
            },
        });
        expect(prisma.storageUnit.update).toHaveBeenCalledWith({
            where: { id: mockProps.id },
            data: mockProps.data,
        });
        expect(__unsecuredGetUnitsWithUniformItems).toHaveBeenCalledWith(organisationId, prisma);
        expect(result).toEqual([]);
    });

    it("should return an error if the storage unit name is duplicated", async () => {
        (prisma.storageUnit.findFirst as jest.Mock).mockResolvedValue([
            { id: "another-uuid", name: "New Storage Unit" },
        ]);
        const result = await update(mockProps);

        expect(prisma.storageUnit.findFirst).toHaveBeenCalledWith({
            where: {
                organisationId,
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
        (prisma.storageUnit.findFirst as jest.Mock).mockRejectedValue(new Error("Database error"));
        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(prisma));

        await expect(update(mockProps)).rejects.toThrow("Database error");
    });
});
