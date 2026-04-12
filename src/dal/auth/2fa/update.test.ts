import { prismaMock } from "@test-utils/prisma-mock";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { getIPAddress, logSecurityAuditEntry } from "../helper";
import { setDefault2FAMethod, toggleUserTwoFA } from "./update";
import { AuthRole } from "@/lib/AuthRoles";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/server", () => ({ userAgent: vi.fn() }));
vi.mock("../helper", () => ({
    getIPAddress: vi.fn().mockReturnValue("1.2.3.4"),
    logSecurityAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

const mockHeaders = vi.mocked(headers);
const mockUserAgent = vi.mocked(userAgent);

beforeEach(() => {
    mockHeaders.mockResolvedValue({} as never);
    mockUserAgent.mockReturnValue({} as never);
});

afterEach(() => vi.clearAllMocks());

const USER_ID = "test-user-id";
const APP_ID = "aaaaaaaa-0000-0000-0000-000000000001";

const verifiedApp = {
    id: APP_ID,
    userId: USER_ID,
    verifiedAt: new Date("2025-01-01T00:00:00.000Z"),
};

describe("setDefault2FAMethod", () => {
    it("sets method to email without any app lookup", async () => {
        prismaMock.user.update.mockResolvedValue({} as never);

        await setDefault2FAMethod({ method: "email" });

        expect(prismaMock.twoFactorApp.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { default2FAMethod: "email" },
            })
        );
    });

    it("sets method to a valid verified appId", async () => {
        prismaMock.twoFactorApp.findUnique.mockResolvedValue(verifiedApp);
        prismaMock.user.update.mockResolvedValue({} as never);

        await setDefault2FAMethod({ method: APP_ID });

        expect(prismaMock.twoFactorApp.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.objectContaining({ id: APP_ID }) })
        );
        expect(prismaMock.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { default2FAMethod: APP_ID },
            })
        );
    });

    it("throws when appId does not exist", async () => {
        prismaMock.twoFactorApp.findUnique.mockResolvedValue(null);

        await expect(setDefault2FAMethod({ method: APP_ID }))
            .rejects.toThrow("Invalid 2FA method");
    });

    it("throws when app is not verified", async () => {
        prismaMock.twoFactorApp.findUnique.mockResolvedValue({
            ...verifiedApp,
            verifiedAt: null,
        } as never);

        await expect(setDefault2FAMethod({ method: APP_ID }))
            .rejects.toThrow("Invalid 2FA method");
    });

    it("throws when app belongs to a different user", async () => {
        prismaMock.twoFactorApp.findUnique.mockResolvedValue({
            ...verifiedApp,
            userId: "other-user-id",
        } as never);

        await expect(setDefault2FAMethod({ method: APP_ID }))
            .rejects.toThrow("Invalid 2FA method");
    });
});

describe("toggleUserTwoFA", () => {
    it("enables 2FA without any org lookup", async () => {
        prismaMock.user.update.mockResolvedValue({} as never);

        await toggleUserTwoFA({ enabled: true });

        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { twoFAEnabled: true },
            })
        );
    });

    it("disables 2FA when org rule is optional", async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            role: AuthRole.user,
            organisation: {
                organisationConfiguration: { twoFactorAuthRule: "optional" },
            },
        } as never);
        prismaMock.user.update.mockResolvedValue({} as never);

        await toggleUserTwoFA({ enabled: false });

        expect(prismaMock.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ twoFAEnabled: false, default2FAMethod: null }),
            })
        );
    });

    it("blocks disabling 2FA when org rule is required", async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            role: AuthRole.user,
            organisation: {
                organisationConfiguration: { twoFactorAuthRule: "required" },
            },
        } as never);

        await expect(toggleUserTwoFA({ enabled: false }))
            .rejects.toThrow("organisation requires two-factor authentication");

        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("blocks disabling 2FA when org rule is administrators and user is admin", async () => {
        global.__ROLE__ = AuthRole.admin;
        prismaMock.user.findUnique.mockResolvedValue({
            role: AuthRole.admin,
            organisation: {
                organisationConfiguration: { twoFactorAuthRule: "administrators" },
            },
        } as never);

        await expect(toggleUserTwoFA({ enabled: false }))
            .rejects.toThrow("administrators are required");

        expect(prismaMock.user.update).not.toHaveBeenCalled();
        global.__ROLE__ = undefined;
    });

    it("allows disabling 2FA when org rule is administrators and user is not admin", async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            role: AuthRole.user,
            organisation: {
                organisationConfiguration: { twoFactorAuthRule: "administrators" },
            },
        } as never);
        prismaMock.user.update.mockResolvedValue({} as never);

        await toggleUserTwoFA({ enabled: false });

        expect(prismaMock.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ twoFAEnabled: false }),
            })
        );
    });
});
