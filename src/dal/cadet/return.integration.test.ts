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
});
