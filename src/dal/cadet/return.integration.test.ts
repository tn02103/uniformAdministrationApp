import { prisma } from "@/lib/db";
import { AuthRole } from "@/lib/AuthRoles";
import { AnonymizationMode, CadetStatus } from "@/prisma/client";
import { StaticData } from "../../../tests/_playwrightConfig/testData/staticDataLoader";
import { returnCadetDirectly } from "./return";

const staticData = new StaticData(0);
const { ids } = staticData;
const wrongOrg = new StaticData(1);

describe('<returnCadetDirectly> Integration Tests', () => {
    beforeEach(async () => {
        await staticData.cleanup.cadet();
        // Reset anonymizationMode to MANUAL (default) before each test
        await prisma.assosiationConfiguration.update({
            where: { assosiationId: staticData.fk_assosiation },
            data: { anonymizationMode: AnonymizationMode.MANUAL },
        });
    });

    it('should throw if cadet is not ACTIVE', async () => {
        const cadetId = ids.cadetIds[10]; // RETURNING status

        await expect(
            returnCadetDirectly({ cadetId })
        ).rejects.toThrow("Cadet is not ACTIVE");
    });

    it('should set cadet status to RETURNED when anonymizationMode is MANUAL', async () => {
        const cadetId = ids.cadetIds[0]; // ACTIVE cadet

        await returnCadetDirectly({ cadetId });

        const cadet = await prisma.cadet.findUnique({ where: { id: cadetId } });
        expect(cadet!.status).toBe(CadetStatus.RETURNED);
        expect(cadet!.deletedAt).toBeNull();
        expect(cadet!.returnStartedAt).not.toBeNull();
        expect(cadet!.returnEndedAt).not.toBeNull();
        expect(cadet!.firstname).not.toBe('XXXX');
    });

    it('should set cadet status to RETURNED when anonymizationMode is AFTER_DAYS', async () => {
        await prisma.assosiationConfiguration.update({
            where: { assosiationId: staticData.fk_assosiation },
            data: { anonymizationMode: AnonymizationMode.AFTER_DAYS },
        });

        const cadetId = ids.cadetIds[1]; // ACTIVE cadet

        await returnCadetDirectly({ cadetId });

        const cadet = await prisma.cadet.findUnique({ where: { id: cadetId } });
        expect(cadet!.status).toBe(CadetStatus.RETURNED);
        expect(cadet!.deletedAt).toBeNull();
        expect(cadet!.returnStartedAt).not.toBeNull();
        expect(cadet!.returnEndedAt).not.toBeNull();
    });

    it('should anonymize cadet immediately when anonymizationMode is IMMEDIATELY', async () => {
        await prisma.assosiationConfiguration.update({
            where: { assosiationId: staticData.fk_assosiation },
            data: { anonymizationMode: AnonymizationMode.IMMEDIATELY },
        });

        const cadetId = ids.cadetIds[2]; // ACTIVE cadet

        await returnCadetDirectly({ cadetId });

        const cadet = await prisma.cadet.findUnique({ where: { id: cadetId } });
        expect(cadet!.status).toBe(CadetStatus.DELETED);
        expect(cadet!.firstname).toBe('XXXX');
        expect(cadet!.lastname).toBe('XXXX');
        expect(cadet!.deletedAt).not.toBeNull();
        expect(cadet!.returnStartedAt).not.toBeNull();
        expect(cadet!.returnEndedAt).not.toBeNull();
    });

    it('should reject cadet from wrong org', async () => {
        const wrongCadetId = wrongOrg.ids.cadetIds[0];

        await expect(
            returnCadetDirectly({ cadetId: wrongCadetId })
        ).rejects.toThrow();
    });

    it('should reject insufficient role', async () => {
        global.__ROLE__ = AuthRole.user;
        await expect(
            returnCadetDirectly({ cadetId: ids.cadetIds[0] })
        ).rejects.toThrow();
        global.__ROLE__ = undefined;
    });

    it('should set dateReturned on selected uniform items', async () => {
        const cadetId = ids.cadetIds[4]; // ACTIVE, has uniforms
        const selectedUniformIds = [ids.uniformIds[0][21], ids.uniformIds[0][22]];

        await returnCadetDirectly({ cadetId, selectedUniformIds });

        const returnedEntries = await prisma.uniformIssued.findMany({
            where: { fk_cadet: cadetId, fk_uniform: { in: selectedUniformIds }, dateReturned: { not: null } },
        });
        expect(returnedEntries).toHaveLength(2);

        // Non-selected items remain un-returned
        const unselectedEntry = await prisma.uniformIssued.findFirst({
            where: { fk_cadet: cadetId, fk_uniform: ids.uniformIds[0][23], dateReturned: null },
        });
        expect(unselectedEntry).not.toBeNull();
    });

    it('should set dateReturned on selected material items', async () => {
        const cadetId = ids.cadetIds[5]; // ACTIVE, has materials
        const selectedMaterialIds = [ids.materialIds[0], ids.materialIds[4]];

        await returnCadetDirectly({ cadetId, selectedMaterialIds });

        const returnedMaterials = await prisma.materialIssued.findMany({
            where: { fk_cadet: cadetId, fk_material: { in: selectedMaterialIds }, dateReturned: { not: null } },
        });
        expect(returnedMaterials).toHaveLength(2);
    });

    it('should resolve all open cadet deficiencies', async () => {
        const cadetId = ids.cadetIds[3]; // ACTIVE, has open deficiencies

        await returnCadetDirectly({ cadetId });

        const openDeficiencies = await prisma.deficiency.findMany({
            where: { fk_cadet: cadetId, dateResolved: null },
        });
        expect(openDeficiencies).toHaveLength(0);
    });
});
