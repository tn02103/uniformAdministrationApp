import { runServerActionTest } from "@/dal/_helper/testHelper";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { markDeleted } from "./delete";

const { ids, cleanup, data } = new StaticData(0);

it('catches if item is issued', async() => {
    const {success, result} = await runServerActionTest(
        () => markDeleted(ids.uniformIds[0][46])
    );
    expect(success).toBeFalsy();
    expect(result.message).toEqual("Item can not be deleted while issued");
});
describe('successfull deletion', () => {
    beforeAll(async () => {
        await prisma.uniformIssued.updateMany({
            where: {
                fk_uniform: ids.uniformIds[0][46],
                dateReturned: null,
            },
            data: {
                dateReturned: new Date(),
            }
        });
        const fedback = await runServerActionTest(
            () => markDeleted(ids.uniformIds[0][46])
        );
        expect(fedback.success).toBeTruthy();
    })
    afterAll(async () => cleanup.uniform());
    it('marks uniformItem as deleted', async () => {
        const dbItem = await prisma.uniform.findUnique({
            where: {
                id: ids.uniformIds[0][46],
            }
        });
        expect(dbItem).not.toBeNull();
        expect(dbItem!.recdelete).not.toBeNull();
        expect(dbItem!.recdelete!.getTime() - new Date().getTime()).toBeLessThan(30000);
        expect(dbItem!.recdeleteUser).toEqual('mana');
    });
    it('marks all uniformDeficiencies from item as deleted', async () => {
        const deficiencies = await prisma.uniformDeficiency.findMany({
            where: {
                fk_uniform: ids.uniformIds[0][46],
            },
            include: { deficiency: true },
            orderBy: { deficiency: { comment: "asc" } }
        });
        expect(deficiencies).toHaveLength(2);
        expect(deficiencies[0].deficiency.dateResolved).toEqual(data.deficiencies[2].dateResolved);
        expect(deficiencies[0].deficiency.userResolved).toEqual(data.deficiencies[2].userResolved);
        expect(deficiencies[1].deficiency.dateResolved).not.toBeNull();
        expect(deficiencies[1].deficiency.dateResolved!.getTime() - new Date().getTime()).toBeLessThan(3000)
    });
});