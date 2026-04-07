import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../tests/_playwrightConfig/testData/staticDataLoader";
import { runServerActionTest } from "../_helper/testHelper";
import { createUser } from "./create";

const staticData = new StaticData(0);

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
        email: "newuser@example.com",
        name: "New User",
        role: AuthRole.user,
        active: true,
        password: "Password1",
    };

    it("should create a user in the database with explicit email", async () => {
        const { success } = await runServerActionTest(createUser(validInput));
        expect(success).toBe(true);

        const created = await prisma.user.findFirst({
            where: {
                organisationId: staticData.ids.organisationId,
                username: validInput.username,
            },
        });
        expect(created).not.toBeNull();
        expect(created?.email).toBe(validInput.email);
        expect(created?.name).toBe(validInput.name);
        expect(created?.active).toBe(validInput.active);
        expect(created?.role).toBe(validInput.role);
    });

    it("should return error on duplicate username and email", async () => {
        // First creation should succeed
        await runServerActionTest(createUser(validInput));

        // Second creation with same username should fail
        const { success: successUsername, result: resultUsername } = await runServerActionTest(
            createUser({ ...validInput, email: "uniqueemail@example.com" })
        );
        expect(successUsername).toBe(false);
        expect(resultUsername).toEqual(expect.objectContaining({
            error: expect.objectContaining({
                formElement: "username",
            }),
        }));

        // Second creation with same email should fail
        const { success: successEmail, result: resultEmail } = await runServerActionTest(
            createUser({ ...validInput, username: "uniqueusername" })
        );
        expect(successEmail).toBe(false);
        expect(resultEmail).toEqual(expect.objectContaining({
            error: expect.objectContaining({
                formElement: "email",
            }),
        }));

    });
});
