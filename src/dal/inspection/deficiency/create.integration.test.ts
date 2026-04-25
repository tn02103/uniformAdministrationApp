import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { createDeficiency } from "./create";

const staticData = new StaticData(0);
const otherOrg = new StaticData(1);

describe('createDeficiency Integration Tests', () => {
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
        await prisma.deficiency.deleteMany({
            where: { type: { fk_assosiation: staticData.fk_assosiation }, fk_inspection_created: null },
        });
    });

    it('creates a uniform-dependent deficiency with auto-generated description', async () => {
        const typeId = staticData.ids.deficiencyTypeIds[0]; // uniform type
        const uniformId = staticData.ids.uniformIds[0][0];

        await createDeficiency({ typeId, comment: 'Integration test comment', uniformId });

        const created = await prisma.deficiency.findFirst({
            where: {
                fk_deficiencyType: typeId,
                comment: 'Integration test comment',
            },
            include: { type: true },
        });

        expect(created).not.toBeNull();
        expect(created!.fk_uniform).toBe(uniformId);
        expect(created!.fk_cadet).toBeNull();
        expect(created!.fk_inspection_created).toBeNull();
        expect(created!.description).toMatch(/^Typ1-\d+$/);
    });

    it('creates a cadet-dependent deficiency with provided description', async () => {
        const typeId = staticData.ids.deficiencyTypeIds[1]; // cadet type
        const cadetId = staticData.ids.cadetIds[0];

        await createDeficiency({ typeId, comment: 'Cadet integration test', description: 'Ungewaschen', cadetId });

        const created = await prisma.deficiency.findFirst({
            where: { fk_deficiencyType: typeId, comment: 'Cadet integration test' },
        });

        expect(created).not.toBeNull();
        expect(created!.fk_cadet).toBe(cadetId);
        expect(created!.fk_uniform).toBeNull();
        expect(created!.fk_inspection_created).toBeNull();
        expect(created!.description).toBe('Ungewaschen');
    });

    it('rejects cross-org typeId', async () => {
        const foreignTypeId = otherOrg.ids.deficiencyTypeIds[0];
        const uniformId = staticData.ids.uniformIds[0][0];

        await expect(createDeficiency({ typeId: foreignTypeId, comment: 'x', uniformId }))
            .rejects.toThrow();
    });

    it('rejects cross-org uniformId', async () => {
        const typeId = staticData.ids.deficiencyTypeIds[0];
        const foreignUniformId = otherOrg.ids.uniformIds[0][0];

        await expect(createDeficiency({ typeId, comment: 'x', uniformId: foreignUniformId }))
            .rejects.toThrow();
    });

    it('rejects cross-org cadetId', async () => {
        const typeId = staticData.ids.deficiencyTypeIds[1];
        const foreignCadetId = otherOrg.ids.cadetIds[0];

        await expect(createDeficiency({ typeId, comment: 'x', cadetId: foreignCadetId }))
            .rejects.toThrow();
    });

    it('sets fk_inspection_created to null when no active inspection exists', async () => {
        // inspectionIds[4] has date=today but timeStart=null — not active
        const typeId = staticData.ids.deficiencyTypeIds[0];
        const uniformId = staticData.ids.uniformIds[0][0];

        await createDeficiency({ typeId, comment: 'no active inspection', uniformId });

        const created = await prisma.deficiency.findFirst({
            where: { fk_deficiencyType: typeId, comment: 'no active inspection' },
        });

        expect(created).not.toBeNull();
        expect(created!.fk_inspection_created).toBeNull();
    });

    it('sets fk_inspection_created to active inspection id when inspection is active', async () => {
        const activeInspectionId = staticData.ids.inspectionIds[4];
        // Activate the inspection by setting timeStart
        await prisma.inspection.update({
            where: { id: activeInspectionId },
            data: { timeStart: '09:00' },
        });

        try {
            const typeId = staticData.ids.deficiencyTypeIds[0];
            const uniformId = staticData.ids.uniformIds[0][0];

            await createDeficiency({ typeId, comment: 'active inspection test', uniformId });

            const created = await prisma.deficiency.findFirst({
                where: { fk_deficiencyType: typeId, comment: 'active inspection test' },
            });

            expect(created).not.toBeNull();
            expect(created!.fk_inspection_created).toBe(activeInspectionId);
        } finally {
            // Restore inspection to inactive state
            await prisma.inspection.update({
                where: { id: activeInspectionId },
                data: { timeStart: null },
            });
        }
    });

    it('rejects request with role below inspector', async () => {
        global.__ROLE__ = AuthRole.user;
        const typeId = staticData.ids.deficiencyTypeIds[0];
        const uniformId = staticData.ids.uniformIds[0][0];

        await expect(createDeficiency({ typeId, comment: 'x', uniformId }))
            .rejects.toThrow();

        global.__ROLE__ = AuthRole.inspector;
    });
});
