import { prisma } from "@/lib/db";
import { AuthRole } from "@/lib/AuthRoles";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { createReturnChecklistTemplate, updateReturnChecklistTemplate, deleteReturnChecklistTemplate } from "./index";

const staticData = new StaticData(0);
const { ids } = staticData;
const wrongOrg = new StaticData(1);

describe('<ReturnChecklistTemplate> Integration Tests', () => {
    beforeAll(async () => {
        await staticData.cleanup.returnProcessTemplate();
    });

    describe('createReturnChecklistTemplate', () => {
        it('should create a new checklist item for a template', async () => {
            global.__ROLE__ = AuthRole.admin;
            const result = await createReturnChecklistTemplate({
                returnProcessTemplateId: ids.returnProcessTemplateIds[0],
                label: 'Helm abgeben',
                sortOrder: 10,
            });
            global.__ROLE__ = undefined;

            expect(result).toBeDefined();
            expect(result.label).toBe('Helm abgeben');
            expect(result.sortOrder).toBe(10);
            expect(result.fk_returnProcessTemplate).toBe(ids.returnProcessTemplateIds[0]);

            const db = await prisma.returnChecklistTemplate.findUnique({ where: { id: result.id } });
            expect(db).not.toBeNull();
        });

        it('should use sortOrder=0 when not provided', async () => {
            global.__ROLE__ = AuthRole.admin;
            const result = await createReturnChecklistTemplate({
                returnProcessTemplateId: ids.returnProcessTemplateIds[0],
                label: 'Ohne Sortorder',
            });
            global.__ROLE__ = undefined;

            expect(result.sortOrder).toBe(0);
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
        it('should update label and sortOrder', async () => {
            global.__ROLE__ = AuthRole.admin;
            const result = await updateReturnChecklistTemplate({
                id: ids.returnChecklistTemplateIds[0],
                label: 'Updated Label',
                sortOrder: 5,
            });
            global.__ROLE__ = undefined;

            expect(result.label).toBe('Updated Label');
            expect(result.sortOrder).toBe(5);
        });

        it('should update only label when sortOrder not provided', async () => {
            const before = await prisma.returnChecklistTemplate.findUnique({
                where: { id: ids.returnChecklistTemplateIds[0] },
            });

            global.__ROLE__ = AuthRole.admin;
            const result = await updateReturnChecklistTemplate({
                id: ids.returnChecklistTemplateIds[0],
                label: 'Only Label',
            });
            global.__ROLE__ = undefined;

            expect(result.label).toBe('Only Label');
            expect(result.sortOrder).toBe(before!.sortOrder);
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
        it('should delete a checklist item', async () => {
            global.__ROLE__ = AuthRole.admin;
            await deleteReturnChecklistTemplate({ id: ids.returnChecklistTemplateIds[2] }); // belongs to template[1] which has no active processes
            global.__ROLE__ = undefined;

            const db = await prisma.returnChecklistTemplate.findUnique({
                where: { id: ids.returnChecklistTemplateIds[2] },
            });
            expect(db).toBeNull();
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
});
