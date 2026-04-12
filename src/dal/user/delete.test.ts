import { deleteUser } from "./delete";

describe("<User> deleteUser", () => {
    afterEach(() => vi.clearAllMocks());

    it("should throw not-implemented error", async () => {
        await expect(
            deleteUser({ id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
        ).rejects.toThrow("deleteUser is not yet implemented (TODO-010)");
    });
});
