import { prismaMock } from "@test-utils/prisma-mock";
import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { adminRemoveTwoFactorApp } from "./adminReset2FA";

vi.mock("next/headers", () => ({
    headers: vi.fn(async () => ({ get: vi.fn().mockReturnValue(null) })),
}));
vi.mock("next/server", () => ({
    userAgent: vi.fn(() => ({})),
}));
vi.mock("@/dal/auth/helper", () => ({
    getIPAddress: vi.fn().mockReturnValue("127.0.0.1"),
    logSecurityAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

const mockGenericSAValidator = vi.mocked(genericSAValidator);

const ADMIN_ID = "aaaaaaaa-0000-4000-8000-000000000001";
const ADMIN_ORG_ID = "test-organisation-id";
const TARGET_USER_ID = "bbbbbbbb-0000-4000-8000-000000000002";
const APP_1_ID = "cccccccc-0000-4000-8000-000000000003";
const APP_2_ID = "dddddddd-0000-4000-8000-000000000004";
const APP_3_ID = "eeeeeeee-0000-4000-8000-000000000005";

function mockAdminSession() {
    mockGenericSAValidator.mockResolvedValueOnce([
        { id: ADMIN_ID, organisationId: ADMIN_ORG_ID, role: AuthRole.admin } as never,
        { userId: TARGET_USER_ID, appId: APP_1_ID },
    ]);
}

afterEach(() => vi.clearAllMocks());

describe("adminRemoveTwoFactorApp", () => {
    describe("default2FAMethod reassignment", () => {
        it("reassigns default to the most recently verified remaining app when deleted app was the default", async () => {
            mockAdminSession();

            prismaMock.twoFactorApp.findFirst.mockResolvedValue(
                { id: APP_1_ID, userId: TARGET_USER_ID } as never,
            );
            prismaMock.user.findUnique.mockResolvedValue(
                { default2FAMethod: APP_1_ID } as never,
            );
            prismaMock.twoFactorApp.deleteMany.mockResolvedValue({ count: 1 } as never);
            prismaMock.twoFactorApp.findMany.mockResolvedValue([
                { id: APP_2_ID },
                { id: APP_3_ID },
            ] as never);
            prismaMock.user.update.mockResolvedValue({} as never);

            const result = await adminRemoveTwoFactorApp({ userId: TARGET_USER_ID, appId: APP_1_ID });

            expect(result).toEqual({ success: true });
            expect(prismaMock.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { default2FAMethod: APP_2_ID },
                }),
            );
        });

        it("resets default to 'email' when deleted app was the default and no other verified apps remain", async () => {
            mockAdminSession();

            prismaMock.twoFactorApp.findFirst.mockResolvedValue(
                { id: APP_1_ID, userId: TARGET_USER_ID } as never,
            );
            prismaMock.user.findUnique.mockResolvedValue(
                { default2FAMethod: APP_1_ID } as never,
            );
            prismaMock.twoFactorApp.deleteMany.mockResolvedValue({ count: 1 } as never);
            prismaMock.twoFactorApp.findMany.mockResolvedValue([] as never);
            prismaMock.user.update.mockResolvedValue({} as never);

            const result = await adminRemoveTwoFactorApp({ userId: TARGET_USER_ID, appId: APP_1_ID });

            expect(result).toEqual({ success: true });
            expect(prismaMock.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { default2FAMethod: "email" },
                }),
            );
        });

        it("does not update default2FAMethod when the deleted app was not the default", async () => {
            mockAdminSession();

            prismaMock.twoFactorApp.findFirst.mockResolvedValue(
                { id: APP_1_ID, userId: TARGET_USER_ID } as never,
            );
            prismaMock.user.findUnique.mockResolvedValue(
                { default2FAMethod: APP_2_ID } as never,
            );
            prismaMock.twoFactorApp.deleteMany.mockResolvedValue({ count: 1 } as never);

            const result = await adminRemoveTwoFactorApp({ userId: TARGET_USER_ID, appId: APP_1_ID });

            expect(result).toEqual({ success: true });
            expect(prismaMock.user.update).not.toHaveBeenCalled();
        });
    });

    it("throws when app not found", async () => {
        mockAdminSession();

        prismaMock.twoFactorApp.findFirst.mockResolvedValue(null);

        await expect(adminRemoveTwoFactorApp({ userId: TARGET_USER_ID, appId: APP_1_ID }))
            .rejects.toThrow("Two-factor app not found");
    });

    it("throws when app belongs to a different user (userId mismatch)", async () => {
        mockAdminSession();

        prismaMock.twoFactorApp.findFirst.mockResolvedValue(
            { id: APP_1_ID, userId: "different-user-id" } as never,
        );

        await expect(adminRemoveTwoFactorApp({ userId: TARGET_USER_ID, appId: APP_1_ID }))
            .rejects.toThrow("Two-factor app not found");
    });

    it("rejects when caller does not have admin role (validator throws)", async () => {
        mockGenericSAValidator.mockRejectedValueOnce(new Error("Unauthorized"));

        await expect(adminRemoveTwoFactorApp({ userId: TARGET_USER_ID, appId: APP_1_ID }))
            .rejects.toThrow("Unauthorized");

        expect(prismaMock.twoFactorApp.findFirst).not.toHaveBeenCalled();
    });

    it("rejects when userId belongs to a different organisation (validator throws)", async () => {
        mockGenericSAValidator.mockRejectedValueOnce(new Error("Forbidden"));

        await expect(adminRemoveTwoFactorApp({ userId: TARGET_USER_ID, appId: APP_1_ID }))
            .rejects.toThrow("Forbidden");

        expect(prismaMock.twoFactorApp.findFirst).not.toHaveBeenCalled();
    });
});
