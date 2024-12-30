import { isToday, runServerActionTest } from "@/dal/_helper/testHelper"
import { deleteMaterial } from "./delete"
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { prisma } from "@/lib/db";

const staticData = new StaticData(0);
const materialId = staticData.ids.materialIds[5];
afterEach(() => staticData.cleanup.materialConfig());
it('validate delete', async () => {
    const {success} = await runServerActionTest(() => deleteMaterial(materialId));
    expect(success).toBeTruthy();

    const [issued, materialList] = await prisma.$transaction([
        prisma.materialIssued.findMany({
            where: {
                fk_material: materialId, 
                dateReturned: null,
            }
        }),
        prisma.material.findMany({
            where: {
                fk_materialGroup: staticData.ids.materialGroupIds[1],
            },
            orderBy: {typename: "asc"}
        }),
    ]);

    // validate all returned
    expect(issued).toHaveLength(0);
    // validate material deleted
    expect(materialList[1].id).toEqual(materialId);
    expect(materialList[1].recdelete).not.toBeNull();
    expect(isToday(materialList[1].recdelete!)).toBeTruthy();
    expect(materialList[1].recdeleteUser).toBe('mana');
    // validate sortOrders
    expect(materialList[0].sortOrder).toBe(0);
    expect(materialList[1].sortOrder).toBe(1);
    expect(materialList[2].sortOrder).toBe(1);
    expect(materialList[3].sortOrder).toBe(2);
});
