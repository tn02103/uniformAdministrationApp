import german from "@/../public/locales/de";
import { expect } from "playwright/test";
import { prisma } from "../../../../src/lib/db";
import { newDescriptionValidationTests, numberValidationTests } from "../../../_playwrightConfig/global/testSets";
import { MaterialGroupDetailComponent } from "../../../_playwrightConfig/pages/admin/material/MaterialGroupDetail.components";
import { MaterialGroupListComponent } from "../../../_playwrightConfig/pages/admin/material/MaterialGroupList.component";
import { DangerConfirmationModal } from "../../../_playwrightConfig/pages/popups/DangerConfirmationPopup.component";
import { adminTest } from "../../../_playwrightConfig/setup";
import { isToday } from "date-fns";

type Fixture = {
    groupListComponent: MaterialGroupListComponent;
    groupDetailComponent: MaterialGroupDetailComponent;
}
const test = adminTest.extend<Fixture>({
    groupListComponent: async ({ page }, use) => use(new MaterialGroupListComponent(page)),
    groupDetailComponent: async ({ page }, use) => use(new MaterialGroupDetailComponent(page)),
});
test.beforeEach(async ({ page, staticData: { ids } }) => {
    await page.goto(`/de/app/admin/material?selectedGroupId=${ids.materialGroupIds[1]}`);
});
test.afterEach(async ({ staticData: { cleanup } }) => {
    await cleanup.materialConfig();
});

