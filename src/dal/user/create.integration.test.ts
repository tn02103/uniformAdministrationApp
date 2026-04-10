import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { staticData } from "../../../vitest/setup-dal-integration";
import { runServerActionTest } from "../_helper/testHelper";
import { createUser } from "./create";

describe("<User> createUser", () => {
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

    const validInput = {
        username: "newusr",
        name: "New User",
        role: AuthRole.user,
        active: true,
        password: "Password1",
    };

    it("should create a user in the database", async () => {
        const { success } = await runServerActionTest(createUser(validInput));
        expect(success).toBe(true);

        const created = await prisma.user.findFirst({
            where: {
                organisationId: staticData.ids.organisationId,
                username: validInput.username,
            },
        });
        expect(created).not.toBeNull();
        expect(created?.name).toBe(validInput.name);
        expect(created?.active).toBe(validInput.active);
        expect(created?.role).toBe(validInput.role);
    });

    it("should return error on duplicate username", async () => {
        // First creation should succeed
        await runServerActionTest(createUser(validInput));

        // Second creation with same username should fail
        const { success, result } = await runServerActionTest(createUser(validInput));
        expect(success).toBe(false);
        expect((result as { error: { formElement: string } }).error.formElement).toBe("username");
    });
});
