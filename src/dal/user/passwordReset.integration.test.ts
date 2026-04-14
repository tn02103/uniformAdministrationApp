import { randomBytes } from "crypto";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { staticData, wrongOrganisation } from "../../../vitest/setup-dal-integration";
import { runServerActionTest } from "../_helper/testHelper";
import { adminTriggerPasswordReset } from "./passwordReset";

vi.mock("next/headers", () => ({
    headers: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue("127.0.0.1") }),
}));

vi.mock("next/server", () => ({
    userAgent: vi.fn().mockReturnValue({ ua: "test-agent" }),
}));

/** Create a minimal active RefreshToken for a given userId/deviceId/sessionId. */
const seedRefreshToken = (userId: string, deviceId: string, sessionId: string) =>
    prisma.refreshToken.create({
        data: {
            token: randomBytes(32).toString("hex"), // 64 hex chars
            userId,
            deviceId,
            sessionId,
            endOfLife: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            status: "active",
            tokenFamilyId: randomBytes(16).toString("hex").slice(0, 36),
            issuerIpAddress: "127.0.0.1",
        },
    });

describe("<User> adminTriggerPasswordReset", () => {
    beforeAll(async () => {
        global.__ROLE__ = AuthRole.admin;
        await prisma.refreshToken.deleteMany({
            where: { userId: staticData.ids.userIds[1] },
        });
        await staticData.cleanup.user();
    });

    afterEach(async () => {
        global.__ROLE__ = AuthRole.admin;
        await prisma.refreshToken.deleteMany({
            where: { userId: staticData.ids.userIds[1] },
        });
        await staticData.cleanup.user();
    });

    afterAll(() => {
        delete global.__ROLE__;
    });

    // target: manager (userIds[1]), caller: admin (userIds[0])
    const targetId = staticData.ids.userIds[1];

    it("returns { success: true } and a temp password matching the expected format", async () => {
        const result = await adminTriggerPasswordReset({ id: targetId });

        expect(result.success).toBe(true);
        expect(result.tempPassword).toMatch(
            /^[23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ]{6}$/
        );
    });

    it("sets changePasswordOnLogin: true and resets failedLoginCount to 0", async () => {
        await adminTriggerPasswordReset({ id: targetId });

        const user = await prisma.user.findUnique({ where: { id: targetId } });
        expect(user?.changePasswordOnLogin).toBe(true);
        expect(user?.failedLoginCount).toBe(0);
    });

    it("replaces the user's password hash", async () => {
        const before = await prisma.user.findUnique({ where: { id: targetId } });

        await adminTriggerPasswordReset({ id: targetId });

        const after = await prisma.user.findUnique({ where: { id: targetId } });
        expect(after?.password).not.toBe(before?.password);
        expect(after?.password).toMatch(/^\$2b\$12\$/); // bcrypt with 12 rounds
    });

    it("revokes all active refresh tokens for the target user", async () => {
        // Seed two active tokens for the manager's seeded sessions
        const { userIds, deviceIds, sessionIds } = staticData.ids;
        await Promise.all([
            seedRefreshToken(userIds[1], deviceIds[2], sessionIds[2]),
            seedRefreshToken(userIds[1], deviceIds[3], sessionIds[3]),
        ]);

        await adminTriggerPasswordReset({ id: targetId });

        const tokens = await prisma.refreshToken.findMany({
            where: { userId: userIds[1] },
        });
        expect(tokens.length).toBeGreaterThan(0);
        expect(tokens.every((t) => t.status === "revoked")).toBe(true);
    });

    it("invalidates all valid sessions for the target user", async () => {
        // Manager has valid sessions at sessionIds[2], sessionIds[3], sessionIds[8] (seeded)
        await adminTriggerPasswordReset({ id: targetId });

        const validSessions = await prisma.session.findMany({
            where: {
                device: { userId: targetId },
                valid: true,
            },
        });
        expect(validSessions).toHaveLength(0);
    });

    it("does not invalidate sessions belonging to other users", async () => {
        await adminTriggerPasswordReset({ id: targetId });

        // Admin's sessions should still be valid
        const adminValidSessions = await prisma.session.findMany({
            where: {
                device: { userId: staticData.ids.userIds[0] },
                valid: true,
            },
        });
        expect(adminValidSessions.length).toBeGreaterThan(0);
    });

    it("rejects cross-org: admin cannot reset a user from another organisation", async () => {
        const wrongOrgUserId = wrongOrganisation.ids.userIds[0];

        const { success } = await runServerActionTest(
            adminTriggerPasswordReset({ id: wrongOrgUserId })
        );
        expect(success).toBe(false);
    });

    it("rejects non-admin: manager role cannot trigger a password reset", async () => {
        global.__ROLE__ = AuthRole.materialManager;

        const { success } = await runServerActionTest(
            adminTriggerPasswordReset({ id: staticData.ids.userIds[3] })
        );
        expect(success).toBe(false);
    });
});
