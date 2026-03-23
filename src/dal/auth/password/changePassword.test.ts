import { genericSAValidator } from "@/actions/validations";
import { getIronSession } from "@/lib/ironSession";
import { sendPasswordChangedEmail } from "@/lib/email/passwordChangedEmail";
import { prismaMock } from "@test-utils/prisma-mock";
import bcrypt from "bcrypt";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { getMockUserAgent } from "../__testHelpers__/mockData";
import { getIPAddress, logSecurityAuditEntry } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { changePassword } from "./changePassword";

const mockRateLimiterInstance = vi.hoisted(() => ({
    get: vi.fn().mockResolvedValue(null),
    consume: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("bcrypt");
vi.mock('rate-limiter-flexible', () => ({
    RateLimiterMemory: class { constructor() { return mockRateLimiterInstance as any; } },
}));
vi.mock("@/lib/ironSession", () => ({
    getIronSession: vi.fn(),
}));
vi.mock("next/headers", () => ({
    headers: vi.fn(),
}));
vi.mock("next/server", () => ({
    userAgent: vi.fn(),
}));
vi.mock("../helper", () => ({
    getIPAddress: vi.fn(),
    logSecurityAuditEntry: vi.fn(),
}));
vi.mock("@/lib/email/passwordChangedEmail", () => ({
    sendPasswordChangedEmail: vi.fn().mockResolvedValue(undefined),
}));

const mockBcryptCompare = vi.mocked(bcrypt.compare);
const mockBcryptHash = vi.mocked(bcrypt.hash);
const mockGenericSAValidator = vi.mocked(genericSAValidator);
const mockGetIronSession = vi.mocked(getIronSession);
const mockHeaders = vi.mocked(headers);
const mockUserAgent = vi.mocked(userAgent);
const mockGetIPAddress = vi.mocked(getIPAddress);
const mockLogSecurityAuditEntry = vi.mocked(logSecurityAuditEntry);
const mockSendPasswordChangedEmail = vi.mocked(sendPasswordChangedEmail);

const mockUserId = "user-id-123";
const mockSessionId = "session-id-abc";
const mockIPAddress = "1.2.3.4";

describe("changePassword", () => {
    const baseProps = {
        currentPassword: "OldPassword1",
        newPassword: "NewPassword1",
    };

    const mockUserRecord = {
        password: "hashed-old-password",
    };

    beforeEach(() => {
        prismaMock.user.findUnique.mockResolvedValue(mockUserRecord as any);
        mockGenericSAValidator.mockResolvedValue([
            { id: mockUserId, organisationId: "test-org-id", name: "Test User", username: "testuser", role: 1, acronym: "TEST" },
            baseProps,
        ] as any);
        mockRateLimiterInstance.get.mockResolvedValue(null);
        mockRateLimiterInstance.consume.mockResolvedValue(undefined);
        mockGetIronSession.mockResolvedValue({ sessionId: mockSessionId } as any);
        mockHeaders.mockResolvedValue({} as any);
        mockUserAgent.mockReturnValue(getMockUserAgent());
        mockGetIPAddress.mockReturnValue(mockIPAddress);
        mockLogSecurityAuditEntry.mockResolvedValue(undefined);
    });

    afterEach(() => vi.clearAllMocks());

    describe("authentication & rate limiting", () => {
        it("calls genericSAValidator with the input data", async () => {
            mockBcryptCompare.mockResolvedValue(true as any);
            mockBcryptHash.mockResolvedValue("hashed-new-password" as any);
            prismaMock.user.update.mockResolvedValue({} as any);
            prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 0 } as any);

            await changePassword(baseProps);

            expect(mockGenericSAValidator).toHaveBeenCalledWith(
                expect.anything(),
                baseProps,
                expect.anything(),
            );
        });

        it("returns tooManyRequests error when rate limit is exhausted", async () => {
            mockRateLimiterInstance.get.mockResolvedValue({ remainingPoints: 0 });

            const result = await changePassword(baseProps);

            expect(result).toEqual({ error: { tooManyRequests: true } });
            expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
        });
    });

    describe("user lookup", () => {
        it("throws when user is not found", async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            await expect(changePassword(baseProps)).rejects.toThrow("User not found");

            expect(prismaMock.user.update).not.toHaveBeenCalled();
        });
    });

    describe("current password verification", () => {
        it("returns currentPassword formElement error when current password is wrong", async () => {
            mockBcryptCompare.mockResolvedValue(false as any);

            const result = await changePassword(baseProps);

            expect(result).toEqual({
                error: {
                    formElement: "currentPassword",
                    message: "custom.auth.invalidCurrentPassword",
                },
            });
            expect(prismaMock.user.update).not.toHaveBeenCalled();
        });

        it("consumes rate limiter point on wrong password", async () => {
            mockBcryptCompare.mockResolvedValue(false as any);

            await changePassword(baseProps);

            expect(mockRateLimiterInstance.consume).toHaveBeenCalledWith(mockUserId);
        });

        it("calls bcrypt.compare with the provided current password and stored hash", async () => {
            mockBcryptCompare.mockResolvedValue(false as any);

            await changePassword(baseProps);

            expect(mockBcryptCompare).toHaveBeenCalledWith(
                baseProps.currentPassword,
                mockUserRecord.password
            );
        });
    });

    describe("successful password change", () => {
        beforeEach(() => {
            mockBcryptCompare.mockResolvedValue(true as any);
            mockBcryptHash.mockResolvedValue("hashed-new-password" as any);
            prismaMock.user.update.mockResolvedValue({} as any);
            prismaMock.session.updateMany.mockResolvedValue({ count: 0 } as any);
            prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 0 } as any);
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
                    where: { id: mockUserId },
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

        it("invalidates all other sessions of the user on success", async () => {
            await changePassword(baseProps);

            expect(prismaMock.session.updateMany).toHaveBeenCalledWith({
                where: {
                    device: { userId: mockUserId },
                    valid: true,
                    NOT: { id: mockSessionId },
                },
                data: { valid: false },
            });
        });

        it("invalidates all sessions when no current sessionId is available", async () => {
            mockGetIronSession.mockResolvedValue({ sessionId: undefined } as any);

            await changePassword(baseProps);

            expect(prismaMock.session.updateMany).toHaveBeenCalledWith({
                where: {
                    device: { userId: mockUserId },
                    valid: true,
                },
                data: { valid: false },
            });
        });

        it("revokes all refresh tokens for the user except the current session", async () => {
            await changePassword(baseProps);

            expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: {
                    userId: mockUserId,
                    NOT: { sessionId: mockSessionId },
                },
            });
        });

        it("revokes all refresh tokens when no current sessionId is available", async () => {
            mockGetIronSession.mockResolvedValue({ sessionId: undefined } as any);

            await changePassword(baseProps);

            expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { userId: mockUserId },
            });
        });

        it("queries only the password field for the user", async () => {
            await changePassword(baseProps);

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: mockUserId },
                    select: { password: true },
                })
            );
        });

        it("sends password changed email with type 'change' on success", async () => {
            await changePassword(baseProps);

            expect(mockSendPasswordChangedEmail).toHaveBeenCalledWith(mockUserId, "change");
        });
    });

    describe("audit logging", () => {
        it("logs a failed CHANGE_PASSWORD audit entry for invalid password", async () => {
            mockBcryptCompare.mockResolvedValue(false as any);
            await changePassword(baseProps);

            expect(mockLogSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith({
                action: "CHANGE_PASSWORD",
                debugLevel: LogDebugLevel.INFO,
                userId: mockUserId,
                success: false,
                ipAddress: mockIPAddress,
                userAgent: getMockUserAgent(),
                details: "Password change failed: invalid current password",
            });
        });

        it("logs a failed CHANGE_PASSWORD audit entry when user is not found", async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);
            await expect(changePassword(baseProps)).rejects.toThrow("User not found");
            
            expect(mockLogSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith({
                action: "CHANGE_PASSWORD",
                debugLevel: LogDebugLevel.WARNING,
                userId: mockUserId,
                success: false,
                ipAddress: mockIPAddress,
                userAgent: getMockUserAgent(),
                details: "Password change failed: user not found",
            });
        });

        it("logs a successful CHANGE_PASSWORD audit entry", async () => {
            mockBcryptCompare.mockResolvedValue(true as any);
            await changePassword(baseProps);

            expect(mockLogSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith({
                action: "CHANGE_PASSWORD",
                debugLevel: LogDebugLevel.SUCCESS,
                userId: mockUserId,
                success: true,
                ipAddress: mockIPAddress,
                userAgent: getMockUserAgent(),
                details: "Password changed successfully",
            });
        });
    });
});
