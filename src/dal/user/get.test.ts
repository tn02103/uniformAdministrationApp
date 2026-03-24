import { prismaMock } from "@test-utils/prisma-mock";
import { getUserList } from "./get";
import { userArgs } from "@/types/userTypes";

describe("<User> getUserList", () => {
    afterEach(() => vi.clearAllMocks());

    it("should return users filtered by organisationId and recDelete: null", async () => {
        const mockUsers = [
            { id: "user-1", username: "test1", name: "Test User 1", active: true, role: 1 },
            { id: "user-2", username: "test2", name: "Test User 2", active: false, role: 2 },
        ];
        prismaMock.user.findMany.mockResolvedValue(mockUsers as never);

        const result = await getUserList();

        expect(result).toEqual(mockUsers);
        expect(prismaMock.user.findMany).toHaveBeenCalledWith({
            where: { organisationId: "test-organisation-id", recDelete: null },
            ...userArgs,
        });
    });

    it("should return empty array when no users found", async () => {
        prismaMock.user.findMany.mockResolvedValue([]);

        const result = await getUserList();

        expect(result).toEqual([]);
        expect(prismaMock.user.findMany).toHaveBeenCalledOnce();
    });
});
