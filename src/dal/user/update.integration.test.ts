import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../tests/_playwrightConfig/testData/staticDataLoader";
import { runServerActionTest } from "../_helper/testHelper";
import { changeUserPassword, updateUser } from "./update";
import { compare } from "bcrypt";

const staticData = new StaticData(0);
const wrongOrg = new StaticData(1);

describe("<User> updateUser", () => {
    beforeAll(async () => {
        global.__ROLE__ = AuthRole.admin;
        await staticData.cleanup.user();
        await wrongOrg.cleanup.user();
    });

    afterEach(async () => {
        await staticData.cleanup.user();
        await wrongOrg.cleanup.user();
    });

    afterAll(() => {
        delete global.__ROLE__;
    });

    it("should update user fields including username and email in the database", async () => {
        const id = staticData.ids.userIds[3]; // role 1, active user

        const { success } = await runServerActionTest(
            updateUser({
                id,
                username: "updtdus1",
                email: "updated@example.com",
                name: "Updated Name",
                role: AuthRole.inspector,
                active: false,
            })
        );
        expect(success).toBe(true);

        const updated = await prisma.user.findUnique({ where: { id } });
        expect(updated?.username).toBe("updtdus1");
        expect(updated?.email).toBe("updated@example.com");
        expect(updated?.name).toBe("Updated Name");
        expect(updated?.role).toBe(AuthRole.inspector);
        expect(updated?.active).toBe(false);
        expect(updated?.failedLoginCount).toBe(0);
    });

    it("should not allow cross-org user updates", async () => {
        const wrongOrgUserId = wrongOrg.ids.userIds[0];
        global.__ROLE__ = AuthRole.admin;

        const { success } = await runServerActionTest(
            updateUser({
                id: wrongOrgUserId,
                username: "hacked12",
                email: "hacked@example.com",
                name: "Hacked User",
                role: AuthRole.admin,
                active: true,
            })
        );

        // Should fail because user doesn't exist in caller's org
        expect(success).toBe(false);

        // Verify no change was made
        const userAfter = await prisma.user.findUnique({ where: { id: wrongOrgUserId } });
        expect(userAfter?.username).not.toBe("hacked12");
        expect(userAfter?.email).not.toBe("hacked@example.com");
    });

    it("shoule not allow updating to a duplicate username or email", async () => {
        const id = staticData.ids.userIds[3]; // role 1, active user
        const existingUsername = "test4"
        const existingEmail = "test4@test.com";

        const { success: usernameSuccess, result: usernameResult } = await runServerActionTest(
            updateUser({
                id,
                username: existingUsername,
                email: "someemail@example.com",
                name: "Updated Name",
                role: AuthRole.inspector,
                active: false,
            })
        );
        expect(usernameSuccess).toBe(false);
        expect(usernameResult).toEqual(expect.objectContaining({
            error: expect.objectContaining({
                formElement: "username"
            })
        }));

        const { success: emailSuccess , result: emailResult } = await runServerActionTest(
            updateUser({
                id,
                username: "uniqueusername",
                email: existingEmail,
                name: "Updated Name",
                role: AuthRole.inspector,
                active: false,
            })
        );
        expect(emailSuccess).toBe(false);
        expect(emailResult).toEqual(expect.objectContaining({
            error: expect.objectContaining({
                formElement: "email"
            })
        }));
    });
});

describe("<User> changeUserPassword", () => {
    beforeAll(async () => {
        global.__ROLE__ = AuthRole.admin;
        await staticData.cleanup.user();
    });

    afterEach(async () => {
        await staticData.cleanup.user();
    });

    afterAll(() => {
        delete global.__ROLE__;
    });

    it("should hash and persist the new password", async () => {
        const id = staticData.ids.userIds[1];
        const newPassword = "NewPassword1";

        const userBefore = await prisma.user.findUnique({ where: { id } });
        const oldPasswordHash = userBefore?.password;

        const { success } = await runServerActionTest(
            changeUserPassword({ id, password: newPassword })
        );
        expect(success).toBe(true);

        const userAfter = await prisma.user.findUnique({ where: { id } });
        expect(userAfter?.password).not.toBe(oldPasswordHash);
        expect(await compare(newPassword, userAfter?.password || "")).toBe(true);
    });
});
