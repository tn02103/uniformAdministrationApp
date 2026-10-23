import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { changeResignationChecklistItemTemplateSortOrder, createResignationChecklistItemTemplate, deleteResignationChecklistItemTemplate, updateResignationChecklistItemTemplate } from "./index";

const staticData = new StaticData(0);
const { ids } = staticData;
const wrongOrg = new StaticData(1);

describe('<ResignationChecklistItemTemplate> Integration Tests', () => {
    afterAll(async () => {
        global.__ROLE__ = undefined;
        await staticData.cleanup.resignationProcessTemplate();
    });

    beforeEach(async () => {
        global.__ROLE__ = AuthRole.admin;
        await staticData.cleanup.resignationProcessTemplate();
    });

    describe('createResignationChecklistItemTemplate', () => {
        it('should append as first item with sortOrder=0 when template is empty', async () => {
            // resignationProcessTemplateIds[1] starts with one item (resignationChecklistItemTemplateIds[2], sortOrder=0)
            // Delete it first so template is empty
            await prisma.resignationChecklistItemTemplate.deleteMany({
                where: { processTemplateId: ids.resignationProcessTemplateIds[1] }
            });

            const result = await createResignationChecklistItemTemplate({
                resignationProcessTemplateId: ids.resignationProcessTemplateIds[1],
                label: 'Helm abgeben',
            });

            expect(result).toBeDefined();
            expect(result).toHaveLength(2);
            expect(result[0].checklistItemTemplates).toHaveLength(1);
            expect(result[0].checklistItemTemplates[0].label).toBe('Helm abgeben');
            expect(result[0].checklistItemTemplates[0].sortOrder).toBe(0);
            expect(result[0].id).toBe(ids.resignationProcessTemplateIds[1]);
        });

        it('should append at the end with sortOrder = MAX + 1 when items already exist', async () => {
            // resignationProcessTemplateIds[0] has items at sortOrder 0 and 1
            const result = await createResignationChecklistItemTemplate({
                resignationProcessTemplateId: ids.resignationProcessTemplateIds[0],
                label: 'Neues Item',
            });

            expect(result).toHaveLength(2);
            expect(result[1].checklistItemTemplates).toHaveLength(3);
            expect(result[1].checklistItemTemplates[2].label).toBe('Neues Item');
            expect(result[1].checklistItemTemplates[0].sortOrder).toBe(0);
            expect(result[1].checklistItemTemplates[1].sortOrder).toBe(1);
            expect(result[1].checklistItemTemplates[2].sortOrder).toBe(2); // existing: 0 and 1, new = 2
        });

        it('should reject resignationProcessTemplateId from another org', async () => {
            await expect(
                createResignationChecklistItemTemplate({
                    resignationProcessTemplateId: wrongOrg.ids.resignationProcessTemplateIds[0],
                    label: 'Hijacked Item',
                })
            ).rejects.toThrow();
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.inspector;
            await expect(
                createResignationChecklistItemTemplate({
                    resignationProcessTemplateId: ids.resignationProcessTemplateIds[0],
                    label: 'Fail Item',
                })
            ).rejects.toThrow();
        });
    });

    describe('updateResignationChecklistItemTemplate', () => {
        it('should update label', async () => {
            const result = await updateResignationChecklistItemTemplate({
                id: ids.resignationChecklistItemTemplateIds[0],
                label: 'Updated Label',
            });

            expect(result).toHaveLength(2);
            expect(result[1].checklistItemTemplates).toHaveLength(2);
            const updatedItem = result[1].checklistItemTemplates.find(i => i.id === ids.resignationChecklistItemTemplateIds[0]);
            expect(updatedItem).toBeDefined();
            expect(updatedItem!.label).toBe('Updated Label');
        });

        it('should reject checklist item from another org', async () => {
            await expect(
                updateResignationChecklistItemTemplate({
                    id: wrongOrg.ids.resignationChecklistItemTemplateIds[0],
                    label: 'Hijacked',
                })
            ).rejects.toThrow();
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.inspector;
            await expect(
                updateResignationChecklistItemTemplate({
                    id: ids.resignationChecklistItemTemplateIds[0],
                    label: 'Fail',
                })
            ).rejects.toThrow();
        });
    });

    describe('deleteResignationChecklistItemTemplate', () => {
        beforeAll(async () => {
            await staticData.cleanup.resignationProcessTemplate();
        });

        it('should delete a checklist item', async () => {
            const result = await deleteResignationChecklistItemTemplate({ id: ids.resignationChecklistItemTemplateIds[2] });

            // verify return
            expect(result).toHaveLength(2);
            const alltemplateItemIds = result.flatMap(t => t.checklistItemTemplates.map(i => i.id));
            expect(alltemplateItemIds).not.toContain(ids.resignationChecklistItemTemplateIds[2]);

            // verify deletion in DB
            const db = await prisma.resignationChecklistItemTemplate.findUnique({
                where: { id: ids.resignationChecklistItemTemplateIds[2] },
            });
            expect(db).toBeNull();
        });

        it('should shift sortOrders of following items after deletion', async () => {
            // resignationProcessTemplateIds[0] has items: [0]=sortOrder:0, [1]=sortOrder:1
            // Delete item at sortOrder=0 → item at sortOrder=1 should become sortOrder=0
            await deleteResignationChecklistItemTemplate({ id: ids.resignationChecklistItemTemplateIds[0] });

            const remaining = await prisma.resignationChecklistItemTemplate.findUnique({
                where: { id: ids.resignationChecklistItemTemplateIds[1] },
            });
            expect(remaining).not.toBeNull();
            expect(remaining!.sortOrder).toBe(0); // was 1, now shifted down to 0
        });

        it('should be able to delete the last item', async () => {
            // Only resignationChecklistItemTemplateIds[1] remains in template[0] at sortOrder=0
            await deleteResignationChecklistItemTemplate({ id: ids.resignationChecklistItemTemplateIds[2] });

            const remaining = await prisma.resignationChecklistItemTemplate.findMany({
                where: { processTemplateId: ids.resignationProcessTemplateIds[1] },
            });
            expect(remaining).toHaveLength(0);
        });

        it('should reject checklist item from another org', async () => {
            await expect(
                deleteResignationChecklistItemTemplate({ id: wrongOrg.ids.resignationChecklistItemTemplateIds[0] })
            ).rejects.toThrow();
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.inspector;
            await expect(
                deleteResignationChecklistItemTemplate({ id: ids.resignationChecklistItemTemplateIds[2] })
            ).rejects.toThrow();
        });
    });

    describe('changeResignationChecklistItemTemplateSortOrder', () => {
        beforeEach(async () => {
            await staticData.cleanup.resignationProcessTemplate();
        });

        it('should move an item to a lower position (move up)', async () => {
            // items in template[0]: [0]=sortOrder:0, [1]=sortOrder:1
            // Move item[1] to position 0
            const result = await changeResignationChecklistItemTemplateSortOrder({
                checklistItemId: ids.resignationChecklistItemTemplateIds[1],
                newPosition: 0,
            });

            expect(result).toHaveLength(2);
            expect(result[1].checklistItemTemplates).toHaveLength(2);
            expect(result[1].checklistItemTemplates[0].id).toBe(ids.resignationChecklistItemTemplateIds[1]);
            expect(result[1].checklistItemTemplates[0].sortOrder).toBe(0);
            expect(result[1].checklistItemTemplates[1].id).toBe(ids.resignationChecklistItemTemplateIds[0]);
            expect(result[1].checklistItemTemplates[1].sortOrder).toBe(1);
        });

        it('should move an item to a higher position (move down)', async () => {
            // [0]=sortOrder:0, [1]=sortOrder:1 
            // Move item[0] back to position 0
            const result = await changeResignationChecklistItemTemplateSortOrder({
                checklistItemId: ids.resignationChecklistItemTemplateIds[1],
                newPosition: 0,
            });

            expect(result).toHaveLength(2);
            expect(result[1].checklistItemTemplates).toHaveLength(2);
            expect(result[1].checklistItemTemplates[0].id).toBe(ids.resignationChecklistItemTemplateIds[1]);
            expect(result[1].checklistItemTemplates[0].sortOrder).toBe(0);
            expect(result[1].checklistItemTemplates[1].id).toBe(ids.resignationChecklistItemTemplateIds[0]);
            expect(result[1].checklistItemTemplates[1].sortOrder).toBe(1);
        });

        it('shoud move an item multiple positions top bound', async () => {
            // Add a third and fourth item so we have more positions to move
            await prisma.resignationChecklistItemTemplate.createMany({
                data: [
                    {
                        id: ids.resignationChecklistItemTemplateIds[3],
                        processTemplateId: ids.resignationProcessTemplateIds[0],
                        fk_assosiation: staticData.fk_assosiation,
                        label: 'Item 3',
                        sortOrder: 2,
                    },
                    {
                        id: ids.resignationChecklistItemTemplateIds[4],
                        processTemplateId: ids.resignationProcessTemplateIds[0],
                        fk_assosiation: staticData.fk_assosiation,
                        label: 'Item 4',
                        sortOrder: 3,
                    },
                ]
            });

            // Current order: [0,1,3,4] at sortOrder [0,1,2,3]
            // Move item[1] (sortOrder=1) to position 3 → new order should be [0,3,4,1] with sortOrders [0,1,2,3]
            const result = await changeResignationChecklistItemTemplateSortOrder({
                checklistItemId: ids.resignationChecklistItemTemplateIds[1],
                newPosition: 3,
            });

            expect(result).toHaveLength(2);
            expect(result[1].checklistItemTemplates).toHaveLength(4);
            expect(result[1].checklistItemTemplates[0].id).toBe(ids.resignationChecklistItemTemplateIds[0]);
            expect(result[1].checklistItemTemplates[0].sortOrder).toBe(0);
            expect(result[1].checklistItemTemplates[1].id).toBe(ids.resignationChecklistItemTemplateIds[3]);
            expect(result[1].checklistItemTemplates[1].sortOrder).toBe(1);
            expect(result[1].checklistItemTemplates[2].id).toBe(ids.resignationChecklistItemTemplateIds[4]);
            expect(result[1].checklistItemTemplates[2].sortOrder).toBe(2);
            expect(result[1].checklistItemTemplates[3].id).toBe(ids.resignationChecklistItemTemplateIds[1]);
            expect(result[1].checklistItemTemplates[3].sortOrder).toBe(3);
        });

        it('shoud move an item multiple positions bottom bound', async () => {
            // Add a third and fourth item so we have more positions to move
            await prisma.resignationChecklistItemTemplate.createMany({
                data: [
                    {
                        id: ids.resignationChecklistItemTemplateIds[3],
                        processTemplateId: ids.resignationProcessTemplateIds[0],
                        fk_assosiation: staticData.fk_assosiation,
                        label: 'Item 3',
                        sortOrder: 2,
                    },
                    {
                        id: ids.resignationChecklistItemTemplateIds[4],
                        processTemplateId: ids.resignationProcessTemplateIds[0],
                        fk_assosiation: staticData.fk_assosiation,
                        label: 'Item 4',
                        sortOrder: 3,
                    },
                ]
            });
            // Current order: [0,1,3,4] at sortOrder [0,1,2,3]
            // Move item[3] (sortOrder=3) to position 0 → new order should be [3,0,1,4] with sortOrders [0,1,2,3]
            const result = await changeResignationChecklistItemTemplateSortOrder({
                checklistItemId: ids.resignationChecklistItemTemplateIds[3],
                newPosition: 0,
            });

            expect(result).toHaveLength(2);
            expect(result[1].checklistItemTemplates).toHaveLength(4);
            expect(result[1].checklistItemTemplates[0].id).toBe(ids.resignationChecklistItemTemplateIds[3]);
            expect(result[1].checklistItemTemplates[0].sortOrder).toBe(0);
            expect(result[1].checklistItemTemplates[1].id).toBe(ids.resignationChecklistItemTemplateIds[0]);
            expect(result[1].checklistItemTemplates[1].sortOrder).toBe(1);
            expect(result[1].checklistItemTemplates[2].id).toBe(ids.resignationChecklistItemTemplateIds[1]);
            expect(result[1].checklistItemTemplates[2].sortOrder).toBe(2);
            expect(result[1].checklistItemTemplates[3].id).toBe(ids.resignationChecklistItemTemplateIds[4]);
            expect(result[1].checklistItemTemplates[3].sortOrder).toBe(3);
        });


        it('should be a no-op when position does not change', async () => {
            const before = await prisma.resignationChecklistItemTemplate.findMany({
                where: { processTemplateId: ids.resignationProcessTemplateIds[0] },
                orderBy: { sortOrder: 'asc' },
            });

            await changeResignationChecklistItemTemplateSortOrder({
                checklistItemId: ids.resignationChecklistItemTemplateIds[0],
                newPosition: before.find(i => i.id === ids.resignationChecklistItemTemplateIds[0])!.sortOrder,
            });

            const after = await prisma.resignationChecklistItemTemplate.findMany({
                where: { processTemplateId: ids.resignationProcessTemplateIds[0] },
                orderBy: { sortOrder: 'asc' },
            });
            expect(after.map(i => i.id)).toEqual(before.map(i => i.id));
        });

        it('should reject invalid newPosition (out of bounds)', async () => {
            await expect(
                changeResignationChecklistItemTemplateSortOrder({
                    checklistItemId: ids.resignationChecklistItemTemplateIds[0],
                    newPosition: 999,
                })
            ).rejects.toThrow();
        });

        it('should reject item from another org', async () => {
            await expect(
                changeResignationChecklistItemTemplateSortOrder({
                    checklistItemId: wrongOrg.ids.resignationChecklistItemTemplateIds[0],
                    newPosition: 0,
                })
            ).rejects.toThrow();
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.inspector;
            await expect(
                changeResignationChecklistItemTemplateSortOrder({
                    checklistItemId: ids.resignationChecklistItemTemplateIds[0],
                    newPosition: 0,
                })
            ).rejects.toThrow();
        });
    });
});
