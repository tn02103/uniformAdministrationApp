import { runServerActionTest } from "@/dal/_helper/testHelper";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { markDeleted } from "./delete";

const { ids } = new StaticData(0);
it('should mark the group as deleted', async () => {
    const { success } = await runServerActionTest(
        markDeleted(ids.uniformGenerationIds[1])
    );
    expect(success).toBeTruthy();

    const dbData = await prisma.uniformGeneration.findUnique({
        where: { id: ids.uniformGenerationIds[1] },
    });
    expect(dbData).not.toBeNull();
    expect(dbData?.recdelete).not.toBeNull();
    expect(dbData?.recdeleteUser).not.toBeNull();
    // within 30 seconds is considered to be set now
    expect(new Date().getTime() - dbData!.recdelete!.getTime()).toBeLessThan(30000);
    expect(dbData?.recdeleteUser).toBe('mana');
})
it('should update sortOrder of all Generations beneath it', async () => {
    const dbData = await prisma.uniformGeneration.findMany({
        where: {
            fk_uniformType: ids.uniformTypeIds[0],
            recdelete: null
        },
        orderBy: { sortOrder: 'asc' }
    });
    expect(dbData).toHaveLength(3);
    expect(dbData[0].id).toBe(ids.uniformGenerationIds[0]);
    expect(dbData[1].id).toBe(ids.uniformGenerationIds[2]);
    expect(dbData[2].id).toBe(ids.uniformGenerationIds[3]);
    expect(dbData[0].sortOrder).toBe(0);
    expect(dbData[1].sortOrder).toBe(1);
    expect(dbData[2].sortOrder).toBe(2);
});
it('no Flag -> set generation of items to null', async () => {
    const dbData = await prisma.uniform.findMany({
        where: {
            fk_generation: ids.uniformGenerationIds[1],
            recdelete: null,
        }
    });
    expect(dbData).toHaveLength(0);
});
// TODO implement this.
/* it('delete Flag -> also deletes all of the items', async() => {
    
});*/
