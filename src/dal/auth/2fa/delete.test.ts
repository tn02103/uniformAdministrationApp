import { prismaMock } from "@test-utils/prisma-mock";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { getIPAddress, logSecurityAuditEntry } from "../helper";
import { removeVerifiedTwoFactorApp } from "./delete";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/server", () => ({ userAgent: vi.fn() }));
vi.mock("../helper", () => ({
    getIPAddress: vi.fn().mockReturnValue("1.2.3.4"),
    logSecurityAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

const mockHeaders = vi.mocked(headers);
const mockUserAgent = vi.mocked(userAgent);
const mockLogSecurityAuditEntry = vi.mocked(logSecurityAuditEntry);

beforeEach(() => {
    mockHeaders.mockResolvedValue({} as never);
    mockUserAgent.mockReturnValue({} as never);
});

afterEach(() => vi.clearAllMocks());

const USER_ID = "test-user-id";
const APP_ID = "aaaaaaaa-0000-0000-0000-000000000001";
const OTHER_APP_ID = "bbbbbbbb-0000-0000-0000-000000000002";

const mockApp = {
    id: APP_ID,
    userId: USER_ID,
    verifiedAt: new Date("2025-01-01T00:00:00.000Z"),
};

describe("removeVerifiedTwoFactorApp", () => {
    it("happy path: deletes verified app and returns success", async () => {
        prismaMock.twoFactorApp.findUnique.mockResolvedValue(mockApp);
        prismaMock.user.findUnique.mockResolvedValue({ default2FAMethod: OTHER_APP_ID } as never);
        prismaMock.twoFactorApp.delete.mockResolvedValue(mockApp);

        const result = await removeVerifiedTwoFactorApp({ appId: APP_ID });
        expect(result).toEqual({ success: true });
        expect(prismaMock.twoFactorApp.delete).toHaveBeenCalledWith({ where: { id: APP_ID, userId: USER_ID } });
        // defaultMethod is not the deleted app — no user update
        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("happy path: deletes unverified app and returns success", async () => {
        prismaMock.twoFactorApp.findUnique.mockResolvedValue({ ...mockApp, verifiedAt: null });
        prismaMock.user.findUnique.mockResolvedValue({ default2FAMethod: OTHER_APP_ID } as never);
        prismaMock.twoFactorApp.delete.mockResolvedValue(mockApp);

        const result = await removeVerifiedTwoFactorApp({ appId: APP_ID });
        expect(result).toEqual({ success: true });
        expect(prismaMock.twoFactorApp.delete).toHaveBeenCalledWith({ where: { id: APP_ID, userId: USER_ID } });
    });

    it("throws when app not found", async () => {
        prismaMock.twoFactorApp.findUnique.mockResolvedValue(null);

        await expect(removeVerifiedTwoFactorApp({ appId: APP_ID }))
            .rejects.toThrow("Two-factor app not found");

        expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("throws when app belongs to a different user", async () => {
        prismaMock.twoFactorApp.findUnique.mockResolvedValue({ ...mockApp, userId: "other-user-id" });

        await expect(removeVerifiedTwoFactorApp({ appId: APP_ID }))
            .rejects.toThrow("Two-factor app does not belong to the current user");

        expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("sets defaultMethod to another existing app when deleted app was the default", async () => {
        prismaMock.twoFactorApp.findUnique.mockResolvedValue(mockApp);
        prismaMock.user.findUnique.mockResolvedValue({ default2FAMethod: APP_ID } as never);
        prismaMock.twoFactorApp.delete.mockResolvedValue(mockApp);
        prismaMock.twoFactorApp.findMany.mockResolvedValue([{ id: OTHER_APP_ID }] as never);
        prismaMock.user.update.mockResolvedValue({} as never);

        await removeVerifiedTwoFactorApp({ appId: APP_ID });

        expect(prismaMock.user.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: { default2FAMethod: OTHER_APP_ID } })
        );
    });

    it("sets defaultMethod to 'email' when deleted app was the default and no other apps remain", async () => {
        prismaMock.twoFactorApp.findUnique.mockResolvedValue(mockApp);
        prismaMock.user.findUnique.mockResolvedValue({ default2FAMethod: APP_ID } as never);
        prismaMock.twoFactorApp.delete.mockResolvedValue(mockApp);
        prismaMock.twoFactorApp.findMany.mockResolvedValue([]);
        prismaMock.user.update.mockResolvedValue({} as never);

        await removeVerifiedTwoFactorApp({ appId: APP_ID });

        expect(prismaMock.user.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: { default2FAMethod: "email" } })
        );
    });

    it("does not update user when deleted app was not the default", async () => {
        prismaMock.twoFactorApp.findUnique.mockResolvedValue(mockApp);
        prismaMock.user.findUnique.mockResolvedValue({ default2FAMethod: OTHER_APP_ID } as never);
        prismaMock.twoFactorApp.delete.mockResolvedValue(mockApp);

        await removeVerifiedTwoFactorApp({ appId: APP_ID });

        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("logs success on successful deletion", async () => {
        prismaMock.twoFactorApp.findUnique.mockResolvedValue(mockApp);
        prismaMock.user.findUnique.mockResolvedValue({ default2FAMethod: OTHER_APP_ID } as never);
        prismaMock.twoFactorApp.delete.mockResolvedValue(mockApp);

        await removeVerifiedTwoFactorApp({ appId: APP_ID });

        expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, action: "REMOVE_2FA_APP" })
        );
    });
});

