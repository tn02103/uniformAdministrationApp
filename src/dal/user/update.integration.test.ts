import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { staticData } from "../../../vitest/setup-dal-integration";
import { runServerActionTest } from "../_helper/testHelper";
import { changeUserPassword, updateUser } from "./update";
import bcrypt from "bcrypt";

describe("<User> updateUser", () => {
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

    it("should update user fields in the database", async () => {
        const userId = staticData.ids.userIds[3]; // role 1, active user

        const { success } = await runServerActionTest(
            updateUser({
                userId,
                name: "Updated Name",
                role: AuthRole.inspector,
                active: false,
            })
        );
        expect(success).toBe(true);

        const updated = await prisma.user.findUnique({ where: { id: userId } });
        expect(updated?.name).toBe("Updated Name");
        expect(updated?.role).toBe(AuthRole.inspector);
        expect(updated?.active).toBe(false);
        expect(updated?.failedLoginCount).toBe(0);
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
        const userId = staticData.ids.userIds[1];
        const newPassword = "NewPassword1";

        const userBefore = await prisma.user.findUnique({ where: { id: userId } });
        const oldPasswordHash = userBefore?.password;

        const { success } = await runServerActionTest(
            changeUserPassword({ userId, password: newPassword })
        );
        expect(success).toBe(true);

        const userAfter = await prisma.user.findUnique({ where: { id: userId } });
        expect(userAfter?.password).not.toBe(oldPasswordHash);
        expect(await bcrypt.compare(newPassword, userAfter!.password)).toBe(true);
    });
});
