import { prismaMock } from "@test-utils/prisma-mock";
import { getOwnProfileData } from "./get";

afterEach(() => vi.clearAllMocks());

const USER_ID = "test-user-id";
const ORG_ID = "test-organisation-id";

const mockUser = {
    id: USER_ID,
    name: "Test User",
    username: "testuser",
    email: "test@example.com",
    role: "user",
    active: true,
    twoFAEnabled: false,
    default2FAMethod: null,
    organisation: {
        name: "Test Organisation",
        organisationConfiguration: {
            twoFactorAuthRule: "optional",
        },
    },
    twoFactorApps: [
        {
            id: "aaaaaaaa-0000-0000-0000-000000000001",
            appName: "Authenticator",
            verifiedAt: new Date("2025-01-01T00:00:00.000Z"),
        },
    ],
    devices: [
        {
            id: "bbbbbbbb-0000-0000-0000-000000000001",
            name: "Test Device",
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
            lastUsedAt: new Date("2025-06-01T00:00:00.000Z"),
            valid: true,
        },
    ],
};

describe("getOwnProfileData", () => {
    it("happy path: returns user data with organisation and twoFactorApps", async () => {
        prismaMock.user.findUnique.mockResolvedValue(mockUser as never);

        const result = await getOwnProfileData();

        expect(result).toEqual(mockUser);
        expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    id: USER_ID,
                    organisationId: ORG_ID,
                }),
            })
        );
    });

    it("returns null when user is not found", async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const result = await getOwnProfileData();

        expect(result).toBeNull();
        expect(prismaMock.user.findUnique).toHaveBeenCalledOnce();
    });

    it("scopes query to the user's own organisationId", async () => {
        prismaMock.user.findUnique.mockResolvedValue(mockUser as never);

        await getOwnProfileData();

        expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: USER_ID,
                    organisationId: ORG_ID,
                },
            })
        );
    });

    it("includes only verified twoFactorApps in the query filter", async () => {
        prismaMock.user.findUnique.mockResolvedValue(mockUser as never);

        await getOwnProfileData();

        expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
                select: expect.objectContaining({
                    twoFactorApps: expect.objectContaining({
                        where: { verifiedAt: { not: null } },
                    }),
                }),
            })
        );
    });
});
