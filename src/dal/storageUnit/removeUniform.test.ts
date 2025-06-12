import { prisma } from "@/lib/db";
import { StaticData } from "../../../tests/_playwrightConfig/testData/staticDataLoader";
import { __unsecuredGetUnitsWithUniformItems } from "./get";
import { removeUniform } from "./removeUniform";



const { fk_assosiation, ids, cleanup } = new StaticData(0);
const uniformIds = [ids.uniformIds[2][10], ids.uniformIds[2][11], ids.uniformIds[2][12]];
const storageUnitId = ids.storageUnitIds[2];
jest.mock("./get", () => ({
    __unsecuredGetUnitsWithUniformItems: jest.fn(),
}));

afterEach(() => cleanup.storageUnits());
beforeEach(() => {
    jest.clearAllMocks();
});
it("should remove the uniform from the storage unit and return updated units", async () => {
    (__unsecuredGetUnitsWithUniformItems as jest.Mock).mockResolvedValue(['TestReturnValue'])
    const result = await removeUniform({ uniformIds, storageUnitId });

    const [dbUniforms, dbUniformsInStorage] = await prisma.$transaction([
        prisma.uniform.findMany({
            where: {
                id: { in: uniformIds }
            }
        }), prisma.storageUnit.findUnique({
            where: {
                id: ids.storageUnitIds[2],
            },
            include: {
                uniformList: true
            }
        }),
    ]);
    expect(dbUniforms).toHaveLength(3);
    expect(dbUniforms[0].storageUnitId).toBeNull();
    expect(dbUniforms[1].storageUnitId).toBeNull();
    expect(dbUniforms[2].storageUnitId).toBeNull();
    expect(dbUniformsInStorage).not.toBeNull();
    expect(dbUniformsInStorage!.uniformList).toHaveLength(4);

    expect(__unsecuredGetUnitsWithUniformItems).toHaveBeenCalledWith(fk_assosiation);
    expect(result).toEqual(['TestReturnValue']);
});
it('should catch uniform not in storage unit', async () => {
    (__unsecuredGetUnitsWithUniformItems as jest.Mock).mockResolvedValue(['TestReturnValue'])
    const result = removeUniform({
        uniformIds: [...uniformIds, ids.uniformIds[2][9]],
        storageUnitId
    });
    await expect(result).rejects.toThrow();
    expect(__unsecuredGetUnitsWithUniformItems).not.toHaveBeenCalled();


    const result2 = removeUniform({
        uniformIds: [...uniformIds, ids.uniformIds[0][15]],
        storageUnitId
    });
    await expect(result2).rejects.toThrow();
    expect(__unsecuredGetUnitsWithUniformItems).not.toHaveBeenCalled();
});
