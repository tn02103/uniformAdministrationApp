/**
 * Integration Tests for forcedChangePassword
 *
 * Tests the full forced password change flow against a real PostgreSQL database.
 * Focuses on DB-relevant behaviour: security guard, password update, session
 * invalidation. Unit tests cover rate-limiting and non-DB logic.
 *
 * Mocked:
 *  - next/headers, next/server — no Next.js request context
 *  - @/lib/ironSession — session is set via global.__* helpers from setup-dal-integration
 *  - @/lib/email/passwordChangedEmail — prevent real email sending
 *  - rate-limiter-flexible — bypass rate limiting so tests can repeat calls freely
 */

import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { staticData } from "../../../../vitest/setup-dal-integration";
import { getMockUserAgent } from "../__testHelpers__/mockData";
import { forcedChangePassword } from "./forcedChangePassword";

// ===== RATE LIMITER — bypassed for integration tests =====
vi.mock("rate-limiter-flexible", () => ({
    RateLimiterMemory: class {
        get = vi.fn().mockResolvedValue(null);
        consume = vi.fn().mockResolvedValue(undefined);
    },
}));

// ===== NEXT.JS MOCKS =====
vi.mock("next/headers", () => ({
    headers: vi.fn(async () => ({ get: vi.fn().mockReturnValue("10.2.0.1") })),
}));
vi.mock("next/server", () => ({
    userAgent: vi.fn(() => getMockUserAgent()),
}));

// ===== EMAIL MOCK =====
vi.mock("@/lib/email/passwordChangedEmail", () => ({
    sendPasswordChangedEmail: vi.fn().mockResolvedValue(undefined),
}));

// ===== IRON SESSION MOCK =====
// setup-dal-integration already mocks @/lib/ironSession with the staticData user.
// Override to add changePasswordOnLogin and a save spy.
const mockSave = vi.fn().mockResolvedValue(undefined);
const mockGetIronSession = vi.mocked(getIronSession);

describe("forcedChangePassword integration", () => {
    let testUserId: string;
    let testDeviceId: string;
    let testSessionId: string;
    let otherSessionId: string;
    let otherDeviceId: string;

    beforeAll(async () => {
        await staticData.resetData();
        testUserId = staticData.ids.userIds[0];
        testDeviceId = staticData.ids.deviceIds[0];
        testSessionId = staticData.ids.sessionIds[0];
        otherSessionId = staticData.ids.sessionIds[1];
        otherDeviceId = staticData.ids.deviceIds[1];
    });

    afterAll(async () => {
        await staticData.cleanup.removeOrganisation();
    });

    beforeEach(async () => {
        vi.clearAllMocks();

        // Force the session to have changePasswordOnLogin=true for most tests
        mockGetIronSession.mockResolvedValue({
            sessionId: testSessionId,
            user: {
                id: testUserId,
                name: "Test Admin",
                username: "test4",
                organisationId: staticData.organisationId,
                acronym: staticData.data.organisation.acronym,
                role: 4,
                changePasswordOnLogin: true,
            },
            save: mockSave,
        } as any);

        // Reset user to a known state
        await prisma.user.update({
            where: { id: testUserId },
            data: { password: "OldHashedPassword!", changePasswordOnLogin: true },
        });
        // Restore sessions to valid
        await prisma.session.updateMany({
            where: { deviceId: { in: [testDeviceId, otherDeviceId] } },
            data: { valid: true },
        });
        // Remove leftover refresh tokens
        await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
    });

    describe("security guard", () => {
        it("throws when DB changePasswordOnLogin is false even if session flag is true", async () => {
            await prisma.user.update({
                where: { id: testUserId },
                data: { changePasswordOnLogin: false },
            });

            await expect(
                forcedChangePassword({ newPassword: "NewPass1!" })
            ).rejects.toThrow("Password change not required");
        });

        it("does not update the password when the security guard fires", async () => {
            await prisma.user.update({
                where: { id: testUserId },
                data: { changePasswordOnLogin: false },
            });

            await expect(
                forcedChangePassword({ newPassword: "NewPass1!" })
            ).rejects.toThrow();

            const user = await prisma.user.findUnique({ where: { id: testUserId }, select: { password: true } });
            expect(user?.password).toBe("OldHashedPassword!");
        });
    });

    describe("success path", () => {
        it("updates the user's password in the DB", async () => {
            await forcedChangePassword({ newPassword: "NewPass1!" });

            const user = await prisma.user.findUnique({ where: { id: testUserId }, select: { password: true } });
            const isHashed = await bcrypt.compare("NewPass1!", user!.password);
            expect(isHashed).toBe(true);
        });

        it("clears changePasswordOnLogin to false in the DB", async () => {
            await forcedChangePassword({ newPassword: "NewPass1!" });

            const user = await prisma.user.findUnique({ where: { id: testUserId }, select: { changePasswordOnLogin: true } });
            expect(user?.changePasswordOnLogin).toBe(false);
        });

        it("invalidates other sessions (keeps current session alive)", async () => {
            await forcedChangePassword({ newPassword: "NewPass1!" });

            const currentSession = await prisma.session.findUnique({ where: { id: testSessionId } });
            const otherSession = await prisma.session.findUnique({ where: { id: otherSessionId } });

            expect(currentSession?.valid).toBe(true);
            expect(otherSession?.valid).toBe(false);
        });

        it("deletes refresh tokens for other sessions", async () => {
            const currentTokenId = randomUUID();
            const otherTokenId = randomUUID();

            await prisma.refreshToken.createMany({
                data: [
                    {
                        id: currentTokenId,
                        token: randomUUID().replace(/-/g, ""),
                        userId: testUserId,
                        deviceId: testDeviceId,
                        sessionId: testSessionId,
                        endOfLife: new Date(Date.now() + 3600_000),
                        tokenFamilyId: randomUUID(),
                        issuerIpAddress: "10.2.0.1",
                    },
                    {
                        id: otherTokenId,
                        token: randomUUID().replace(/-/g, ""),
                        userId: testUserId,
                        deviceId: otherDeviceId,
                        sessionId: otherSessionId,
                        endOfLife: new Date(Date.now() + 3600_000),
                        tokenFamilyId: randomUUID(),
                        issuerIpAddress: "10.2.0.1",
                    },
                ],
            });

            await forcedChangePassword({ newPassword: "NewPass1!" });

            expect(await prisma.refreshToken.findUnique({ where: { id: currentTokenId } })).not.toBeNull();
            expect(await prisma.refreshToken.findUnique({ where: { id: otherTokenId } })).toBeNull();
        });

        it("returns undefined on success", async () => {
            const result = await forcedChangePassword({ newPassword: "NewPass1!" });
            expect(result).toBeUndefined();
        });

        it("saves the iron-session with changePasswordOnLogin=false after DB change", async () => {
            const sessionObj = {
                sessionId: testSessionId,
                user: {
                    id: testUserId,
                    name: "Test Admin",
                    username: "test4",
                    organisationId: staticData.organisationId,
                    acronym: staticData.data.organisation.acronym,
                    role: 4,
                    changePasswordOnLogin: true,
                },
                save: mockSave,
            };
            mockGetIronSession.mockResolvedValue(sessionObj as any);

            await forcedChangePassword({ newPassword: "NewPass1!" });

            expect(sessionObj.user.changePasswordOnLogin).toBe(false);
            expect(mockSave).toHaveBeenCalled();
        });
    });
});
