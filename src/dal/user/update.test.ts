import { prismaMock } from "@test-utils/prisma-mock";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { AuthRole } from "@/lib/AuthRoles";
import { updateUser, changeUserPassword } from "./update";

vi.mock("bcrypt", () => ({
    default: {
        hash: vi.fn().mockResolvedValue("$2b$12$mocked-bcrypt-hash"),
    },
}));

const mockBcryptHash = vi.mocked(bcrypt.hash);

describe("<User> updateUser", () => {
    afterEach(() => vi.clearAllMocks());

    const validInput = {
        userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        name: "Updated Name",
        role: AuthRole.inspector,
        active: true,
    };

    it("should update user and revalidate path on success", async () => {
        prismaMock.user.update.mockResolvedValue({} as never);

        const result = await updateUser(validInput);

        expect(result).toBeUndefined();
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id: validInput.userId, organisationId: "test-organisation-id" },
            data: {
                name: validInput.name,
                role: validInput.role,
                active: validInput.active,
                failedLoginCount: 0,
            },
        });
        expect(revalidatePath).toHaveBeenCalledWith(
            "/[locale]/test-organisation-id/admin/user",
            "page"
        );
    });

    it("should propagate error when user does not exist", async () => {
        prismaMock.user.update.mockRejectedValue(new Error("Record not found"));

        await expect(updateUser(validInput)).rejects.toThrow("Record not found");
    });
});

describe("<User> changeUserPassword", () => {
    afterEach(() => vi.clearAllMocks());

    const validInput = {
        userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        password: "NewPassword1",
    };

    it("should hash password, update user, and delete refresh tokens on success", async () => {
        prismaMock.user.update.mockResolvedValue({} as never);
        prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

        const result = await changeUserPassword(validInput);

        expect(result).toBeUndefined();
        expect(mockBcryptHash).toHaveBeenCalledWith(validInput.password, 12);
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id: validInput.userId, organisationId: "test-organisation-id" },
            data: { password: "$2b$12$mocked-bcrypt-hash" },
        });
        expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
            where: { userId: validInput.userId },
        });
        expect(revalidatePath).toHaveBeenCalledWith(
            "/[locale]/test-organisation-id/admin/user",
            "page"
        );
    });

    it("should propagate error when userId does not exist", async () => {
        prismaMock.user.update.mockRejectedValue(new Error("Record not found"));

        await expect(changeUserPassword(validInput)).rejects.toThrow("Record not found");
    });
});
