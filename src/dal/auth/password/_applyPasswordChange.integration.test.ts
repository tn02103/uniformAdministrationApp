/**
 * Integration Tests for applyPasswordChange
 *
 * Tests the shared post-authorisation helper against a real PostgreSQL database.
 * Verifies password hashing, session/token invalidation, and audit logging.
 *
 * Mocked:
 *  - next/server (userAgent)
 *  - @/lib/email/passwordChangedEmail — prevent real email sending
 *  - @/lib/ironSession — not needed by applyPasswordChange directly
 *
 * Not mocked: Prisma, bcrypt (hash), logSecurityAuditEntry
 */

import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { staticData } from "../../../../vitest/setup-dal-integration";
import { getMockUserAgent } from "../__testHelpers__/mockData";
import { applyPasswordChange } from "./_applyPasswordChange";
import { logSecurityAuditEntry } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";

vi.mock("next/server", () => ({
    userAgent: vi.fn(() => getMockUserAgent()),
}));

vi.mock("@/lib/email/passwordChangedEmail", () => ({
    sendPasswordChangedEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../helper", () => ({
    logSecurityAuditEntry: vi.fn(),
}));

const TEST_IP = "10.1.0.1";

describe("applyPasswordChange", () => {
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
        // Reset user password and changePasswordOnLogin flag
        await prisma.user.update({
            where: { id: testUserId },
            data: { password: "OldHashedPassword!", changePasswordOnLogin: false },
        });
        // Restore sessions to valid state
        await prisma.session.updateMany({
            where: { deviceId: { in: [testDeviceId, otherDeviceId] } },
            data: { valid: true },
        });
        // Remove any leftover refresh tokens
        await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
    });

    describe("password update", () => {
        it("replaces the user's password with a bcrypt hash of newPassword", async () => {
            await applyPasswordChange(testUserId, "NewPass1!", testSessionId, "CHANGE_PASSWORD", TEST_IP, getMockUserAgent());

            const user = await prisma.user.findUnique({ where: { id: testUserId }, select: { password: true } });
            expect(user?.password).not.toBe("OldHashedPassword!");
            const isHashed = await bcrypt.compare("NewPass1!", user!.password);
            expect(isHashed).toBe(true);
        });

        it("sets changePasswordOnLogin to false in the DB", async () => {
            await prisma.user.update({ where: { id: testUserId }, data: { changePasswordOnLogin: true } });

            await applyPasswordChange(testUserId, "NewPass1!", testSessionId, "CHANGE_PASSWORD", TEST_IP, getMockUserAgent());

            const user = await prisma.user.findUnique({ where: { id: testUserId }, select: { changePasswordOnLogin: true } });
            expect(user?.changePasswordOnLogin).toBe(false);
        });
    });

    describe("session invalidation", () => {
        it("invalidates other sessions for the user (keeps current session alive)", async () => {
            await applyPasswordChange(testUserId, "NewPass1!", testSessionId, "CHANGE_PASSWORD", TEST_IP, getMockUserAgent());

            const currentSession = await prisma.session.findUnique({ where: { id: testSessionId } });
            const otherSession = await prisma.session.findUnique({ where: { id: otherSessionId } });

            // Current session must remain valid
            expect(currentSession?.valid).toBe(true);
            // Other session for this user must be invalidated
            expect(otherSession?.valid).toBe(false);
        });

        it("invalidates all sessions when currentSessionId is undefined", async () => {
            await applyPasswordChange(testUserId, "NewPass1!", undefined, "CHANGE_PASSWORD", TEST_IP, getMockUserAgent());

            const sessions = await prisma.session.findMany({
                where: { device: { userId: testUserId } },
                select: { id: true, valid: true },
            });
            for (const session of sessions) {
                expect(session.valid).toBe(false);
            }
        });
    });

    describe("refresh token cleanup", () => {
        it("deletes other refresh tokens (keeps tokens for current session)", async () => {
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
                        issuerIpAddress: TEST_IP,
                    },
                    {
                        id: otherTokenId,
                        token: randomUUID().replace(/-/g, ""),
                        userId: testUserId,
                        deviceId: otherDeviceId,
                        sessionId: otherSessionId,
                        endOfLife: new Date(Date.now() + 3600_000),
                        tokenFamilyId: randomUUID(),
                        issuerIpAddress: TEST_IP,
                    },
                ],
            });

            await applyPasswordChange(testUserId, "NewPass1!", testSessionId, "CHANGE_PASSWORD", TEST_IP, getMockUserAgent());

            expect(await prisma.refreshToken.findUnique({ where: { id: currentTokenId } })).not.toBeNull();
            expect(await prisma.refreshToken.findUnique({ where: { id: otherTokenId } })).toBeNull();
        });

        it("deletes all refresh tokens when currentSessionId is undefined", async () => {
            await prisma.refreshToken.createMany({
                data: [
                    {
                        token: randomUUID().replace(/-/g, ""),
                        userId: testUserId,
                        deviceId: testDeviceId,
                        sessionId: testSessionId,
                        endOfLife: new Date(Date.now() + 3600_000),
                        tokenFamilyId: randomUUID(),
                        issuerIpAddress: TEST_IP,
                    },
                    {
                        token: randomUUID().replace(/-/g, ""),
                        userId: testUserId,
                        deviceId: otherDeviceId,
                        sessionId: otherSessionId,
                        endOfLife: new Date(Date.now() + 3600_000),
                        tokenFamilyId: randomUUID(),
                        issuerIpAddress: TEST_IP,
                    },
                ],
            });

            await applyPasswordChange(testUserId, "NewPass1!", undefined, "CHANGE_PASSWORD", TEST_IP, getMockUserAgent());

            const remaining = await prisma.refreshToken.findMany({ where: { userId: testUserId } });
            expect(remaining).toHaveLength(0);
        });
    });

    describe("audit action", () => {
        it("passes the auditAction to logSecurityAuditEntry — CHANGE_PASSWORD variant", async () => {
            await expect(
                applyPasswordChange(testUserId, "NewPass1!", testSessionId, "CHANGE_PASSWORD", TEST_IP, getMockUserAgent())
            ).resolves.toBeUndefined();

            expect(logSecurityAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: "CHANGE_PASSWORD",
                    debugLevel: LogDebugLevel.SUCCESS,
                    userId: testUserId,
                    success: true,
                    ipAddress: TEST_IP,
                    userAgent: getMockUserAgent(),
                    details: "Password changed successfully",
                })
            );
        });

        it("passes the auditAction to logSecurityAuditEntry — FORCED_CHANGE_PASSWORD variant", async () => {
            await prisma.user.update({ where: { id: testUserId }, data: { password: "OldHashedPassword!" } });
            await applyPasswordChange(testUserId, "NewPass1!", testSessionId, "FORCED_CHANGE_PASSWORD", TEST_IP, getMockUserAgent());
            expect(logSecurityAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: "FORCED_CHANGE_PASSWORD",
                    debugLevel: LogDebugLevel.SUCCESS,
                    userId: testUserId,
                    success: true,
                    ipAddress: TEST_IP,
                    userAgent: getMockUserAgent(),
                    details: "Password changed successfully",
                })
            );
        });
    });
});
