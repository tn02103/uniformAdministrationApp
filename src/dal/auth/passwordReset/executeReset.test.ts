import { executePasswordReset } from "./executeReset";
import { prismaMock } from "@test-utils/prisma-mock";
import bcrypt from "bcrypt";
import { sha256Hex } from "@/dal/auth/helper.tokens";

vi.mock("bcrypt", () => ({
    default: {
        hash: vi.fn().mockResolvedValue("$2b$12$mocked-bcrypt-hash"),
    },
}));

const mockBcryptHash = vi.mocked(bcrypt.hash);

const validInput = {
    token: "valid-raw-token-12345",
    newPassword: "NewPass1",
};

const now = new Date("2026-01-15T12:00:00.000Z");
const oneHourFromNow = new Date("2026-01-15T13:00:00.000Z");

const buildMockRecord = () => ({
    id: "reset-record-123",
    userId: "user-456",
    organisationId: "org-789",
    endOfLive: oneHourFromNow,
    usedAt: null,
    tokenHash: sha256Hex(validInput.token),
});

describe("executePasswordReset", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(now);

        prismaMock.passwordResetToken.findFirst.mockResolvedValue(buildMockRecord() as never);
        prismaMock.user.update.mockResolvedValue({} as never);
        prismaMock.passwordResetToken.update.mockResolvedValue({} as never);
        prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 0 });
        prismaMock.session.updateMany.mockResolvedValue({ count: 0 });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns { success: false, error: 'tokenInvalid' } when token is not found", async () => {
        prismaMock.passwordResetToken.findFirst.mockResolvedValue(null);
        const result = await executePasswordReset(validInput);
        expect(result).toEqual({ success: false, error: "tokenInvalid" });
    });

    it("returns { success: false, error: 'tokenExpired' } when token is expired", async () => {
        prismaMock.passwordResetToken.findFirst.mockResolvedValue({
            ...buildMockRecord(),
            endOfLive: new Date("2026-01-15T11:59:59.999Z"),
        } as never);

        const result = await executePasswordReset(validInput);
        expect(result).toEqual({ success: false, error: "tokenExpired" });
    });

    it("returns { success: false, error: 'tokenInvalid' } when token has already been used", async () => {
        prismaMock.passwordResetToken.findFirst.mockResolvedValue({
            ...buildMockRecord(),
            usedAt: new Date("2026-01-15T10:00:00.000Z"),
        } as never);

        const result = await executePasswordReset(validInput);
        expect(result).toEqual({ success: false, error: "tokenInvalid" });
    });

    it("returns { success: true } on valid token", async () => {
        const result = await executePasswordReset(validInput);
        expect(result).toEqual({ success: true });
    });

    it("hashes the new password with bcrypt before storing", async () => {
        await executePasswordReset(validInput);
        expect(mockBcryptHash).toHaveBeenCalledWith("NewPass1", 12);
    });

    it("updates user password with the bcrypt hash", async () => {
        await executePasswordReset(validInput);
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id: "user-456" },
            data: { password: "$2b$12$mocked-bcrypt-hash" },
        });
    });

    it("marks token as used with current timestamp", async () => {
        await executePasswordReset(validInput);
        expect(prismaMock.passwordResetToken.update).toHaveBeenCalledWith({
            where: { id: "reset-record-123" },
            data: { usedAt: now },
        });
    });

    it("revokes all active refresh tokens for the user", async () => {
        await executePasswordReset(validInput);
        expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
            where: { userId: "user-456", status: "active" },
            data: { status: "revoked" },
        });
    });

    it("invalidates all valid sessions for the user", async () => {
        await executePasswordReset(validInput);
        expect(prismaMock.session.updateMany).toHaveBeenCalledWith({
            where: { device: { userId: "user-456" }, valid: true },
            data: { valid: false },
        });
    });

    it("performs all changes inside a transaction", async () => {
        await executePasswordReset(validInput);
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });

    it("returns { success: false, error: 'validation' } for missing token", async () => {
        const result = await executePasswordReset({ token: "", newPassword: "NewPass1" });
        expect(result).toEqual({ success: false, error: "validation" });
    });

    it("returns { success: false, error: 'validation' } for weak password", async () => {
        const result = await executePasswordReset({ token: "valid-token", newPassword: "weak" });
        expect(result).toEqual({ success: false, error: "validation" });
    });
});
