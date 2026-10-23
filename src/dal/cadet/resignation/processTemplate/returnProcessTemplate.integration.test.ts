import { prisma } from "@/lib/db";
import { AuthRole } from "@/lib/AuthRoles";
import { StaticData } from "../../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { createResignationProcessTemplate, getResignationProcessTemplateList, updateResignationProcessTemplate, deleteResignationProcessTemplate } from "./index";

const staticData = new StaticData(0);
const { ids } = staticData;
const wrongOrg = new StaticData(1);

describe('<ResignationProcessTemplate> Integration Tests', () => {
    afterAll(async () => {
        global.__ROLE__ = undefined;
        await staticData.cleanup.resignationProcessTemplate();
    });

    beforeEach(async () => {
        await staticData.cleanup.resignationProcessTemplate();
    });

    describe('getResignationProcessTemplateList', () => {
        it('should return all templates with checklist items for the org', async () => {
            global.__ROLE__ = AuthRole.inspector;
            const result = await getResignationProcessTemplateList();
            global.__ROLE__ = undefined;

            expect(result).toHaveLength(2);
            const defaultTemplate = result.find((t) => t.id === ids.resignationProcessTemplateIds[0]);
            expect(defaultTemplate).toBeDefined();
            expect(defaultTemplate!.defaultProcess).toBe(true);
            expect(defaultTemplate!.checklistItemTemplates).toHaveLength(2);
        });

        it('should not return templates from another org', async () => {
            global.__ROLE__ = AuthRole.inspector;
            const result = await getResignationProcessTemplateList();
            global.__ROLE__ = undefined;

            const wrongOrgTemplateIds = wrongOrg.ids.resignationProcessTemplateIds;
            result.forEach((t) => {
                expect(wrongOrgTemplateIds).not.toContain(t.id);
            });
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.user;
            await expect(getResignationProcessTemplateList()).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });

    describe('createResignationProcessTemplate', () => {
        it('should create a new template', async () => {
            global.__ROLE__ = AuthRole.admin;
            const result = await createResignationProcessTemplate({
                name: 'Test Template',
                defaultProcess: false,
            });
            global.__ROLE__ = undefined;

            expect(result).toBeDefined();
            expect(result).toHaveLength(3); 
            const created = result.find((t) => t.name === 'Test Template');
            expect(created).toBeDefined();
            expect(created!.name).toBe('Test Template');
            expect(created!.defaultProcess).toBe(false);

            const db = await prisma.resignationProcessTemplate.findUnique({ where: { id: created!.id } });
            expect(db).not.toBeNull();
        });

        it('should unset defaultProcess on other templates when creating with defaultProcess=true', async () => {
            // Template[0] has defaultProcess=true initially
            global.__ROLE__ = AuthRole.admin;
            const result = await createResignationProcessTemplate({
                name: 'New Default Template',
                defaultProcess: true,
            });
            global.__ROLE__ = undefined;

            expect(result).toHaveLength(3);
            const newDefault = result.find((t) => t.name === 'New Default Template');
            expect(newDefault).toBeDefined();
            expect(newDefault!.defaultProcess).toBe(true);

            const oldDefault = await prisma.resignationProcessTemplate.findUnique({
                where: { id: ids.resignationProcessTemplateIds[0] },
            });
            expect(oldDefault!.defaultProcess).toBe(false);
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.inspector;
            await expect(
                createResignationProcessTemplate({ name: 'Fail Template' })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });

    describe('updateResignationProcessTemplate', () => {
        it('should update template name', async () => {
            global.__ROLE__ = AuthRole.admin;
            const result = await updateResignationProcessTemplate({
                id: ids.resignationProcessTemplateIds[1],
                name: 'Updated Name',
            });
            global.__ROLE__ = undefined;

            expect(result).length(2);
            const updated = result.find((t) => t.id === ids.resignationProcessTemplateIds[1]);
            expect(updated).toBeDefined();
            expect(updated!.name).toBe('Updated Name');
        });

        it('should unset defaultProcess on others when setting defaultProcess=true', async () => {
            global.__ROLE__ = AuthRole.admin;
            await updateResignationProcessTemplate({
                id: ids.resignationProcessTemplateIds[1],
                defaultProcess: true,
            });
            global.__ROLE__ = undefined;

            const oldDefault = await prisma.resignationProcessTemplate.findUnique({
                where: { id: ids.resignationProcessTemplateIds[0] },
            });
            expect(oldDefault!.defaultProcess).toBe(false);

            const newDefault = await prisma.resignationProcessTemplate.findUnique({
                where: { id: ids.resignationProcessTemplateIds[1] },
            });
            expect(newDefault!.defaultProcess).toBe(true);
        });

        it('should reject template from another org', async () => {
            global.__ROLE__ = AuthRole.admin;
            await expect(
                updateResignationProcessTemplate({
                    id: wrongOrg.ids.resignationProcessTemplateIds[0],
                    name: 'Hijacked',
                })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.inspector;
            await expect(
                updateResignationProcessTemplate({
                    id: ids.resignationProcessTemplateIds[0],
                    name: 'Fail',
                })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });

    describe('deleteResignationProcessTemplate', () => {
        it('should delete a template with no active processes', async () => {
            global.__ROLE__ = AuthRole.admin;
            const result = await deleteResignationProcessTemplate({ id: ids.resignationProcessTemplateIds[1] });
            global.__ROLE__ = undefined;
            expect(result).toHaveLength(1);
            expect(result.map((i) => i.id)).not.toContain(ids.resignationProcessTemplateIds[1]);

            const db = await prisma.resignationProcessTemplate.findUnique({
                where: { id: ids.resignationProcessTemplateIds[1] },
            });
            expect(db).toBeNull();
        });

        it('should throw when template has active (unfinished) processes', async () => {
            // resignationProcessTemplateIds[0] has active processes from static data
            global.__ROLE__ = AuthRole.admin;
            await expect(
                deleteResignationProcessTemplate({ id: ids.resignationProcessTemplateIds[0] })
            ).rejects.toThrow("Cannot delete template with active return processes");
            global.__ROLE__ = undefined;
        });

        it('should reject template from another org', async () => {
            global.__ROLE__ = AuthRole.admin;
            await expect(
                deleteResignationProcessTemplate({ id: wrongOrg.ids.resignationProcessTemplateIds[1] })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });

        it('should reject insufficient role', async () => {
            global.__ROLE__ = AuthRole.inspector;
            await expect(
                deleteResignationProcessTemplate({ id: ids.resignationProcessTemplateIds[1] })
            ).rejects.toThrow();
            global.__ROLE__ = undefined;
        });
    });
});
