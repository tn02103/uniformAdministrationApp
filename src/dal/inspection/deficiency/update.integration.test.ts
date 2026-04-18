import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { updateDeficiency } from "./update";

const staticData = new StaticData(0);
const otherOrg = new StaticData(1);

describe('updateDeficiency Integration Tests', () => {
    beforeAll(async () => {
        global.__ROLE__ = AuthRole.inspector;
        await staticData.resetData();
        await otherOrg.resetData();
    });
    afterAll(async () => {
        global.__ROLE__ = undefined;
        await staticData.cleanup.removeAssosiation();
        await otherOrg.cleanup.removeAssosiation();
    });
    afterEach(async () => {
        await staticData.resetData();
        await otherOrg.resetData();
    });

    it('updates comment and description on a deficiency', async () => {
        // deficiencyIds[1] is an unresolved uniform deficiency
        const id = staticData.ids.deficiencyIds[1];

        await updateDeficiency({ id, data: { comment: 'Updated comment', description: 'NewDesc' } });

        const updated = await prisma.deficiency.findUnique({ where: { id } });
        expect(updated!.comment).toBe('Updated comment');
        expect(updated!.description).toBe('NewDesc');
    });

    it('updates only comment when description is omitted', async () => {
        const id = staticData.ids.deficiencyIds[1];
        const before = await prisma.deficiency.findUnique({ where: { id } });

        await updateDeficiency({ id, data: { comment: 'Only comment changed' } });

        const updated = await prisma.deficiency.findUnique({ where: { id } });
        expect(updated!.comment).toBe('Only comment changed');
        expect(updated!.description).toBe(before!.description);
    });

    it('does not change typeId, uniformId or cadetId', async () => {
        const id = staticData.ids.deficiencyIds[1];
        const before = await prisma.deficiency.findUnique({ where: { id } });

        await updateDeficiency({ id, data: { comment: 'c', description: 'd' } });

        const updated = await prisma.deficiency.findUnique({ where: { id } });
        expect(updated!.fk_deficiencyType).toBe(before!.fk_deficiencyType);
        expect(updated!.fk_uniform).toBe(before!.fk_uniform);
        expect(updated!.fk_cadet).toBe(before!.fk_cadet);
    });

    it('rejects cross-org deficiency id', async () => {
        const foreignId = otherOrg.ids.deficiencyIds[1];

        await expect(updateDeficiency({ id: foreignId, data: { comment: 'x' } }))
            .rejects.toThrow();
    });

    it('rejects request with role below inspector', async () => {
        global.__ROLE__ = AuthRole.user;
        const id = staticData.ids.deficiencyIds[1];

        await expect(updateDeficiency({ id, data: { comment: 'x' } }))
            .rejects.toThrow();

        global.__ROLE__ = AuthRole.inspector;
    });
});
