import { prisma } from "@/lib/db";
import { staticData, wrongOrganisation } from "../../../../vitest/setup-dal-integration";
import { getOwnProfileData } from "./get";

const APP_1_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee01";
const APP_2_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee02";

async function cleanupApps() {
    await prisma.twoFactorApp.deleteMany({
        where: { userId: staticData.ids.userIds[0] },
    });
}

describe("getOwnProfileData", () => {
    beforeEach(async () => {
        await cleanupApps();
        await prisma.user.update({
            where: { id: staticData.ids.userIds[0] },
            data: { twoFAEnabled: false, default2FAMethod: null },
        });
    });

    afterEach(async () => {
        await cleanupApps();
    });

    it("returns user data including organisation config and empty twoFactorApps", async () => {
        const result = await getOwnProfileData();

        expect(result).not.toBeNull();
        expect(result?.id).toBe(staticData.ids.userIds[0]);
        expect(result?.organisation?.organisationConfiguration?.twoFactorAuthRule).toBe("optional");
        expect(result?.twoFactorApps).toHaveLength(0);
    });

    it("returns only twoFactorApps that are verified, ordered by verifiedAt asc", async () => {
        const earlier = new Date("2025-01-01T10:00:00Z");
        const later = new Date("2025-03-01T10:00:00Z");

        await prisma.twoFactorApp.createMany({
            data: [
                { id: APP_2_ID, userId: staticData.ids.userIds[0], appName: "App2", secret: "S2", verifiedAt: later },
                { id: APP_1_ID, userId: staticData.ids.userIds[0], appName: "App1", secret: "S1", verifiedAt: earlier },
            ],
        });
        // Insert an unverified app that should be excluded
        await prisma.twoFactorApp.create({
            data: { id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee03", userId: staticData.ids.userIds[0], appName: "Unverified", secret: "SX", verifiedAt: null },
        });

        const result = await getOwnProfileData();

        expect(result?.twoFactorApps).toHaveLength(2);
        expect(result?.twoFactorApps[0].id).toBe(APP_1_ID); // earlier first
        expect(result?.twoFactorApps[1].id).toBe(APP_2_ID);
    });

    it("includes devices for the user", async () => {
        const result = await getOwnProfileData();

        // Static data creates devices for the first user (admin)
        expect(result?.devices).toBeDefined();
        expect(Array.isArray(result?.devices)).toBe(true);
    });

    it("scopes query to the session user's own organisation (does not return wrong org user)", async () => {
        const wrongOrgUserId = wrongOrganisation.ids.userIds[0];

        // Set session user to our org — result should be our user, not wrongOrg user
        const result = await getOwnProfileData();

        expect(result?.id).toBe(staticData.ids.userIds[0]);
        expect(result?.id).not.toBe(wrongOrgUserId);
    });

    it("returns twoFAEnabled and default2FAMethod fields", async () => {
        await prisma.twoFactorApp.create({
            data: { id: APP_1_ID, userId: staticData.ids.userIds[0], appName: "App1", secret: "S1", verifiedAt: new Date() },
        });
        await prisma.user.update({
            where: { id: staticData.ids.userIds[0] },
            data: { twoFAEnabled: true, default2FAMethod: APP_1_ID },
        });

        const result = await getOwnProfileData();

        expect(result?.twoFAEnabled).toBe(true);
        expect(result?.default2FAMethod).toBe(APP_1_ID);
    });
});
