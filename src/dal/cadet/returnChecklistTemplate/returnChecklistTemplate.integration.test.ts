import { prisma } from "@/lib/db";
import { AuthRole } from "@/lib/AuthRoles";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { createReturnChecklistTemplate, updateReturnChecklistTemplate, deleteReturnChecklistTemplate, changeReturnChecklistTemplateSortOrder } from "./index";

const staticData = new StaticData(0);
const { ids } = staticData;
const wrongOrg = new StaticData(1);

describe('<ReturnChecklistTemplate> Integration Tests', () => {
    beforeAll(async () => {
        await staticData.cleanup.returnProcessTemplate();
    });

    describe('createReturnChecklistTemplate', () => {
        it('should append as first item with sortOrder=0 when template is empty', async () => {
            // returnProcessTemplateIds[1] starts with one item (returnChecklistTemplateIds[2], sortOrder=0)
            // Delete it first so template is empty
            await prisma.returnChecklistTemplate.deleteMany({
                where: { fk_returnProcessTemplate: ids.returnProcessTemplateIds[1] }
            });

            global.__ROLE__ = AuthRole.admin;
            const result = await createReturnChecklistTemplate({
                returnProcessTemplateId: ids.returnProcessTemplateIds[1],
                label: 'Helm abgeben',
            });
            global.__ROLE__ = undefined;

            expect(result).toBeDefined();
            expect(result.label).toBe('Helm abgeben');
            expect(result.sortOrder).toBe(0);
            expect(result.fk_returnProcessTemplate).toBe(ids.returnProcessTemplateIds[1]);
        });

        it('should append at the end with sortOrder = MAX + 1 when items already exist', async () => {
            // returnProcessTemplateIds[0] has items at sortOrder 0 and 1
            global.__ROLE__ = AuthRole.admin;
            const result = await createReturnChecklistTemplate({
                returnProcessTemplateId: ids.returnProcessTemplateIds[0],
                label: 'Neues Item',
            });
            global.__ROLE__ = undefined;

            expect(result.sortOrder).toBe(2); // existing: 0 and 1, new = 2
        });

        it('should append independently per template', async () => {
            // Adding to templateIds[1] which now has 1 item (sortOrder=0 from first test)
            global.__ROLE__ = AuthRole.admin;
            const result = await createReturnChecklistTemplate({
                returnProcessTemplateId: ids.returnProcessTemplateIds[1],
                label: 'Second item in alt template',
            });
            global.__ROLE__ = undefined;

            expect(result.sortOrder).toBe(1); // only 1 existing item at 0, new = 1
        });

        it('should reject returnProcessTemplateId from another org', async () => {
            global.__ROLE__ = AuthRole.admin;
            await expect(
                createReturnChecklistTemplate({
                    returnProcessTemplateId: wrongOrg.ids.returnProcessTemplateIds[0],
                    label: 'Hijacked Item',
                })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.inspector;
            await expect(
                createReturnChecklistTemplate({
                    returnProcessTemplateId: ids.returnProcessTemplateIds[0],
                    label: 'Fail Item',
                })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });

    describe('updateReturnChecklistTemplate', () => {
        it('should update label', async () => {
            global.__ROLE__ = AuthRole.admin;
            const result = await updateReturnChecklistTemplate({
                id: ids.returnChecklistTemplateIds[0],
                label: 'Updated Label',
            });
            global.__ROLE__ = undefined;

            expect(result.label).toBe('Updated Label');
        });

        it('should reject checklist item from another org', async () => {
            global.__ROLE__ = AuthRole.admin;
            await expect(
                updateReturnChecklistTemplate({
                    id: wrongOrg.ids.returnChecklistTemplateIds[0],
                    label: 'Hijacked',
                })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.inspector;
            await expect(
                updateReturnChecklistTemplate({
                    id: ids.returnChecklistTemplateIds[0],
                    label: 'Fail',
                })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });

    describe('deleteReturnChecklistTemplate', () => {
        beforeAll(async () => {
            await staticData.cleanup.returnProcessTemplate();
        });

        it('should delete a checklist item', async () => {
            global.__ROLE__ = AuthRole.admin;
            await deleteReturnChecklistTemplate({ id: ids.returnChecklistTemplateIds[2] });
            global.__ROLE__ = undefined;

            const db = await prisma.returnChecklistTemplate.findUnique({
                where: { id: ids.returnChecklistTemplateIds[2] },
            });
            expect(db).toBeNull();
        });

        it('should shift sortOrders of following items after deletion', async () => {
            // returnProcessTemplateIds[0] has items: [0]=sortOrder:0, [1]=sortOrder:1
            // Delete item at sortOrder=0 → item at sortOrder=1 should become sortOrder=0
            global.__ROLE__ = AuthRole.admin;
            await deleteReturnChecklistTemplate({ id: ids.returnChecklistTemplateIds[0] });
            global.__ROLE__ = undefined;

            const remaining = await prisma.returnChecklistTemplate.findUnique({
                where: { id: ids.returnChecklistTemplateIds[1] },
            });
            expect(remaining).not.toBeNull();
            expect(remaining!.sortOrder).toBe(0); // was 1, now shifted down to 0
        });

        it('should not change sortOrders when deleting the last item', async () => {
            // Only returnChecklistTemplateIds[1] remains in template[0] at sortOrder=0
            global.__ROLE__ = AuthRole.admin;
            await deleteReturnChecklistTemplate({ id: ids.returnChecklistTemplateIds[1] });
            global.__ROLE__ = undefined;

            const remaining = await prisma.returnChecklistTemplate.findMany({
                where: { fk_returnProcessTemplate: ids.returnProcessTemplateIds[0] },
            });
            expect(remaining).toHaveLength(0);
        });

        it('should reject checklist item from another org', async () => {
            global.__ROLE__ = AuthRole.admin;
            await expect(
                deleteReturnChecklistTemplate({ id: wrongOrg.ids.returnChecklistTemplateIds[0] })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.inspector;
            await expect(
                deleteReturnChecklistTemplate({ id: ids.returnChecklistTemplateIds[2] })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });

    describe('changeReturnChecklistTemplateSortOrder', () => {
        beforeEach(async () => {
            await staticData.cleanup.returnProcessTemplate();
        });

        it('should move an item to a lower position (move up)', async () => {
            // items in template[0]: [0]=sortOrder:0, [1]=sortOrder:1
            // Move item[1] to position 0
            global.__ROLE__ = AuthRole.admin;
            const result = await changeReturnChecklistTemplateSortOrder({
                checklistItemId: ids.returnChecklistTemplateIds[1],
                newPosition: 0,
            });
            global.__ROLE__ = undefined;

            const moved = result.find(i => i.id === ids.returnChecklistTemplateIds[1]);
            const shifted = result.find(i => i.id === ids.returnChecklistTemplateIds[0]);
            expect(moved!.sortOrder).toBe(0);
            expect(shifted!.sortOrder).toBe(1);
        });

        it('should move an item to a higher position (move down)', async () => {
            // [0]=sortOrder:0, [1]=sortOrder:1 
            // Move item[0] back to position 0
            global.__ROLE__ = AuthRole.admin;
            const result = await changeReturnChecklistTemplateSortOrder({
                checklistItemId: ids.returnChecklistTemplateIds[1],
                newPosition: 0,
            });
            global.__ROLE__ = undefined;

            const moved = result.find(i => i.id === ids.returnChecklistTemplateIds[0]);
            const shifted = result.find(i => i.id === ids.returnChecklistTemplateIds[1]);
            expect(moved!.sortOrder).toBe(1);
            expect(shifted!.sortOrder).toBe(0);

        });

        it('should be a no-op when position does not change', async () => {
            const before = await prisma.returnChecklistTemplate.findMany({
                where: { fk_returnProcessTemplate: ids.returnProcessTemplateIds[0] },
                orderBy: { sortOrder: 'asc' },
            });

            global.__ROLE__ = AuthRole.admin;
            await changeReturnChecklistTemplateSortOrder({
                checklistItemId: ids.returnChecklistTemplateIds[0],
                newPosition: before.find(i => i.id === ids.returnChecklistTemplateIds[0])!.sortOrder,
            });
            global.__ROLE__ = undefined;

            const after = await prisma.returnChecklistTemplate.findMany({
                where: { fk_returnProcessTemplate: ids.returnProcessTemplateIds[0] },
                orderBy: { sortOrder: 'asc' },
            });
            expect(after.map(i => i.id)).toEqual(before.map(i => i.id));
        });

        it('should reject invalid newPosition (out of bounds)', async () => {
            global.__ROLE__ = AuthRole.admin;
            await expect(
                changeReturnChecklistTemplateSortOrder({
                    checklistItemId: ids.returnChecklistTemplateIds[0],
                    newPosition: 999,
                })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });

        it('should reject item from another org', async () => {
            global.__ROLE__ = AuthRole.admin;
            await expect(
                changeReturnChecklistTemplateSortOrder({
                    checklistItemId: wrongOrg.ids.returnChecklistTemplateIds[0],
                    newPosition: 0,
                })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.inspector;
            await expect(
                changeReturnChecklistTemplateSortOrder({
                    checklistItemId: ids.returnChecklistTemplateIds[0],
                    newPosition: 0,
                })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });
});
