import { prismaMock } from "@test-utils/prisma-mock";
import bcrypt from "bcrypt";
import { changePassword, ChangePasswordProps, InvalidCurrentPasswordError } from "./changePassword";

vi.mock("bcrypt");

const mockBcryptCompare = vi.mocked(bcrypt.compare);
const mockBcryptHash = vi.mocked(bcrypt.hash);

describe("changePassword", () => {
    const baseProps: ChangePasswordProps = {
        userId: "user-id-123",
        currentPassword: "OldPassword1",
        newPassword: "NewPassword1",
    };

    const mockUserRecord = {
        password: "hashed-old-password",
    };

    afterEach(() => vi.clearAllMocks());

    describe("user lookup", () => {
        it("throws when user is not found", async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            await expect(changePassword(baseProps)).rejects.toThrow("User not found");

            expect(prismaMock.user.update).not.toHaveBeenCalled();
        });
    });

    describe("current password verification", () => {
        it("throws InvalidCurrentPasswordError when current password is wrong", async () => {
            prismaMock.user.findUnique.mockResolvedValue(mockUserRecord as never);
            mockBcryptCompare.mockResolvedValue(false as never);

            await expect(changePassword(baseProps)).rejects.toThrow(InvalidCurrentPasswordError);
            await expect(changePassword(baseProps)).rejects.toThrow("Current password is incorrect");

            expect(prismaMock.user.update).not.toHaveBeenCalled();
        });

        it("calls bcrypt.compare with the provided current password and stored hash", async () => {
            prismaMock.user.findUnique.mockResolvedValue(mockUserRecord as never);
            mockBcryptCompare.mockResolvedValue(false as never);

            await expect(changePassword(baseProps)).rejects.toThrow(InvalidCurrentPasswordError);

            expect(mockBcryptCompare).toHaveBeenCalledWith(
                baseProps.currentPassword,
                mockUserRecord.password
            );
        });
    });

    describe("successful password change", () => {
        beforeEach(() => {
            prismaMock.user.findUnique.mockResolvedValue(mockUserRecord as never);
            mockBcryptCompare.mockResolvedValue(true as never);
            mockBcryptHash.mockResolvedValue("hashed-new-password" as never);
            prismaMock.user.update.mockResolvedValue({} as never);
        });

        it("returns undefined on success", async () => {
            const result = await changePassword(baseProps);
            expect(result).toBeUndefined();
        });

        it("hashes the new password with salt rounds 12", async () => {
            await changePassword(baseProps);

            expect(mockBcryptHash).toHaveBeenCalledWith(baseProps.newPassword, 12);
        });

        it("updates the user with the hashed new password", async () => {
            await changePassword(baseProps);

            expect(prismaMock.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: baseProps.userId },
                    data: expect.objectContaining({
                        password: "hashed-new-password",
                    }),
                })
            );
        });

        it("always clears changePasswordOnLogin flag on success", async () => {
            await changePassword(baseProps);

            expect(prismaMock.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        changePasswordOnLogin: false,
                    }),
                })
            );
        });

        it("queries only the password field for the user", async () => {
            await changePassword(baseProps);

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: baseProps.userId },
                    select: { password: true },
                })
            );
        });
    });
});
