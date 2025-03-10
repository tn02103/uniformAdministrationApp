import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import { MaterialGroupDetailComponent } from "../../../_playwrightConfig/pages/admin/material/MaterialGroupDetail.components";
import { MaterialGroupListComponent } from "../../../_playwrightConfig/pages/admin/material/MaterialGroupList.component";
import { adminTest } from "../../../_playwrightConfig/setup";

type Fixture = {
    groupListComponent: MaterialGroupListComponent;
    groupDetailComponent: MaterialGroupDetailComponent;
}
const test = adminTest.extend<Fixture>({
    groupListComponent: async ({ page }, use) => use(new MaterialGroupListComponent(page)),
    groupDetailComponent: async ({ page }, use) => use(new MaterialGroupDetailComponent(page)),
});
test.beforeEach(async ({ page }) => {
    await page.goto('/de/app/admin/material');
});
test.afterEach(async ({ staticData: { cleanup } }) => {
    await cleanup.materialConfig();
});

test('validate data', async ({ page, groupListComponent, staticData: { data } }) => {
    const divList = await page.locator('div[data-testid^="div_mGroup_row_"]');
    await expect(divList).toHaveCount(4);
    await expect(divList.nth(0)).toHaveAttribute('data-testid', `div_mGroup_row_${data.materialGroups[0].id}`)
    await expect(divList.nth(1)).toHaveAttribute('data-testid', `div_mGroup_row_${data.materialGroups[1].id}`)
    await expect(divList.nth(2)).toHaveAttribute('data-testid', `div_mGroup_row_${data.materialGroups[2].id}`)
    await expect(divList.nth(3)).toHaveAttribute('data-testid', `div_mGroup_row_${data.materialGroups[4].id}`)

    await expect(groupListComponent.div_mGroup_name(data.materialGroups[0].id)).toHaveText(data.materialGroups[0].description);
    await expect(groupListComponent.div_mGroup_name(data.materialGroups[1].id)).toHaveText(data.materialGroups[1].description);
    await expect(groupListComponent.div_mGroup_name(data.materialGroups[2].id)).toHaveText(data.materialGroups[2].description);
    await expect(groupListComponent.div_mGroup_name(data.materialGroups[4].id)).toHaveText(data.materialGroups[4].description);
});

test('validate moveUp', async ({ page, groupListComponent, staticData: { ids } }) => {
    await test.step('do action and validate ui', async () => {
        await groupListComponent.btn_mGroup_moveUp(ids.materialGroupIds[1]).click();

        const divList = await page.locator('div[data-testid^="div_mGroup_row_"]');
        await expect.soft(divList.nth(0)).toHaveAttribute('data-testid', `div_mGroup_row_${ids.materialGroupIds[1]}`);
    });
    await test.step('validate db ', async () => {
        const [initial, seccond] = await prisma.$transaction([
            prisma.materialGroup.findUnique({
                where: { id: ids.materialGroupIds[1] }
            }),
            prisma.materialGroup.findUnique({
                where: { id: ids.materialGroupIds[0] }
            }),
        ]);

        expect.soft(initial?.sortOrder).toBe(0);
        expect.soft(seccond?.sortOrder).toBe(1);
    });
});
test('validate moveDown', async ({ page, groupListComponent, staticData: { ids } }) => {
    await test.step('do action and validate ui', async () => {
        await groupListComponent.btn_mGroup_moveDown(ids.materialGroupIds[1]).click();

        const divList = await page.locator('div[data-testid^="div_mGroup_row_"]').all();
        await expect.soft(divList[2]).toHaveAttribute('data-testid', `div_mGroup_row_${ids.materialGroupIds[1]}`);
    });
    await test.step('validate db ', async () => {
        const [initial, seccond] = await prisma.$transaction([
            prisma.materialGroup.findUnique({
                where: { id: ids.materialGroupIds[1] }
            }),
            prisma.materialGroup.findUnique({
                where: { id: ids.materialGroupIds[2] }
            }),
        ]);

        expect.soft(initial?.sortOrder).toBe(2);
        expect.soft(seccond?.sortOrder).toBe(1);
    });
});
test('validate create', async ({ page, groupListComponent, groupDetailComponent, staticData: { fk_assosiation } }) => {
    await test.step('create and validate ui', async () => {
        await groupListComponent.btn_create.click();

        const divList = page.locator('div[data-testid^="div_mGroup_row_"]');
        await expect(divList.nth(4)).toBeVisible();
        await expect(divList.nth(4)).toContainText('Gruppe-1');

        await expect(groupDetailComponent.div_header).toHaveText('Gruppe-1');
        await Promise.all([
            expect.soft(groupDetailComponent.txt_name).toBeEditable(),
            expect.soft(groupDetailComponent.txt_name).toHaveValue('Gruppe-1'),
            expect.soft(groupDetailComponent.txt_issuedDefault).toHaveValue(''),
            expect.soft(groupDetailComponent.chk_multitypeAllowed).not.toBeChecked(),
        ]);
    });
    await test.step('validte db', async () => {
        const dbGroup = await prisma.materialGroup.findFirst({
            where: { fk_assosiation, description: "Gruppe-1" }
        });

        expect(dbGroup).not.toBeNull();
        dbGroup?.recdeleteUser
        expect(dbGroup).toEqual(expect.objectContaining({
            description: "Gruppe-1",
            sortOrder: 4,
            recdelete: null,
            recdeleteUser: null
        }));
    });
});
test('validate open', async ({groupListComponent, groupDetailComponent, staticData: {data: {materialGroups}}}) => {
    await expect(groupListComponent.btn_mGroup_select(materialGroups[0].id)).toBeVisible();

    groupListComponent.btn_mGroup_select(materialGroups[0].id).click();
    await expect(groupDetailComponent.div_header).toHaveText(materialGroups[0].description);
    await expect(groupListComponent.btn_mGroup_select(materialGroups[0].id)).not.toBeVisible();
});
