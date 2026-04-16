/**
 * Unit tests for adminTriggerPasswordReset — focused on internal logic that
 * cannot be meaningfully exercised against a real database:
 *   - bcrypt is invoked with the correct cost factor
 *   - the generated temp password conforms to the expected format
 *
 * All DB-interaction coverage (transaction effects, session/token revocation,
 * org-scoping, role enforcement) lives in passwordReset.integration.test.ts.
 */

import { prismaMock } from "@test-utils/prisma-mock";
import { hash } from "bcrypt";
import { adminTriggerPasswordReset } from "./passwordReset";

vi.mock("bcrypt", () => ({
    hash: vi.fn().mockResolvedValue("$2b$12$mocked-bcrypt-hash"),
}));

vi.mock("next/headers", () => ({
    headers: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue("127.0.0.1") }),
}));

vi.mock("next/server", () => ({
    userAgent: vi.fn().mockReturnValue({ ua: "test-agent" }),
}));

vi.mock("@/dal/auth/helper", () => ({
    getIPAddress: vi.fn().mockReturnValue("127.0.0.1"),
    logSecurityAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

const mockBcryptHash = vi.mocked(hash);
const validUserId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("adminTriggerPasswordReset — unit", () => {
    beforeEach(() => {
        prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 0 });
        prismaMock.session.updateMany.mockResolvedValue({ count: 0 });
        prismaMock.user.update.mockResolvedValue({} as never);
    });

    afterEach(() => vi.clearAllMocks());

    it("hashes the temp password with bcrypt 12 rounds", async () => {
        await adminTriggerPasswordReset({ id: validUserId });
        expect(mockBcryptHash).toHaveBeenCalledWith(expect.any(String), 12);
    });

    it("returns a temp password in XXXX-XXXXXX format using only typeable characters", async () => {
        const typeable = /^[23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;
        for (let i = 0; i < 20; i++) {
            const result = await adminTriggerPasswordReset({ id: validUserId });
            expect(result.tempPassword).toMatch(typeable);
        }
    });
});
