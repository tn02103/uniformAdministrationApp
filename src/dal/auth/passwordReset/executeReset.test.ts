import { executePasswordReset } from "./executeReset";
import { prismaMock } from "@test-utils/prisma-mock";
import { hash } from "bcrypt";
import { sha256Hex } from "@/dal/auth/helper.tokens";
import { logSecurityAuditEntry } from "@/dal/auth/helper";
import { LogDebugLevel } from "@/dal/auth/LogDebugLeve.enum";
import { sendPasswordChangedEmail } from "@/lib/email/passwordChangedEmail";

vi.mock("bcrypt", () => ({
    hash: vi.fn().mockResolvedValue("$2b$12$mocked-bcrypt-hash"),
}));

vi.mock("next/headers", () => ({
    headers: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue("192.168.1.1"),
    }),
}));

vi.mock("next/server", () => ({
    userAgent: vi.fn().mockReturnValue({}),
}));

vi.mock("rate-limiter-flexible", () => ({
    RateLimiterMemory: vi.fn().mockImplementation(function () {
        return {
            consume: vi.fn().mockResolvedValue({ remainingPoints: 9 }),
        };
    }),
}));

vi.mock("@/dal/auth/helper", () => ({
    getIPAddress: vi.fn().mockReturnValue("192.168.1.1"),
    logSecurityAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email/passwordChangedEmail", () => ({
    sendPasswordChangedEmail: vi.fn().mockResolvedValue(undefined),
}));

const mockBcryptHash = vi.mocked(hash);
const mockLogAuditEntry = vi.mocked(logSecurityAuditEntry);
const mockSendPasswordChangedEmail = vi.mocked(sendPasswordChangedEmail);

const validInput = {
    token: "valid-raw-token-12345",
    newPassword: "NewPass1",
};

const now = new Date("2026-01-15T12:00:00.000Z");
const oneHourFromNow = new Date("2026-01-15T13:00:00.000Z");
const twoMinutesAgo = new Date("2026-01-15T11:58:00.000Z");

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
        prismaMock.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 0 });
        prismaMock.session.updateMany.mockResolvedValue({ count: 0 });
        prismaMock.auditLog.create.mockResolvedValue({} as never);
        mockLogAuditEntry.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns { success: false, error: 'tokenInvalid' } when token is not found", async () => {
        prismaMock.passwordResetToken.findFirst.mockResolvedValue(null);
        const result = await executePasswordReset(validInput);
        expect(result).toEqual({ success: false, error: "tokenInvalid" });
    });

    it("returns { success: false, error: 'tokenInvalid' } when token is expired", async () => {
        prismaMock.passwordResetToken.findFirst.mockResolvedValue({
            ...buildMockRecord(),
            endOfLive: twoMinutesAgo,
        } as never);

        const result = await executePasswordReset(validInput);
        expect(result).toEqual({ success: false, error: "tokenInvalid" });
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
        expect(prismaMock.passwordResetToken.updateMany).toHaveBeenCalledWith({
            where: { id: "reset-record-123", usedAt: null },
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

    it("sends password changed email with type 'reset' on success", async () => {
        await executePasswordReset(validInput);

        expect(mockSendPasswordChangedEmail).toHaveBeenCalledWith("user-456", "reset");
    });

    describe("audit logging", () => {
        it("logs WARNING when token is not found", async () => {
            prismaMock.passwordResetToken.findFirst.mockResolvedValue(null);
            await executePasswordReset(validInput);

            expect(mockLogAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
                action: "PASSWORD_RESET_VALIDATE",
                success: false,
                debugLevel: LogDebugLevel.WARNING,
                details: "Password reset token not found",
            }));
        });

        it("logs WARNING when token has already been used", async () => {
            prismaMock.passwordResetToken.findFirst.mockResolvedValue({
                ...buildMockRecord(),
                usedAt: new Date("2026-01-15T10:00:00.000Z"),
            } as never);

            await executePasswordReset(validInput);

            expect(mockLogAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
                action: "PASSWORD_RESET_VALIDATE",
                success: false,
                debugLevel: LogDebugLevel.WARNING,
                details: "Password reset token already used",
            }));
        });

        it("logs INFO with seconds elapsed when token is expired", async () => {
            prismaMock.passwordResetToken.findFirst.mockResolvedValue({
                ...buildMockRecord(),
                endOfLive: twoMinutesAgo,
            } as never);

            await executePasswordReset(validInput);

            expect(mockLogAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
                action: "PASSWORD_RESET_VALIDATE",
                success: false,
                debugLevel: LogDebugLevel.INFO,
                details: "Password reset token expired (120s ago)",
            }));
        });

        it("logs CRITICAL when a replay attack is detected in the transaction", async () => {
            // Pre-validation sees a valid token; the transaction finds it already used
            prismaMock.passwordResetToken.findFirst
                .mockResolvedValueOnce(buildMockRecord() as never)
                .mockResolvedValueOnce({ ...buildMockRecord(), usedAt: new Date() } as never);

            await executePasswordReset(validInput);

            expect(mockLogAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
                action: "PASSWORD_RESET_EXECUTE",
                success: false,
                debugLevel: LogDebugLevel.CRITICAL,
                details: expect.stringContaining("replay attack"),
            }));
        });

        it("logs SUCCESS after a successful password reset", async () => {
            await executePasswordReset(validInput);

            expect(mockLogAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
                action: "PASSWORD_RESET_EXECUTE",
                success: true,
                debugLevel: LogDebugLevel.SUCCESS,
            }));
        });
    });
});
