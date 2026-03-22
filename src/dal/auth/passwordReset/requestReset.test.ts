import { requestPasswordReset } from "./requestReset";
import { prismaMock } from "@test-utils/prisma-mock";
import { sendPasswordResetEmail } from "@/lib/email/passwordResetEmail";
import { logSecurityAuditEntry } from "@/dal/auth/helper";
import { LogDebugLevel } from "@/dal/auth/LogDebugLeve.enum";
import crypto from "crypto";

vi.mock("@/lib/email/passwordResetEmail", () => ({
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/dal/auth/helper", () => ({
    getIPAddress: vi.fn().mockReturnValue("192.168.1.1"),
    logSecurityAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/headers", () => ({
    headers: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue("192.168.1.1"),
    }),
}));

vi.mock("next/server", () => ({
    userAgent: vi.fn().mockReturnValue({}),
}));

vi.mock("crypto", async (importOriginal) => {
    const actual = await importOriginal<typeof import("crypto")>();
    return {
        ...actual,
        randomBytes: vi.fn(),
        default: { ...actual, randomBytes: vi.fn() },
    };
});

vi.mock("timers/promises", () => ({
    setTimeout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("rate-limiter-flexible", () => ({
    RateLimiterMemory: vi.fn().mockImplementation(function () {
        return {
            get: vi.fn().mockResolvedValue(null),
            consume: vi.fn().mockResolvedValue({ remainingPoints: 4 }),
        };
    }),
}));

const mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail);
const mockRandomBytes = vi.mocked(crypto.randomBytes);
const mockLogAuditEntry = vi.mocked(logSecurityAuditEntry);

const validInput = {
    organisationId: "00000000-0000-0000-0000-000000000001",
    email: "test@example.com",
};

const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    organisationId: "00000000-0000-0000-0000-000000000001",
};

describe("requestPasswordReset", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRandomBytes.mockReturnValue(Buffer.alloc(32, "a") as never);
        prismaMock.user.findFirst.mockResolvedValue(mockUser as never);
        prismaMock.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
        prismaMock.passwordResetToken.create.mockResolvedValue({} as never);
        prismaMock.auditLog.create.mockResolvedValue({} as never);
        mockLogAuditEntry.mockResolvedValue(undefined);
    });

    it("returns { success: true } when user does not exist (enumeration prevention)", async () => {
        prismaMock.user.findFirst.mockResolvedValue(null);
        const result = await requestPasswordReset(validInput);
        expect(result).toEqual({ success: true });
    });

    it("does not call sendPasswordResetEmail when user does not exist", async () => {
        prismaMock.user.findFirst.mockResolvedValue(null);
        await requestPasswordReset(validInput);
        expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("returns { success: true } when user exists", async () => {
        const result = await requestPasswordReset(validInput);
        expect(result).toEqual({ success: true });
    });

    it("stores tokenHash as SHA-256 hex, not plaintext token", async () => {
        const rawBytes = Buffer.from("abc".repeat(11)); // 33 bytes → base64url
        mockRandomBytes.mockReturnValue(rawBytes as never);

        await requestPasswordReset(validInput);

        const createCall = prismaMock.passwordResetToken.create.mock.calls[0][0];
        const storedHash = createCall.data.tokenHash;

        // Hash should be 64 hex chars (SHA-256)
        expect(storedHash).toHaveLength(64);
        expect(storedHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("deletes previous unused reset tokens before creating a new one", async () => {
        await requestPasswordReset(validInput);
        expect(prismaMock.passwordResetToken.deleteMany).toHaveBeenCalledWith({
            where: { userId: "user-123", usedAt: null },
        });
    });

    it("creates token with 1 hour expiry", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));

        await requestPasswordReset(validInput);

        const createCall = prismaMock.passwordResetToken.create.mock.calls[0][0];
        const endOfLive = createCall.data.endOfLive as Date;
        const expected = new Date("2026-01-01T13:00:00.000Z");
        expect(endOfLive.getTime()).toBe(expected.getTime());

        vi.useRealTimers();
    });

    it("returns { success: false } for invalid email", async () => {
        const result = await requestPasswordReset({
            organisationId: "00000000-0000-0000-0000-000000000001",
            email: "not-an-email",
        });
        expect(result).toEqual({ success: false });
    });

    it("returns { success: false } for invalid organisationId", async () => {
        const result = await requestPasswordReset({
            organisationId: "not-a-uuid",
            email: "test@example.com",
        });
        expect(result).toEqual({ success: false });
    });

    it("sends email with a reset link containing the raw token", async () => {
        await requestPasswordReset(validInput);
        expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
            expect.objectContaining({ id: "user-123" }),
            expect.stringContaining("/reset-password?token=")
        );
    });

    describe("audit logging", () => {
        it("logs WARNING when the email address is not found", async () => {
            prismaMock.user.findFirst.mockResolvedValue(null);
            await requestPasswordReset(validInput);

            expect(mockLogAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
                action: "PASSWORD_RESET_REQUEST",
                success: false,
                debugLevel: LogDebugLevel.WARNING,
                organisationId: validInput.organisationId,
            }));
        });

        it("logs SUCCESS after the reset email is sent", async () => {
            await requestPasswordReset(validInput);

            expect(mockLogAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
                action: "PASSWORD_RESET_REQUEST",
                success: true,
                debugLevel: LogDebugLevel.SUCCESS,
                userId: "user-123",
                organisationId: validInput.organisationId,
            }));
        });

        it("logs CRITICAL when email delivery fails", async () => {
            mockSendPasswordResetEmail.mockRejectedValueOnce(new Error("SMTP error"));
            await requestPasswordReset(validInput);

            expect(mockLogAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
                action: "PASSWORD_RESET_REQUEST",
                success: false,
                debugLevel: LogDebugLevel.CRITICAL,
                userId: "user-123",
            }));
        });
    });
});
