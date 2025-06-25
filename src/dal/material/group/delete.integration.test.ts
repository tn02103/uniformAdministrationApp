import { isToday, runServerActionTest } from "@/dal/_helper/testHelper";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { markDeleted } from "./delete";
import { prisma } from "@/lib/db";

const staticData = new StaticData(0);
const groupId = staticData.ids.materialGroupIds[1];
describe('validate deletion', () => {
    afterAll(async () => staticData.cleanup.materialConfig());
    beforeAll(async () => {
        const { success } = await runServerActionTest(markDeleted(groupId));
        // eslint-disable-next-line jest/no-standalone-expect
        expect(success).toBeTruthy();
    });

    it('returns all Materials from Group', async () => {
        const issuedMaterial = await prisma.materialIssued.findMany({
            where: {
                material: {
                    fk_materialGroup: groupId,
                },
                dateReturned: null,
            }
        });
        expect(issuedMaterial).toHaveLength(0);
    });

    it('deletes all not deleted Materials', async () => {
        const material = await prisma.material.findMany({
            where: {
                fk_materialGroup: groupId
            },
            orderBy: { recdelete: "asc" }
        });
        expect(material).toHaveLength(4);
        expect(material.every(m => m.recdelete !== null && m.recdeleteUser !== null)).toBeTruthy();
        expect(isToday(material[0].recdelete!)).toBeFalsy();
        expect(material[0].recdeleteUser).toBe('admin');
        material.slice(1).map(m => {
            expect(m.recdeleteUser).toBe('mana')
            expect(isToday(m.recdelete!)).toBeTruthy();
        });
    });

    it('delets group', async () => {
        const groupList = await prisma.materialGroup.findMany({
            where: {
                fk_assosiation: staticData.fk_assosiation,
            },
            orderBy: { description: 'asc' }
        });
        expect(groupList).toHaveLength(5);
        expect(groupList[1].id).toBe(groupId)
        expect(groupList[1]?.recdelete).not.toBeNull();
        expect(isToday(groupList[1]!.recdelete!)).toBeTruthy();
        expect(groupList[1]?.recdeleteUser).toBe('mana');
    });
    it('updates sortOrders of others', async () => {
        const groupList = await prisma.materialGroup.findMany({
            where: {
                fk_assosiation: staticData.fk_assosiation,
            },
            orderBy: { description: 'asc' }
        });
        expect(groupList[0].id).toBe(staticData.ids.materialGroupIds[0]);
        expect(groupList[0].sortOrder).toBe(0);
        expect(groupList[1].sortOrder).toBe(1);
        expect(groupList[2].id).toBe(staticData.ids.materialGroupIds[2]);
        expect(groupList[2].sortOrder).toBe(1);
        expect(groupList[3].id).toBe(staticData.ids.materialGroupIds[3]);
        expect(groupList[3].sortOrder).toBe(1);
        expect(groupList[4].id).toBe(staticData.ids.materialGroupIds[4]);
        expect(groupList[4].sortOrder).toBe(2);
    });
});
