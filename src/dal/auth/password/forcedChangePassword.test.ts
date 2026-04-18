import { genericSAValidator } from "@/actions/validations";
import { getIronSession } from "@/lib/ironSession";
import { prismaMock } from "@test-utils/prisma-mock";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { getMockUserAgent } from "../__testHelpers__/mockData";
import { getIPAddress, logSecurityAuditEntry } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { applyPasswordChange } from "./_applyPasswordChange";
import { forcedChangePassword } from "./forcedChangePassword";

const mockRateLimiterInstance = vi.hoisted(() => ({
    get: vi.fn().mockResolvedValue(null),
    consume: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("rate-limiter-flexible", () => ({
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
vi.mock("./_applyPasswordChange", () => ({
    applyPasswordChange: vi.fn(),
}));

const mockGenericSAValidator = vi.mocked(genericSAValidator);
const mockGetIronSession = vi.mocked(getIronSession);
const mockHeaders = vi.mocked(headers);
const mockUserAgent = vi.mocked(userAgent);
const mockGetIPAddress = vi.mocked(getIPAddress);
const mockLogSecurityAuditEntry = vi.mocked(logSecurityAuditEntry);
const mockApplyPasswordChange = vi.mocked(applyPasswordChange);

const mockUserId = "user-id-123";
const mockSessionId = "session-id-abc";
const mockIPAddress = "1.2.3.4";

describe("forcedChangePassword", () => {
    const baseProps = {
        newPassword: "NewPassword1!",
    };

    const mockSession = {
        sessionId: mockSessionId,
        user: {
            id: mockUserId,
            changePasswordOnLogin: true,
        },
        save: vi.fn().mockResolvedValue(undefined),
    };

    beforeEach(() => {
        prismaMock.user.findUnique.mockResolvedValue({ changePasswordOnLogin: true } as any);
        mockGenericSAValidator.mockResolvedValue([
            { id: mockUserId, organisationId: "test-org-id", name: "Test User", username: "testuser", role: 1, acronym: "TEST" },
            baseProps,
        ] as any);
        mockGetIronSession.mockResolvedValue({ ...mockSession, save: vi.fn().mockResolvedValue(undefined) } as any);
        mockHeaders.mockResolvedValue({} as any);
        mockUserAgent.mockReturnValue(getMockUserAgent());
        mockGetIPAddress.mockReturnValue(mockIPAddress);
        mockLogSecurityAuditEntry.mockResolvedValue(undefined);
        mockApplyPasswordChange.mockResolvedValue(undefined);
        mockRateLimiterInstance.get.mockResolvedValue(null);
        mockRateLimiterInstance.consume.mockResolvedValue(undefined);
    });

    afterEach(() => vi.clearAllMocks());

    describe("authentication guard", () => {
        it("delegates auth to genericSAValidator", async () => {
            await forcedChangePassword(baseProps);

            expect(mockGenericSAValidator).toHaveBeenCalledWith(
                expect.anything(),
                baseProps,
                expect.anything(),
            );
        });

        it("rejects unauthenticated calls via genericSAValidator", async () => {
            mockGenericSAValidator.mockRejectedValue(new Error("Unauthorized"));

            await expect(forcedChangePassword(baseProps)).rejects.toThrow("Unauthorized");
            expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
        });
    });

    describe("user lookup", () => {
        it("throws when user is not found in DB", async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            await expect(forcedChangePassword(baseProps)).rejects.toThrow("User not found");

            expect(mockApplyPasswordChange).not.toHaveBeenCalled();
        });

        it("queries only the changePasswordOnLogin field", async () => {
            await forcedChangePassword(baseProps);

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: mockUserId },
                    select: { changePasswordOnLogin: true },
                })
            );
        });
    });

    describe("security guard — bypass rejected", () => {
        it("throws when changePasswordOnLogin is false", async () => {
            prismaMock.user.findUnique.mockResolvedValue({ changePasswordOnLogin: false } as any);

            await expect(forcedChangePassword(baseProps)).rejects.toThrow("Password change not required");

            expect(mockApplyPasswordChange).not.toHaveBeenCalled();
        });

        it("logs a WARNING audit entry when bypass is attempted", async () => {
            prismaMock.user.findUnique.mockResolvedValue({ changePasswordOnLogin: false } as any);

            await expect(forcedChangePassword(baseProps)).rejects.toThrow();

            expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: "FORCED_CHANGE_PASSWORD",
                    debugLevel: LogDebugLevel.WARNING,
                    userId: mockUserId,
                    success: false,
                })
            );
        });
    });

    describe("success path", () => {
        it("returns undefined on success", async () => {
            const result = await forcedChangePassword(baseProps);
            expect(result).toBeUndefined();
        });

        it("calls applyPasswordChange with correct arguments", async () => {
            await forcedChangePassword(baseProps);

            expect(mockApplyPasswordChange).toHaveBeenCalledWith(
                mockUserId,
                baseProps.newPassword,
                mockSessionId,
                "FORCED_CHANGE_PASSWORD",
                mockIPAddress,
                getMockUserAgent(),
            );
        });

        it("updates the iron-session changePasswordOnLogin flag to false after DB change", async () => {
            const mockSave = vi.fn().mockResolvedValue(undefined);
            const sessionObj = {
                sessionId: mockSessionId,
                user: {
                    id: mockUserId,
                    changePasswordOnLogin: true,
                },
                save: mockSave,
            };
            mockGetIronSession.mockResolvedValue(sessionObj as any);

            await forcedChangePassword(baseProps);

            expect(sessionObj.user.changePasswordOnLogin).toBe(false);
            expect(mockSave).toHaveBeenCalled();
        });

        it("saves the session after applyPasswordChange completes", async () => {
            const mockSave = vi.fn().mockResolvedValue(undefined);
            mockGetIronSession.mockResolvedValue({
                sessionId: mockSessionId,
                user: { id: mockUserId, changePasswordOnLogin: true },
                save: mockSave,
            } as any);

            await forcedChangePassword(baseProps);

            const applyOrder = mockApplyPasswordChange.mock.invocationCallOrder[0];
            const saveOrder = mockSave.mock.invocationCallOrder[0];
            expect(applyOrder).toBeLessThan(saveOrder);
        });
    });

    describe("rate limiting", () => {
        it("returns tooManyRequests when rate limit is exhausted", async () => {
            mockRateLimiterInstance.get.mockResolvedValue({ remainingPoints: 0 });

            const result = await forcedChangePassword(baseProps);

            expect(result).toEqual({ error: { tooManyRequests: true } });
            expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
            expect(mockApplyPasswordChange).not.toHaveBeenCalled();
        });

        it("consumes a rate-limit point on each call", async () => {
            await forcedChangePassword(baseProps);

            expect(mockRateLimiterInstance.consume).toHaveBeenCalledWith(mockUserId);
        });

        it("does not consume a rate-limit point when already exceeded", async () => {
            mockRateLimiterInstance.get.mockResolvedValue({ remainingPoints: 0 });

            await forcedChangePassword(baseProps);

            expect(mockRateLimiterInstance.consume).not.toHaveBeenCalled();
        });
    });
});
