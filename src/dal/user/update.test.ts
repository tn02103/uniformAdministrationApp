import { prismaMock } from "@test-utils/prisma-mock";
import { revalidatePath } from "next/cache";
import { hash } from "bcrypt";
import { AuthRole } from "@/lib/AuthRoles";
import { updateUser, changeUserPassword } from "./update";

vi.mock("bcrypt", () => ({
    hash: vi.fn().mockResolvedValue("$2b$12$mocked-bcrypt-hash"),
}));

const mockBcryptHash = vi.mocked(hash);

describe("<User> updateUser", () => {
    afterEach(() => vi.clearAllMocks());

    const validInput = {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        username: "newusr",
        email: "newemail@example.com",
        name: "Updated Name",
        role: AuthRole.inspector,
        active: true,
    };

    it("should update user fields including username and email in the database", async () => {
        prismaMock.user.findFirst.mockResolvedValue(null);
        prismaMock.user.update.mockResolvedValue({} as never);

        const result = await updateUser(validInput);

        expect(result).toBeUndefined();
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id: validInput.id, organisationId: "test-organisation-id" },
            data: {
                username: validInput.username,
                email: validInput.email,
                name: validInput.name,
                role: validInput.role,
                active: validInput.active,
                failedLoginCount: 0,
            },
        });
    });

    it("should propagate error when user does not exist", async () => {
        prismaMock.user.findFirst.mockResolvedValue(null);
        prismaMock.user.update.mockRejectedValue(new Error("Record not found"));

        await expect(updateUser(validInput)).rejects.toThrow("Record not found");
    });

    it("should return error when username is already taken by another user", async () => {
        prismaMock.user.findFirst.mockResolvedValueOnce({ id: "other-user-id" } as never);

        const result = await updateUser(validInput);

        expect(result).toEqual({
            error: {
                message: "user.username.duplication",
                formElement: "username",
            },
        });
        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("should return error when email is already taken by another user", async () => {
        prismaMock.user.findFirst.mockResolvedValueOnce(null); // username check passes
        prismaMock.user.findFirst.mockResolvedValueOnce({ id: "other-user-id" } as never); // email check fails

        const result = await updateUser(validInput);

        expect(result).toEqual({
            error: {
                message: "user.email.duplication",
                formElement: "email",
            },
        });
        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    describe("self-role-change guard", () => {
        beforeEach(() => {
            global.__USERID__ = validInput.id;
        });
        afterEach(() => {
            delete global.__USERID__;
        });

        it("should return selfChange error when session user tries to change their own role", async () => {
            prismaMock.user.findUnique.mockResolvedValue({ role: AuthRole.admin } as never);

            const result = await updateUser({ ...validInput, role: AuthRole.user });

            expect(result).toEqual({
                error: { formElement: "role", message: "user.role.selfChange" },
            });
            expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
            expect(prismaMock.user.update).not.toHaveBeenCalled();
        });

        it("should allow updating own record when role is unchanged", async () => {
            prismaMock.user.findUnique.mockResolvedValue({ role: validInput.role } as never);
            prismaMock.user.findFirst.mockResolvedValue(null);
            prismaMock.user.update.mockResolvedValue({} as never);

            const result = await updateUser(validInput);

            expect(result).toBeUndefined();
            expect(prismaMock.user.update).toHaveBeenCalled();
        });
    });
});

describe("<User> changeUserPassword", () => {
    afterEach(() => vi.clearAllMocks());

    const validInput = {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        password: "NewPassword1",
    };

    it("should hash password, update user, and delete refresh tokens on success", async () => {
        prismaMock.user.update.mockResolvedValue({} as never);
        prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

        const result = await changeUserPassword(validInput);

        expect(result).toBeUndefined();
        expect(mockBcryptHash).toHaveBeenCalledWith(validInput.password, 12);
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id: validInput.id, organisationId: "test-organisation-id" },
            data: { password: "$2b$12$mocked-bcrypt-hash" },
        });
        expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
            where: { id: validInput.id },
        });
    });

    it("should propagate error when id does not exist", async () => {
        prismaMock.user.update.mockRejectedValue(new Error("Record not found"));

        await expect(changeUserPassword(validInput)).rejects.toThrow("Record not found");
    });
});
