import { cleanDataV2 } from "@/dal/_helper/testHelper";
import { AuthRole } from "@/lib/AuthRoles";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { getReturnProcessConfig } from "./returnProcess";

const staticData = new StaticData(0);
const { ids } = staticData;
const wrongOrg = new StaticData(1);

describe('getReturnProcessConfig', () => {
    it('should return returnProcessEnabled, anonymizationMode and templates with checklistItems', async () => {
        const result = await getReturnProcessConfig();

        expect(result).toBeDefined();
        expect(typeof result.returnProcessEnabled).toBe('boolean');
        expect(result.anonymizationMode).toBeDefined();
        expect(Array.isArray(result.templates)).toBe(true);
        const template = result.templates.find((t) => t.id === ids.returnProcessTemplateIds[0]);
        expect(template).toBeDefined();
        expect(Array.isArray(template!.checklistItems)).toBe(true);
        // checklistItems should be in sortOrder order
        const orders = template!.checklistItems.map((i) => i.sortOrder);
        expect(orders).toEqual([...orders].sort((a, b) => a - b));
        expect(cleanDataV2(result)).toMatchSnapshot();
    });

    it('should not return templates from another org', async () => {
        const result = await getReturnProcessConfig();
        const wrongOrgTemplateIds = wrongOrg.ids.returnProcessTemplateIds;
        result.templates.forEach((t) => {
            expect(wrongOrgTemplateIds).not.toContain(t.id);
        });
    });

    it('should reject insufficient role', async () => {
        global.__ROLE__ = AuthRole.user;
        await expect(getReturnProcessConfig()).rejects.toThrow();
        global.__ROLE__ = undefined;
    });
});