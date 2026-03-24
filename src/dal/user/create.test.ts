import { prismaMock } from "@test-utils/prisma-mock";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { AuthRole } from "@/lib/AuthRoles";
import { createUser } from "./create";

vi.mock("bcrypt", () => ({
    default: {
        hash: vi.fn().mockResolvedValue("$2b$12$mocked-bcrypt-hash"),
    },
}));

const mockBcryptHash = vi.mocked(bcrypt.hash);

const validInput = {
    username: "abc12",
    name: "Test User",
    role: AuthRole.user,
    active: true,
    password: "Password1",
};

describe("<User> createUser", () => {
    afterEach(() => vi.clearAllMocks());

    it("should create a user and revalidate path on success", async () => {
        prismaMock.user.findFirst.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({} as never);

        const result = await createUser(validInput);

        expect(result).toBeUndefined();
        expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
            where: { organisationId: "test-organisation-id", username: validInput.username },
        });
        expect(mockBcryptHash).toHaveBeenCalledWith(validInput.password, 12);
        expect(prismaMock.user.create).toHaveBeenCalledWith({
            data: {
                username: validInput.username,
                email: validInput.username,
                name: validInput.name,
                role: validInput.role,
                active: validInput.active,
                password: "$2b$12$mocked-bcrypt-hash",
                organisationId: "test-organisation-id",
            },
        });
        expect(revalidatePath).toHaveBeenCalledWith(
            "/[locale]/test-organisation-id/admin/users",
            "page"
        );
    });

    it("should return error when username is already taken", async () => {
        prismaMock.user.findFirst.mockResolvedValue({
            id: "existing-user-id",
            username: validInput.username,
        } as never);

        const result = await createUser(validInput);

        expect(result).toEqual({
            error: {
                message: "custom.usernameDuplication.user",
                formElement: "username",
            },
        });
        expect(prismaMock.user.create).not.toHaveBeenCalled();
        expect(mockBcryptHash).not.toHaveBeenCalled();
    });
});
