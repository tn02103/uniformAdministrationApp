import { prismaMock } from "@test-utils/prisma-mock";
import { hash } from "bcrypt";
import { AuthRole } from "@/lib/AuthRoles";
import { createUser } from "./create";

vi.mock("bcrypt", () => ({
    hash: vi.fn().mockResolvedValue("$2b$12$mocked-bcrypt-hash"),
}));

vi.mock("./passwordReset", () => ({
    generateTempPassword: vi.fn().mockReturnValue("mocked-temp"),
}));

const mockBcryptHash = vi.mocked(hash);

const validInput = {
    username: "abc12",
    email: "test@example.com",
    name: "Test User",
    role: AuthRole.user,
    active: true,
};

describe("<User> createUser", () => {
    afterEach(() => vi.clearAllMocks());

    it("should create a user and return tempPassword on success", async () => {
        prismaMock.user.findFirst.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({} as never);

        const result = await createUser(validInput);

        expect(result).toEqual({ success: true, tempPassword: "mocked-temp" });
        expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
            where: { organisationId: "test-organisation-id", username: validInput.username },
        });
        expect(mockBcryptHash).toHaveBeenCalledWith("mocked-temp", 12);
        expect(prismaMock.user.create).toHaveBeenCalledWith({
            data: {
                username: validInput.username,
                email: validInput.email,
                name: validInput.name,
                role: validInput.role,
                active: validInput.active,
                password: "$2b$12$mocked-bcrypt-hash",
                changePasswordOnLogin: true,
                organisationId: "test-organisation-id",
            },
        });
    });

    it("should return error when username is already taken", async () => {
        prismaMock.user.findFirst.mockResolvedValue({
            id: "existing-user-id",
            username: validInput.username,
        } as never);

        const result = await createUser(validInput);

        expect(result).toEqual({
            error: {
                message: "user.username.duplication",
                formElement: "username",
            },
        });
        expect(prismaMock.user.create).not.toHaveBeenCalled();
        expect(mockBcryptHash).not.toHaveBeenCalled();
    });

    it("should return error when email is already taken", async () => {
        prismaMock.user.findFirst.mockResolvedValueOnce(null); // username check passes
        prismaMock.user.findFirst.mockResolvedValueOnce({
            id: "existing-user-id",
            email: validInput.email,
        } as never); // email check fails

        const result = await createUser(validInput);

        expect(result).toEqual({
            error: {
                message: "user.email.duplication",
                formElement: "email",
            },
        });
        expect(prismaMock.user.create).not.toHaveBeenCalled();
        expect(mockBcryptHash).not.toHaveBeenCalled();
    });

    it("should hash the generated temp password with bcrypt", async () => {
        prismaMock.user.findFirst.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({} as never);

        await createUser(validInput);

        expect(mockBcryptHash).toHaveBeenCalledWith("mocked-temp", 12);
    });
});
