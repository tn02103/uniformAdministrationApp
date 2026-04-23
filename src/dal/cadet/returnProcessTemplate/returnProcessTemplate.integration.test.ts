import { prisma } from "@/lib/db";
import { AuthRole } from "@/lib/AuthRoles";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { createReturnProcessTemplate, getReturnProcessTemplateList, updateReturnProcessTemplate, deleteReturnProcessTemplate } from "./index";

const staticData = new StaticData(0);
const { ids } = staticData;
const wrongOrg = new StaticData(1);

describe('<ReturnProcessTemplate> Integration Tests', () => {
    beforeAll(async () => {
        await staticData.cleanup.returnProcessTemplate();
    });

    describe('getReturnProcessTemplateList', () => {
        it('should return all templates with checklist items for the org', async () => {
            global.__ROLE__ = AuthRole.inspector;
            const result = await getReturnProcessTemplateList();
            global.__ROLE__ = undefined;

            expect(result).toHaveLength(2);
            const defaultTemplate = result.find((t) => t.id === ids.returnProcessTemplateIds[0]);
            expect(defaultTemplate).toBeDefined();
            expect(defaultTemplate!.defaultProcess).toBe(true);
            expect(defaultTemplate!.checklistItems).toHaveLength(2);
        });

        it('should not return templates from another org', async () => {
            global.__ROLE__ = AuthRole.inspector;
            const result = await getReturnProcessTemplateList();
            global.__ROLE__ = undefined;

            const wrongOrgTemplateIds = wrongOrg.ids.returnProcessTemplateIds;
            result.forEach((t) => {
                expect(wrongOrgTemplateIds).not.toContain(t.id);
            });
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.user;
            await expect(getReturnProcessTemplateList()).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });

    describe('createReturnProcessTemplate', () => {
        it('should create a new template', async () => {
            global.__ROLE__ = AuthRole.admin;
            const result = await createReturnProcessTemplate({
                name: 'Test Template',
                defaultProcess: false,
            });
            global.__ROLE__ = undefined;

            expect(result).toBeDefined();
            expect(result.name).toBe('Test Template');
            expect(result.defaultProcess).toBe(false);

            const db = await prisma.returnProcessTemplate.findUnique({ where: { id: result.id } });
            expect(db).not.toBeNull();
        });

        it('should unset defaultProcess on other templates when creating with defaultProcess=true', async () => {
            // Template[0] has defaultProcess=true initially
            global.__ROLE__ = AuthRole.admin;
            const result = await createReturnProcessTemplate({
                name: 'New Default Template',
                defaultProcess: true,
            });
            global.__ROLE__ = undefined;

            expect(result.defaultProcess).toBe(true);

            const oldDefault = await prisma.returnProcessTemplate.findUnique({
                where: { id: ids.returnProcessTemplateIds[0] },
            });
            expect(oldDefault!.defaultProcess).toBe(false);
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.inspector;
            await expect(
                createReturnProcessTemplate({ name: 'Fail Template' })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });

    describe('updateReturnProcessTemplate', () => {
        it('should update template name', async () => {
            global.__ROLE__ = AuthRole.admin;
            const result = await updateReturnProcessTemplate({
                id: ids.returnProcessTemplateIds[1],
                name: 'Updated Name',
            });
            global.__ROLE__ = undefined;

            expect(result.name).toBe('Updated Name');
        });

        it('should unset defaultProcess on others when setting defaultProcess=true', async () => {
            global.__ROLE__ = AuthRole.admin;
            await updateReturnProcessTemplate({
                id: ids.returnProcessTemplateIds[1],
                defaultProcess: true,
            });
            global.__ROLE__ = undefined;

            const oldDefault = await prisma.returnProcessTemplate.findUnique({
                where: { id: ids.returnProcessTemplateIds[0] },
            });
            expect(oldDefault!.defaultProcess).toBe(false);

            const newDefault = await prisma.returnProcessTemplate.findUnique({
                where: { id: ids.returnProcessTemplateIds[1] },
            });
            expect(newDefault!.defaultProcess).toBe(true);
        });

        it('should reject template from another org', async () => {
            global.__ROLE__ = AuthRole.admin;
            await expect(
                updateReturnProcessTemplate({
                    id: wrongOrg.ids.returnProcessTemplateIds[0],
                    name: 'Hijacked',
                })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.inspector;
            await expect(
                updateReturnProcessTemplate({
                    id: ids.returnProcessTemplateIds[0],
                    name: 'Fail',
                })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });

    describe('deleteReturnProcessTemplate', () => {
        it('should delete a template with no active processes', async () => {
            global.__ROLE__ = AuthRole.admin;
            await deleteReturnProcessTemplate({ id: ids.returnProcessTemplateIds[1] });
            global.__ROLE__ = undefined;

            const db = await prisma.returnProcessTemplate.findUnique({
                where: { id: ids.returnProcessTemplateIds[1] },
            });
            expect(db).toBeNull();
        });

        it('should throw when template has active (unfinished) processes', async () => {
            // returnProcessTemplateIds[0] has active processes from static data
            global.__ROLE__ = AuthRole.admin;
            await expect(
                deleteReturnProcessTemplate({ id: ids.returnProcessTemplateIds[0] })
            ).rejects.toThrow("Cannot delete template with active return processes");
            global.__ROLE__ = undefined;
        });

        it('should reject template from another org', async () => {
            global.__ROLE__ = AuthRole.admin;
            await expect(
                deleteReturnProcessTemplate({ id: wrongOrg.ids.returnProcessTemplateIds[1] })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.inspector;
            await expect(
                deleteReturnProcessTemplate({ id: ids.returnProcessTemplateIds[1] })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });
});
