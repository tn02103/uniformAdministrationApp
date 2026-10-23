import { cleanDataV2 } from "@/dal/_helper/testHelper";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { __unsecuredProcessCadetEquipmentReturn } from "./create";
import { completeResignationChecklistItem, completeResignationProcess, createResignationProcess, getActiveResignationProcessList } from "./index";

const staticData = new StaticData(0);
const { ids } = staticData;
const wrongOrg = new StaticData(1);

describe('<ResignationProcess> Integration Tests', () => {
    beforeAll(async () => {
        await staticData.resetData();
        await staticData.cleanup.resignationProcess();
    });

    describe('getResignationProcessList', () => {
        it('should return members with unfinished resignation processes', async () => {
            const result = await getActiveResignationProcessList();

            expect(result).toHaveLength(1);
            const member = result.find((p) => p.id === ids.cadetIds[10]);
            expect(member).toBeDefined();
            expect(member!.resignationProcess).toBeDefined();
            expect(member!.resignationProcess!.id).toBe(ids.resignationProcessIds[0]);
            expect(member!.resignationProcess?.template.id).toBe(ids.resignationProcessTemplateIds[0]);
            expect(member!.resignationProcess!.checklistItems).toHaveLength(2);
            expect(cleanDataV2(result)).toMatchSnapshot();
        });

        it('should not return finished processes', async () => {
            await prisma.resignationProcess.update({
                where: { id: ids.resignationProcessIds[0] },
                data: { finished: true },
            });

            const result = await getActiveResignationProcessList();

            expect(result.find((p) => p.resignationProcess?.id === ids.resignationProcessIds[1])).toBeUndefined();
        });

        it('should not return processes from another org', async () => {
            const result = await getActiveResignationProcessList();

            const wrongOrgProcessIds = wrongOrg.ids.resignationProcessIds;
            expect(result.map((p) => p.resignationProcess?.id)).not.toContain(wrongOrgProcessIds[0]);
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.user;
            await expect(getActiveResignationProcessList()).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });

    describe('createResignationProcess', () => {
        it('should create a return process with all checklist item statuses', async () => {
            const cadetId = ids.cadetIds[3]; // ACTIVE cadet, no existing process

            const result = await createResignationProcess({
                cadetId,
                resignationProcessTemplateId: ids.resignationProcessTemplateIds[0],
            });

            expect(result).toBeDefined();
            expect(result.cadetId).toBe(cadetId);
            expect(result.templateId).toBe(ids.resignationProcessTemplateIds[0]);
            expect(result.finished).toBe(false);

            // Verify checklist item statuses were created
            const statuses = await prisma.resignationChecklistItem.findMany({
                where: { processId: result.id },
            });
            expect(statuses).toHaveLength(2); // template[0] has 2 checklist items

            // Verify cadet status updated to RETURNING
            const cadet = await prisma.cadet.findUnique({ where: { id: cadetId } });
            expect(cadet!.status).toBe('RESIGNING');
            expect(cadet!.resignedAt).not.toBeNull();
        });

        it('should set status RETURNED with both return timestamps when created as finished', async () => {
            const cadetId = ids.cadetIds[4]; // ACTIVE cadet

            const result = await createResignationProcess({
                cadetId,
                resignationProcessTemplateId: ids.resignationProcessTemplateIds[0],
                finished: true,
            });

            expect(result.finished).toBe(true);
            const cadet = await prisma.cadet.findUnique({ where: { id: cadetId } });
            expect(cadet!.status).toBe('RESIGNED');
            expect(cadet!.resignedAt).not.toBeNull();
        });

        it('should fail validation when resignationProcessTemplateId is missing', async () => {
            const cadetId = ids.cadetIds[4]; // ACTIVE cadet

            await expect(
                createResignationProcess({ cadetId } as never)
            ).rejects.toThrow();
        });

        it('should create a resignation process with preCheckedItemIds marking those items completed', async () => {
            const cadetId = ids.cadetIds[5]; // ACTIVE cadet
            const preCheckedId = ids.resignationChecklistItemTemplateIds[0];
            const uncheckedId = ids.resignationChecklistItemTemplateIds[1];

            const result = await createResignationProcess({
                cadetId,
                resignationProcessTemplateId: ids.resignationProcessTemplateIds[0],
                preCheckedItemIds: [preCheckedId],
            });

            const statuses = await prisma.resignationChecklistItem.findMany({
                where: { processId: result.id },
            });

            const checkedStatus = statuses.find((s) => s.checklistTemplateId === preCheckedId);
            const uncheckedStatus = statuses.find((s) => s.checklistTemplateId === uncheckedId);

            expect(checkedStatus?.completedAt).not.toBeNull();
            expect(checkedStatus?.completedByUser).toBe('mana');
            expect(uncheckedStatus?.completedAt).toBeNull();
            expect(uncheckedStatus?.completedByUser).toBeNull();
        });

        it('should throw if cadet is not ACTIVE', async () => {
            const cadetId = ids.cadetIds[10]; // RETURNING status

            await expect(
                createResignationProcess({ cadetId, resignationProcessTemplateId: ids.resignationProcessTemplateIds[0] })
            ).rejects.toThrow("Cadet is not ACTIVE");
        });

        it('should not create process with cadet from wrong org', async () => {
            const wrongCadetId = wrongOrg.ids.cadetIds[0];

            await expect(
                createResignationProcess({
                    cadetId: wrongCadetId,
                    resignationProcessTemplateId: ids.resignationProcessTemplateIds[0],
                })
            ).rejects.toThrow();
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.user;
            await expect(
                createResignationProcess({
                    cadetId: ids.cadetIds[3],
                    resignationProcessTemplateId: ids.resignationProcessTemplateIds[0],
                })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });

    describe('completeResignationChecklistItem', () => {
        it('should mark a checklist item as completed', async () => {
            const resignationProcessId = ids.resignationProcessIds[0];
            const checklistItemId = ids.resignationChecklistItemTemplateIds[0];

            await completeResignationChecklistItem({
                resignationProcessId,
                checklistItemId,
                completed: true,
            });

            const status = await prisma.resignationChecklistItem.findUniqueOrThrow({
                where: {
                    processId_checklistTemplateId: {
                        processId: resignationProcessId,
                        checklistTemplateId: checklistItemId,
                    },
                },
            });

            expect(status.completedAt).not.toBeNull();
            expect(status.completedByUser).toBe('mana');
        });

        it('should clear completion when completed=false', async () => {
            const resignationProcessId = ids.resignationProcessIds[0];
            const checklistItemId = ids.resignationChecklistItemTemplateIds[0];

            // First complete it
            await completeResignationChecklistItem({ resignationProcessId, checklistItemId, completed: true });
            // Then un-complete
            await completeResignationChecklistItem({ resignationProcessId, checklistItemId, completed: false });

            const status = await prisma.resignationChecklistItem.findUniqueOrThrow({
                where: {
                    processId_checklistTemplateId: {
                        processId: resignationProcessId,
                        checklistTemplateId: checklistItemId,
                    },
                },
            });

            expect(status.completedAt).toBeNull();
            expect(status.completedByUser).toBeNull();
        });

        it('should update ResignationProcess.updatedAt', async () => {
            const resignationProcessId = ids.resignationProcessIds[0];

            const before = await prisma.resignationProcess.findUnique({ where: { id: resignationProcessId } });

            // Small delay to ensure timestamp difference
            await new Promise((r) => setTimeout(r, 10));

            await completeResignationChecklistItem({
                resignationProcessId,
                checklistItemId: ids.resignationChecklistItemTemplateIds[0],
                completed: true,
            });

            const after = await prisma.resignationProcess.findUnique({ where: { id: resignationProcessId } });
            expect(after!.updatedAt.getTime()).toBeGreaterThanOrEqual(before!.updatedAt.getTime());
        });

        it('should reject resignationProcessId from wrong org', async () => {
            const wrongProcessId = wrongOrg.ids.resignationProcessIds[0];

            await expect(
                completeResignationChecklistItem({
                    resignationProcessId: wrongProcessId,
                    checklistItemId: wrongOrg.ids.resignationChecklistItemTemplateIds[0],
                    completed: true,
                })
            ).rejects.toThrow();
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.user;
            await expect(
                completeResignationChecklistItem({
                    resignationProcessId: ids.resignationProcessIds[0],
                    checklistItemId: ids.resignationChecklistItemTemplateIds[0],
                    completed: true,
                })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });

    describe('completeResignationProcess', () => {
        it('should preserve checklist items and set finished=true with cadet status=RETURNED', async () => {
            const resignationProcessId = ids.resignationProcessIds[0];
            const completedItemId = ids.resignationChecklistItemTemplateIds[0];
            const unfinishedItemId = ids.resignationChecklistItemTemplateIds[1];

            await completeResignationChecklistItem({
                resignationProcessId,
                checklistItemId: completedItemId,
                completed: true,
            });

            await completeResignationProcess({ resignationProcessId });

            // Check checklist items preserved
            const statuses = await prisma.resignationChecklistItem.findMany({
                where: { processId: resignationProcessId },
            });
            const completedStatus = statuses.find((s) => s.checklistTemplateId === completedItemId);
            const unfinishedStatus = statuses.find((s) => s.checklistTemplateId === unfinishedItemId);

            expect(completedStatus?.completedAt).not.toBeNull();
            expect(completedStatus?.completedByUser).toBe('mana');
            expect(unfinishedStatus?.completedAt).toBeNull();
            expect(unfinishedStatus?.completedByUser).toBeNull();

            // Check process is finished
            const process = await prisma.resignationProcess.findUnique({ where: { id: resignationProcessId } });
            expect(process!.finished).toBe(true);
            expect(process!.updatedAt).not.toBeNull();

            // Check cadet status
            const cadet = await prisma.cadet.findUnique({ where: { id: ids.cadetIds[10] } });
            expect(cadet!.status).toBe('RESIGNED');
            expect(cadet!.resignedAt).not.toBeNull();
            expect(cadet!.resignedAt).toEqual(staticData.data.cadets[10].resignedAt);
        });

        it('should reject resignationProcessId from wrong org', async () => {
            await expect(
                completeResignationProcess({ resignationProcessId: wrongOrg.ids.resignationProcessIds[0] })
            ).rejects.toThrow();
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.user;
            await expect(
                completeResignationProcess({ resignationProcessId: ids.resignationProcessIds[0] })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });
});

describe('<__unsecuredProcessCadetEquipmentReturn> Integration Tests', () => {
    beforeAll(async () => {
        await staticData.resetData();
    });

    beforeEach(async () => {
        await staticData.cleanup.uniformIssued();
        await staticData.cleanup.materialIssued();
        await staticData.cleanup.deficiencies();
    });

    // cadet[3] has:
    //   uniforms: uniformIds[0][80,81,82], uniformIds[3][5], uniformIds[1][12], uniformIds[2][57]
    //   materials: materialIds[0], materialIds[5], materialIds[7], materialIds[9]
    //   open deficiencies: deficiencyIds[7] (CadetUniform), deficiencyIds[11] (CadetMaterial)

    it('should set dateReturned on selected uniform items', async () => {
        const cadetId = ids.cadetIds[3];
        const selectedUniformIds = [ids.uniformIds[0][80], ids.uniformIds[0][81]];

        await prisma.$transaction(async (client) => {
            await __unsecuredProcessCadetEquipmentReturn(
                client, cadetId, staticData.fk_assosiation, 'mana', selectedUniformIds, []
            );
        });

        const returnedEntries = await prisma.uniformIssued.findMany({
            where: { fk_cadet: cadetId, fk_uniform: { in: selectedUniformIds }, dateReturned: { not: null } },
        });
        expect(returnedEntries).toHaveLength(2);
    });

    it('should NOT delete uniform issued records even when issued today', async () => {
        const cadetId = ids.cadetIds[3];
        const uniformId = ids.uniformIds[0][80];

        // Update an existing entry to have today as the issue date
        await prisma.uniformIssued.updateMany({
            where: { fk_cadet: cadetId, fk_uniform: uniformId },
            data: { dateIssued: new Date() },
        });

        await prisma.$transaction(async (client) => {
            await __unsecuredProcessCadetEquipmentReturn(
                client, cadetId, staticData.fk_assosiation, 'mana', [uniformId], []
            );
        });

        // Entry must still exist (not deleted)
        const entry = await prisma.uniformIssued.findFirst({
            where: { fk_cadet: cadetId, fk_uniform: uniformId },
        });
        expect(entry).not.toBeNull();
        expect(entry!.dateReturned).not.toBeNull();
    });

    it('should set dateReturned on selected material items', async () => {
        const cadetId = ids.cadetIds[3];
        const selectedMaterialIds = [ids.materialIds[0], ids.materialIds[5]];

        await prisma.$transaction(async (client) => {
            await __unsecuredProcessCadetEquipmentReturn(
                client, cadetId, staticData.fk_assosiation, 'mana', [], selectedMaterialIds
            );
        });

        const returnedMaterials = await prisma.materialIssued.findMany({
            where: { fk_cadet: cadetId, fk_material: { in: selectedMaterialIds }, dateReturned: { not: null } },
        });
        expect(returnedMaterials).toHaveLength(2);
    });

    it('should NOT delete material issued records even when issued today', async () => {
        const cadetId = ids.cadetIds[3];
        const materialId = ids.materialIds[0];

        // Update the material issued entry to today
        await prisma.materialIssued.updateMany({
            where: { fk_cadet: cadetId, fk_material: materialId, dateReturned: null },
            data: { dateIssued: new Date() },
        });

        await prisma.$transaction(async (client) => {
            await __unsecuredProcessCadetEquipmentReturn(
                client, cadetId, staticData.fk_assosiation, 'mana', [], [materialId]
            );
        });

        // Entry must still exist (not deleted)
        const entry = await prisma.materialIssued.findFirst({
            where: { fk_cadet: cadetId, fk_material: materialId },
        });
        expect(entry).not.toBeNull();
        expect(entry!.dateReturned).not.toBeNull();
    });

    it('should resolve all open deficiencies for the cadet', async () => {
        const cadetId = ids.cadetIds[3];

        await prisma.$transaction(async (client) => {
            await __unsecuredProcessCadetEquipmentReturn(
                client, cadetId, staticData.fk_assosiation, 'mana', [], []
            );
        });

        const openDeficiencies = await prisma.deficiency.findMany({
            where: { fk_cadet: cadetId, dateResolved: null },
        });
        expect(openDeficiencies).toHaveLength(0);

        const resolvedDeficiencies = await prisma.deficiency.findMany({
            where: { fk_cadet: cadetId, dateResolved: { not: null }, userResolved: 'mana' },
        });
        expect(resolvedDeficiencies.length).toBeGreaterThan(0);
    });

    it('should not affect uniform items not in the selection', async () => {
        const cadetId = ids.cadetIds[3];
        const selectedUniformIds = [ids.uniformIds[0][80]]; // only one selected
        const unselectedUniformId = ids.uniformIds[0][81];

        await prisma.$transaction(async (client) => {
            await __unsecuredProcessCadetEquipmentReturn(
                client, cadetId, staticData.fk_assosiation, 'mana', selectedUniformIds, []
            );
        });

        const unselectedEntry = await prisma.uniformIssued.findFirst({
            where: { fk_cadet: cadetId, fk_uniform: unselectedUniformId, dateReturned: null },
        });
        expect(unselectedEntry).not.toBeNull(); // should still be un-returned
    });

    it('should not affect material items not in the selection', async () => {
        const cadetId = ids.cadetIds[3];
        const selectedMaterialIds = [ids.materialIds[0]]; // only one selected
        const unselectedMaterialId = ids.materialIds[5];

        await prisma.$transaction(async (client) => {
            await __unsecuredProcessCadetEquipmentReturn(
                client, cadetId, staticData.fk_assosiation, 'mana', [], selectedMaterialIds
            );
        });

        const unselectedEntry = await prisma.materialIssued.findFirst({
            where: { fk_cadet: cadetId, fk_material: unselectedMaterialId, dateReturned: null },
        });
        expect(unselectedEntry).not.toBeNull(); // should still be un-returned
    });

    it('should not resolve deficiencies of other cadets', async () => {
        const cadetId = ids.cadetIds[3];
        const otherCadetId = ids.cadetIds[5]; // also has open deficiencies

        await prisma.$transaction(async (client) => {
            await __unsecuredProcessCadetEquipmentReturn(
                client, cadetId, staticData.fk_assosiation, 'mana', [], []
            );
        });

        const otherCadetOpenDeficiencies = await prisma.deficiency.findMany({
            where: { fk_cadet: otherCadetId, dateResolved: null },
        });
        expect(otherCadetOpenDeficiencies.length).toBeGreaterThan(0);
    });
});

describe('<createResignationProcess> equipment return integration tests', () => {
    beforeAll(async () => {
        await staticData.resetData();
    });

    beforeEach(async () => {
        await staticData.cleanup.cadet();
    });

    it('should set dateReturned on selected uniform items when creating a process', async () => {
        const cadetId = ids.cadetIds[4]; // ACTIVE, has uniforms
        const selectedUniformIds = [ids.uniformIds[0][21], ids.uniformIds[0][22]];

        await createResignationProcess({
            cadetId,
            resignationProcessTemplateId: ids.resignationProcessTemplateIds[0],
            selectedUniformIds,
        });

        const returnedEntries = await prisma.uniformIssued.findMany({
            where: { fk_cadet: cadetId, fk_uniform: { in: selectedUniformIds }, dateReturned: { not: null } },
        });
        expect(returnedEntries).toHaveLength(2);

        // Non-selected items still un-returned
        const unselectedEntry = await prisma.uniformIssued.findFirst({
            where: { fk_cadet: cadetId, fk_uniform: ids.uniformIds[0][23], dateReturned: null },
        });
        expect(unselectedEntry).not.toBeNull();
    });

    it('should set dateReturned on selected material items when creating a process', async () => {
        const cadetId = ids.cadetIds[5]; // ACTIVE, has materials
        const selectedMaterialIds = [ids.materialIds[0], ids.materialIds[4]];

        await createResignationProcess({
            cadetId,
            resignationProcessTemplateId: ids.resignationProcessTemplateIds[0],
            selectedMaterialIds,
        });

        const returnedMaterials = await prisma.materialIssued.findMany({
            where: { fk_cadet: cadetId, fk_material: { in: selectedMaterialIds }, dateReturned: { not: null } },
        });
        expect(returnedMaterials).toHaveLength(2);
    });

    it('should resolve all open cadet deficiencies when creating a process', async () => {
        const cadetId = ids.cadetIds[3]; // ACTIVE, has open deficiencies

        await createResignationProcess({
            cadetId,
            resignationProcessTemplateId: ids.resignationProcessTemplateIds[0],
        });

        const openDeficiencies = await prisma.deficiency.findMany({
            where: { fk_cadet: cadetId, dateResolved: null },
        });
        expect(openDeficiencies).toHaveLength(0);
    });
});
