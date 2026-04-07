import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../tests/_playwrightConfig/testData/staticDataLoader";
import { getUserList } from "./get";

const staticData = new StaticData(0);
const wrongOrg = new StaticData(1);

describe("<User> getUserList", () => {
    beforeAll(async () => {
        global.__ROLE__ = AuthRole.admin;
        await staticData.cleanup.user();
        await wrongOrg.cleanup.user();
    });

    afterAll(() => {
        delete global.__ROLE__;
    });

    it("should only return users from the caller's organisation", async () => {
        const result = await getUserList();

        expect(result.length).toBeGreaterThan(0);

        const ownOrgIds = staticData.ids.userIds;
        const otherOrgIds = wrongOrg.ids.userIds;

        result.forEach((user) => {
            expect(ownOrgIds).toContain(user.id);
            expect(otherOrgIds).not.toContain(user.id);
        });
    });

    it("should not return soft-deleted users", async () => {
        const [softDeletedUserId] = staticData.ids.userIds;

        await prisma.user.update({
            where: { id: softDeletedUserId },
            data: { recDelete: new Date() },
        });

        const result = await getUserList();

        expect(result.find((u) => u.id === softDeletedUserId)).toBeUndefined();

        // Restore
        await prisma.user.update({
            where: { id: softDeletedUserId },
            data: { recDelete: null },
        });
    });

    it("should include email field in response", async () => {
        const result = await getUserList();

        expect(result.length).toBeGreaterThan(0);
        result.forEach((user) => {
            expect(user).toHaveProperty("email");
            expect(typeof user.email).toBe("string");
        });
    });
});
