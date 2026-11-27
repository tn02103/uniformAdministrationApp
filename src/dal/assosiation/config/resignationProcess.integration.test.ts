import { cleanDataV2 } from "@/dal/_helper/testHelper";
import { AuthRole } from "@/lib/AuthRoles";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { getResignationProcessConfig } from "./resignationProcess";

const staticData = new StaticData(0);
const { ids } = staticData;
const wrongOrg = new StaticData(1);

describe('getResignationProcessConfig', () => {
    it('should return resignationProcessEnabled, anonymizationMode and templates with checklistItems', async () => {
        const result = await getResignationProcessConfig();

        expect(result).toBeDefined();
        expect(typeof result.resignationProcessEnabled).toBe('boolean');
        expect(result.anonymizationMode).toBeDefined();
        expect(Array.isArray(result.templates)).toBe(true);
        const template = result.templates.find((t) => t.id === ids.resignationProcessTemplateIds[0]);
        expect(template).toBeDefined();
        expect(Array.isArray(template!.checklistItemTemplates)).toBe(true);
        // checklistItems should be in sortOrder order
        const orders = template!.checklistItemTemplates.map((i) => i.sortOrder);
        expect(orders).toEqual([...orders].sort((a, b) => a - b));
        expect(cleanDataV2(result)).toMatchSnapshot();
    });

    it('should not return templates from another org', async () => {
        const result = await getResignationProcessConfig();
        const wrongOrgTemplateIds = wrongOrg.ids.resignationProcessTemplateIds;
        result.templates.forEach((t) => {
            expect(wrongOrgTemplateIds).not.toContain(t.id);
        });
    });

    it('should reject insufficient role', async () => {
        global.__ROLE__ = AuthRole.user;
        await expect(getResignationProcessConfig()).rejects.toThrow();
        global.__ROLE__ = undefined;
    });
});