test.describe('formValidation', () => {
    test('description', async ({ page, groupDetailComponent }) => {
        await groupDetailComponent.btn_edit.click();
        const testSets = newDescriptionValidationTests({ minLength: 0, maxLength: 20 });

        for (const set of testSets) {
            await test.step(String(set.testValue), async () => {
                await groupDetailComponent.txt_name.fill(String(set.testValue));
                await page.keyboard.press('Tab');
                if (set.valid) {
                    await expect(groupDetailComponent.err_name).toBeHidden();
                } else {
                    await expect(groupDetailComponent.err_name).toBeVisible();
                }
            });
        }
    });
    test('issuedDefault', async ({ page, groupDetailComponent }) => {
        await groupDetailComponent.btn_edit.click();
        const testSets = numberValidationTests({ min: 0, max: 200, testEmpty: true, strict: false, emptyValid: true });

        for (const set of testSets) {
            await test.step(String(set.testValue), async () => {
                await groupDetailComponent.txt_issuedDefault.fill(String(set.testValue));
                await page.keyboard.press('Tab');
                if (set.valid) {
                    await expect(groupDetailComponent.err_issuedDefault).toBeHidden();
                } else {
                    await expect(groupDetailComponent.err_issuedDefault).toBeVisible();
                }
            });
        }
    });
})
test('validate Data', async ({ groupDetailComponent, staticData: { data } }) => {
    const group = data.materialGroups[1];
    await Promise.all([
        expect.soft(groupDetailComponent.div_header).toHaveText(group.description),
        expect.soft(groupDetailComponent.txt_name).toHaveValue(group.description),
        expect.soft(groupDetailComponent.txt_issuedDefault).toHaveValue(String(group.issuedDefault)),
        expect.soft(groupDetailComponent.div_multitypeAllowed).toHaveText(german.common.no),

        expect.soft(groupDetailComponent.btn_edit).toBeVisible(),
        expect.soft(groupDetailComponent.btn_delete).toBeVisible(),
        expect.soft(groupDetailComponent.btn_cancel).toBeHidden(),
        expect.soft(groupDetailComponent.btn_save).toBeHidden(),
        expect.soft(groupDetailComponent.chk_multitypeAllowed).toBeHidden(),
    ]);
    await groupDetailComponent.btn_edit.click();
    await Promise.all([
        expect.soft(groupDetailComponent.btn_edit).toBeHidden(),
        expect.soft(groupDetailComponent.btn_delete).toBeHidden(),
        expect.soft(groupDetailComponent.btn_cancel).toBeVisible(),
        expect.soft(groupDetailComponent.btn_save).toBeVisible(),
        expect.soft(groupDetailComponent.chk_multitypeAllowed).toBeVisible(),
    ]);
});
test('validate edit & save', async ({ page, groupDetailComponent, groupListComponent, staticData: { ids } }) => {
    await test.step('change data', async () => {
        await groupDetailComponent.btn_edit.click();
        await groupDetailComponent.txt_name.fill("testName");
        await groupDetailComponent.txt_issuedDefault.fill("2");
        await groupDetailComponent.chk_multitypeAllowed.click();

        await groupDetailComponent.btn_save.click();
        await page.locator('.Toastify__toast--success').isVisible();
    });
    await test.step('validate ui', async () => {
        await Promise.all([
            expect.soft(groupDetailComponent.div_header).toHaveText('testName'),
            expect.soft(groupListComponent.div_mGroup_name(ids.materialGroupIds[1])).toHaveText('testName'),
            expect.soft(groupDetailComponent.txt_name).toHaveValue('testName'),
            expect.soft(groupDetailComponent.txt_issuedDefault).toHaveValue('2'),
            expect.soft(groupDetailComponent.div_multitypeAllowed).toHaveText(german.common.yes),
        ]);
    });

    await test.step('validate db', async () => {
        const dbGroup = await prisma.materialGroup.findUnique({ where: { id: ids.materialGroupIds[1] } });
        expect(dbGroup).toBeDefined();
        expect(dbGroup!.description).toBe('testName');
        expect(dbGroup!.issuedDefault).toBe(2);
        expect(dbGroup!.multitypeAllowed).toBeTruthy();
    });
});
test('validate edit & cancel', async ({ groupDetailComponent, groupListComponent, staticData: { data } }) => {
    const group = data.materialGroups[1];
    await test.step('change data', async () => {
        await groupDetailComponent.btn_edit.click();
        await groupDetailComponent.txt_name.fill("testName");
        await groupDetailComponent.txt_issuedDefault.fill("2");
        await groupDetailComponent.chk_multitypeAllowed.click();
        await groupDetailComponent.btn_cancel.click();
    });
    await test.step('validate ui', async () => {
        await Promise.all([
            expect.soft(groupDetailComponent.div_header).toHaveText(group.description),
            expect.soft(groupListComponent.div_mGroup_name(group.id)).toHaveText(group.description),
            expect.soft(groupDetailComponent.txt_name).toHaveValue(group.description),
            expect.soft(groupDetailComponent.txt_issuedDefault).toHaveValue(String(group.issuedDefault)),
            expect.soft(groupDetailComponent.div_multitypeAllowed).toHaveText(german.common.no),
        ]);
    });
});
test('validate delete', async ({ page, groupDetailComponent, groupListComponent, staticData: { ids, data } }) => {
    const group = data.materialGroups[1];
    const dangerModal = new DangerConfirmationModal(page);
    const translation = german.admin.material.delete.group;

    await test.step('validate modal', async () => {
        await groupDetailComponent.btn_delete.click();
        await expect(dangerModal.div_popup).toBeVisible();
        await expect.soft(dangerModal.div_header).toHaveText(translation.header.replace("{group}", group.description));
        await expect.soft(dangerModal.div_confirmationText).toContainText(translation.confirmationText.replace("{group}", group.description))
    });

    await test.step('delete and validate ui', async () => {
        await dangerModal.txt_confirmation.fill(translation.confirmationText.replace('{group}', group.description));
        await dangerModal.btn_save.click();

        await expect(groupListComponent.div_mGroup(group.id)).toBeHidden();
        await expect(groupDetailComponent.div_mGroup).toBeHidden();
    });
    const [dbIssued, dbTypes, dbGroup, dbGroup3] = await prisma.$transaction([
        prisma.materialIssued.findFirst({
            where: {
                fk_cadet: ids.cadetIds[0],
                fk_material: ids.materialIds[5],
            }
        }),
        prisma.material.findMany({
            where: { fk_materialGroup: group.id },
            orderBy: { recdelete: "asc" }
        }),
        prisma.materialGroup.findUniqueOrThrow({
            where: { id: group.id }
        }),
        prisma.materialGroup.findUniqueOrThrow({
            where: { id: ids.materialGroupIds[2] }
        }),
    ]);
    await test.step('validate DB: material returned', async () => {
        expect(dbIssued).not.toBeNull();
        expect(dbIssued?.dateReturned).not.toBeNull();
    });

    await test.step('validate DB: material deleted', async () => {
        expect(dbTypes).toHaveLength(4);
        expect(dbTypes[0].recdelete).not.toBeNull();
        expect(dbTypes[0].recdeleteUser).toEqual('admin');
        expect(isToday(dbTypes[0].recdelete!)).toBeFalsy();
        expect(dbTypes[1].recdelete).not.toBeNull();
        expect(dbTypes[1].recdeleteUser).toEqual('test4');
        expect(isToday(dbTypes[1].recdelete!)).toBeTruthy();
        expect(dbTypes[2].recdelete).not.toBeNull();
        expect(dbTypes[2].recdeleteUser).toEqual('test4');
        expect(isToday(dbTypes[2].recdelete!)).toBeTruthy();
        expect(dbTypes[3].recdelete).not.toBeNull();
        expect(dbTypes[3].recdeleteUser).toEqual('test4');
        expect(isToday(dbTypes[2].recdelete!)).toBeTruthy();
    });

    await test.step('validate DB: materialGroup deleted', async () => {
        expect(dbGroup.recdelete).not.toBeNull();
        expect(dbGroup.recdeleteUser).toEqual('test4');
    });
    await test.step('validate DB: sortorder adapted', async () => {
        expect(dbGroup3.sortOrder).toBe(1);
    });
});
