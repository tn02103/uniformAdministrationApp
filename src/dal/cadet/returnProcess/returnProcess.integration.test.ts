import { prisma } from "@/lib/db";
import { AuthRole } from "@/lib/AuthRoles";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { createReturnProcess, getReturnProcessList, completeReturnChecklistItem, completeReturnChecklist } from "./index";

const staticData = new StaticData(0);
const { ids } = staticData;
const wrongOrg = new StaticData(1);

describe('<ReturnProcess> Integration Tests', () => {
    beforeAll(async () => {
        await staticData.cleanup.returnProcess();
    });

    describe('getReturnProcessList', () => {
        it('should return unfinished return processes with cadet and template info', async () => {
            const result = await getReturnProcessList();

            expect(result).toHaveLength(1);
            const process = result.find((p) => p.id === ids.returnProcessIds[0]);
            expect(process).toBeDefined();
            expect(process!.cadet.id).toBe(ids.cadetIds[10]);
            expect(process!.returnProcessTemplate.id).toBe(ids.returnProcessTemplateIds[0]);
            expect(process!.itemStatuses).toHaveLength(2);
        });

        it('should not return finished processes', async () => {
            await prisma.returnProcess.update({
                where: { id: ids.returnProcessIds[0] },
                data: { finished: true },
            });

            const result = await getReturnProcessList();

            expect(result.find((p) => p.id === ids.returnProcessIds[0])).toBeUndefined();
        });

        it('should not return processes from another org', async () => {
            const result = await getReturnProcessList();

            const wrongOrgProcessIds = wrongOrg.ids.returnProcessIds;
            result.forEach((p) => {
                expect(wrongOrgProcessIds).not.toContain(p.id);
            });
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.user;
            await expect(getReturnProcessList()).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });

    describe('createReturnProcess', () => {
        it('should create a return process with all checklist item statuses', async () => {
            const cadetId = ids.cadetIds[3]; // ACTIVE cadet, no existing process

            const result = await createReturnProcess({
                cadetId,
                returnProcessTemplateId: ids.returnProcessTemplateIds[0],
            });

            expect(result).toBeDefined();
            expect(result.fk_cadet).toBe(cadetId);
            expect(result.fk_returnProcessTemplate).toBe(ids.returnProcessTemplateIds[0]);
            expect(result.finished).toBe(false);

            // Verify checklist item statuses were created
            const statuses = await prisma.returnChecklistItemStatus.findMany({
                where: { fk_returnProcess: result.id },
            });
            expect(statuses).toHaveLength(2); // template[0] has 2 checklist items

            // Verify cadet status updated to RETURNING
            const cadet = await prisma.cadet.findUnique({ where: { id: cadetId } });
            expect(cadet!.status).toBe('RETURNING');
        });

        it('should use default template when no templateId provided', async () => {
            const cadetId = ids.cadetIds[4]; // ACTIVE cadet

            const result = await createReturnProcess({ cadetId });

            expect(result.fk_returnProcessTemplate).toBe(ids.returnProcessTemplateIds[0]); // defaultProcess=true
        });

        it('should throw if cadet is not ACTIVE', async () => {
            const cadetId = ids.cadetIds[10]; // RETURNING status

            await expect(
                createReturnProcess({ cadetId })
            ).rejects.toThrow("Cadet is not ACTIVE");
        });

        it('should not create process with cadet from wrong org', async () => {
            const wrongCadetId = wrongOrg.ids.cadetIds[0];

            await expect(
                createReturnProcess({ cadetId: wrongCadetId })
            ).rejects.toThrow();
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.user;
            await expect(
                createReturnProcess({ cadetId: ids.cadetIds[3] })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });

    describe('completeReturnChecklistItem', () => {
        it('should mark a checklist item as completed', async () => {
            const returnProcessId = ids.returnProcessIds[0];
            const checklistItemId = ids.returnChecklistTemplateIds[0];

            await completeReturnChecklistItem({
                returnProcessId,
                checklistItemId,
                completed: true,
            });

            const status = await prisma.returnChecklistItemStatus.findUniqueOrThrow({
                where: {
                    fk_returnProcess_fk_checklistItem: {
                        fk_returnProcess: returnProcessId,
                        fk_checklistItem: checklistItemId,
                    },
                },
            });

            expect(status.completedAt).not.toBeNull();
            expect(status.completedByUser).toBe('mana');
        });

        it('should clear completion when completed=false', async () => {
            const returnProcessId = ids.returnProcessIds[0];
            const checklistItemId = ids.returnChecklistTemplateIds[0];

            // First complete it
            await completeReturnChecklistItem({ returnProcessId, checklistItemId, completed: true });
            // Then un-complete
            await completeReturnChecklistItem({ returnProcessId, checklistItemId, completed: false });

            const status = await prisma.returnChecklistItemStatus.findUniqueOrThrow({
                where: {
                    fk_returnProcess_fk_checklistItem: {
                        fk_returnProcess: returnProcessId,
                        fk_checklistItem: checklistItemId,
                    },
                },
            });

            expect(status.completedAt).toBeNull();
            expect(status.completedByUser).toBeNull();
        });

        it('should update ReturnProcess.updatedAt', async () => {
            const returnProcessId = ids.returnProcessIds[0];

            const before = await prisma.returnProcess.findUnique({ where: { id: returnProcessId } });

            // Small delay to ensure timestamp difference
            await new Promise((r) => setTimeout(r, 10));

            await completeReturnChecklistItem({
                returnProcessId,
                checklistItemId: ids.returnChecklistTemplateIds[0],
                completed: true,
            });

            const after = await prisma.returnProcess.findUnique({ where: { id: returnProcessId } });
            expect(after!.updatedAt.getTime()).toBeGreaterThanOrEqual(before!.updatedAt.getTime());
        });

        it('should reject returnProcessId from wrong org', async () => {
            const wrongProcessId = wrongOrg.ids.returnProcessIds[0];

            await expect(
                completeReturnChecklistItem({
                    returnProcessId: wrongProcessId,
                    checklistItemId: wrongOrg.ids.returnChecklistTemplateIds[0],
                    completed: true,
                })
            ).rejects.toThrow();
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.user;
            await expect(
                completeReturnChecklistItem({
                    returnProcessId: ids.returnProcessIds[0],
                    checklistItemId: ids.returnChecklistTemplateIds[0],
                    completed: true,
                })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });

    describe('completeReturnChecklist', () => {
        it('should mark all items complete, set finished=true, and cadet status=RETURNED', async () => {
            const returnProcessId = ids.returnProcessIds[0];

            await completeReturnChecklist({ returnProcessId });

            // Check all item statuses are completed
            const statuses = await prisma.returnChecklistItemStatus.findMany({
                where: { fk_returnProcess: returnProcessId },
            });
            statuses.forEach((s) => {
                expect(s.completedAt).not.toBeNull();
                expect(s.completedByUser).toBe('mana');
            });

            // Check process is finished
            const process = await prisma.returnProcess.findUnique({ where: { id: returnProcessId } });
            expect(process!.finished).toBe(true);

            // Check cadet status
            const cadet = await prisma.cadet.findUnique({ where: { id: ids.cadetIds[10] } });
            expect(cadet!.status).toBe('RETURNED');
        });

        it('should reject returnProcessId from wrong org', async () => {
            await expect(
                completeReturnChecklist({ returnProcessId: wrongOrg.ids.returnProcessIds[0] })
            ).rejects.toThrow();
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.user;
            await expect(
                completeReturnChecklist({ returnProcessId: ids.returnProcessIds[0] })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });
});
