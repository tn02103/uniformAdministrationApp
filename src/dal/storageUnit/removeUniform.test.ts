import { removeUniform } from "./removeUniform";
import { prisma } from "@/lib/db";

jest.mock('@/lib/db', () => ({
    prisma: {
        uniform: {
            updateMany: jest.fn(),
        },
        $transaction: jest.fn((fn) => fn(prisma)),
    }
}));
jest.mock("@/actions/validations", () => ({
    genericSAValidator: jest.fn((_, props) =>
        Promise.resolve([{ organisationId: 'test-organisation' }, props])
    ),
}));
jest.mock("./get", () => ({
    __unsecuredGetUnitsWithUniformItems: jest.fn(),
}));

const uniformIds = ['u1', 'u2', 'u3'];
const storageUnitId = 's1';

describe('<storageUnit> removeUniform', () => {
    afterEach(jest.clearAllMocks);

    const prismaUpdateMany = prisma.uniform.updateMany as jest.Mock;
    const getUnitsWithUniformItems = jest.requireMock("./get").__unsecuredGetUnitsWithUniformItems as jest.Mock;

    it("should remove the uniform from the storage unit and return updated units", async () => {
        prismaUpdateMany.mockResolvedValueOnce({ count: uniformIds.length });
        getUnitsWithUniformItems.mockResolvedValueOnce(['TestReturnValue']);

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
        expect(getUnitsWithUniformItems).toHaveBeenCalledWith('test-organisation');
        expect(result).toEqual(['TestReturnValue']);
    });

    it('should throw if not all uniforms are updated', async () => {
        prismaUpdateMany.mockResolvedValueOnce({ count: 2 }); // less than uniformIds.length
        getUnitsWithUniformItems.mockResolvedValueOnce(['TestReturnValue']);

        await expect(removeUniform({ uniformIds, storageUnitId })).rejects.toThrow("Failed to update uniforms");
        expect(getUnitsWithUniformItems).not.toHaveBeenCalled();
    });
});
