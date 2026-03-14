
import { removeUniform } from "./removeUniform";
import { prisma } from "@/lib/db";
import { __unsecuredGetUnitsWithUniformItems } from "./get";

vi.mock("@/actions/validations", () => ({
    genericSAValidator: vi.fn((_, props) =>
        Promise.resolve([{ assosiation: 'test-assosiation-id' }, props])
    ),
}));
vi.mock("./get", () => ({
    __unsecuredGetUnitsWithUniformItems: vi.fn(),
}));

const uniformIds = ['u1', 'u2', 'u3'];
const storageUnitId = 's1';

describe('<storageUnit> removeUniform', () => {
    afterEach(vi.clearAllMocks);

    const prismaUpdateMany = vi.mocked(prisma.uniform.updateMany);
    const getUnitsWithUniformItems = vi.mocked(__unsecuredGetUnitsWithUniformItems);

    it("should remove the uniform from the storage unit and return updated units", async () => {
        prismaUpdateMany.mockResolvedValueOnce({ count: uniformIds.length });
        getUnitsWithUniformItems.mockResolvedValueOnce(['TestReturnValue'] as any);

        const result = await removeUniform({ uniformIds, storageUnitId });

        expect(prismaUpdateMany).toHaveBeenCalledWith({
            where: {
                id: { in: uniformIds },
                storageUnitId,
            },
            data: {
                storageUnitId: null
            }
        });
        expect(getUnitsWithUniformItems).toHaveBeenCalledWith('test-assosiation-id');
        expect(result).toEqual(['TestReturnValue']);
    });

    it('should throw if not all uniforms are updated', async () => {
        prismaUpdateMany.mockResolvedValueOnce({ count: 2 }); // less than uniformIds.length
        getUnitsWithUniformItems.mockResolvedValueOnce(['TestReturnValue'] as any);

        await expect(removeUniform({ uniformIds, storageUnitId })).rejects.toThrow("Failed to update uniforms");
        expect(getUnitsWithUniformItems).not.toHaveBeenCalled();
    });
});
