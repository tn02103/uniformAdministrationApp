import { AuthRole } from "@/lib/AuthRoles";
import { StaticData } from "../../../tests/_playwrightConfig/testData/staticDataLoader";
import { deleteUser } from "./delete";

const staticData = new StaticData(0);

describe("<User> deleteUser", () => {
    beforeAll(() => {
        global.__ROLE__ = AuthRole.admin;
    });

    afterAll(() => {
        delete global.__ROLE__;
    });

    it("should throw not-implemented error", async () => {
        const id = staticData.ids.userIds[0];
        await expect(deleteUser({ id })).rejects.toThrow(
            "deleteUser is not yet implemented (TODO-010)"
        );
    });
});
