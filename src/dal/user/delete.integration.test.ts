import { AuthRole } from "@/lib/AuthRoles";
import { staticData } from "../../../vitest/setup-dal-integration";
import { deleteUser } from "./delete";

describe("<User> deleteUser", () => {
    beforeAll(() => {
        global.__ROLE__ = AuthRole.admin;
    });

    afterAll(() => {
        delete global.__ROLE__;
    });

    it("should throw not-implemented error", async () => {
        const userId = staticData.ids.userIds[0];
        await expect(deleteUser({ userId })).rejects.toThrow(
            "deleteUser is not yet implemented (TODO-010)"
        );
    });
});
