import { expect } from "playwright/test";
import { adminTest } from "../../../_playwrightConfig/setup";
import { UniformListPage } from "../../../_playwrightConfig/pages/uniform/uniformList.page";

type Fixture = {
    uniformListPage: UniformListPage;
}

const test = adminTest.extend<Fixture>({
    uniformListPage: async ({ page }, use) => use(new UniformListPage(page)),
});

test.describe(() => {
    test.beforeEach(async ({ page, uniformListPage, staticData: { ids } }) => {
        await page.goto(`/de/app/uniform/list/${ids.uniformTypeIds[0]}`);
        await expect(uniformListPage.div_nodata).toBeHidden();
    });

    test('integration: sessionStorage filter config per uniformType', async ({ uniformListPage, staticData: { ids } }) => {
        // Change some filters and submit
        await uniformListPage.btn_genAccordion_header.click();
        await uniformListPage.chk_genFilter(ids.uniformGenerationIds[0]).setChecked(false);
        await uniformListPage.chk_genFilter(ids.uniformGenerationIds[1]).setChecked(false);
        await uniformListPage.chk_genFilter_nullValue.setChecked(false);
        await uniformListPage.btn_othersAccordion_header.click();
        await uniformListPage.chk_issuedFilter.setChecked(false);
        await uniformListPage.chk_isReserveFilter.setChecked(true);
        await uniformListPage.btn_load.click();

        // Change type and back, expect filter config to persist
        await uniformListPage.sel_type.selectOption(ids.uniformTypeIds[1]);
        await uniformListPage.sel_type.selectOption(ids.uniformTypeIds[0]);
        await expect.soft(uniformListPage.chk_genFilter(ids.uniformGenerationIds[0])).not.toBeChecked();
        await expect.soft(uniformListPage.chk_genFilter(ids.uniformGenerationIds[1])).not.toBeChecked();
        await expect.soft(uniformListPage.chk_genFilter_nullValue).not.toBeChecked();
        await expect.soft(uniformListPage.chk_issuedFilter).not.toBeChecked();
        await expect.soft(uniformListPage.chk_isReserveFilter).toBeChecked();
    });

    // eslint-disable-next-line playwright/no-skipped-test
    test.skip('integration: changing UniformType updates filter and data', async ({page, uniformListPage, staticData: { ids } }) => {
        await uniformListPage.sel_type.selectOption(ids.uniformTypeIds[1]);
        await page.waitForURL(`/de/app/uniform/list/${ids.uniformTypeIds[1]}`);
        
        await expect(uniformListPage.div_pageHeader).toContainText('Typ2');
        await expect(uniformListPage.div_othersAccordion).toBeVisible();
        // Check that only generations filter is visible for Typ2
        await expect(uniformListPage.div_genAccordion).toBeVisible();
        await expect(uniformListPage.div_sizeAccordion).toBeHidden();
    });

    test('integration: changing search input updates helptext and data', async ({ uniformListPage }) => {
        await uniformListPage.txt_search_input.fill('AA-1110');
        await expect(uniformListPage.div_search_helptext).toContainText('Typ1 - 1110');
        await uniformListPage.btn_search_submit.click();
        // After search, expect filtered data (helptext and table)
        await expect(uniformListPage.div_uitem_list).toHaveCount(1);
        await expect(uniformListPage.div_uitem_list.nth(0)).toBeVisible();
    });

    test('integration: generation filter works', async ({ uniformListPage, staticData: { ids, data } }) => {
        // Filter by generation
        await uniformListPage.btn_genAccordion_header.click();
        await uniformListPage.chk_genFilter_selAll.setChecked(false);
        await uniformListPage.chk_genFilter(ids.uniformGenerationIds[0]).setChecked(true);
        await uniformListPage.btn_load.click();
        // Expect only uniforms with this generation to be shown
        const count = data.uniformList.filter(u => u.fk_generation === ids.uniformGenerationIds[0] && !u.recdelete).length;
        await expect(uniformListPage.div_uitem_list).toHaveCount(count);
        // Check a known uniform number or id (1100, 1101, 1102, 1103, 1104, 1105, 1106, 1107, 1108, 1109, 1110, 1111)
        const rows = await uniformListPage.div_uitem_list.all();
        await Promise.all(
            rows.map(async (row) => {
                await expect(row.getByTestId("div_generation")).toHaveText(data.uniformGenerations[0].name);
            }),
        );
    });

    test('integration: size filter works', async ({ uniformListPage, staticData: { ids, data } }) => {
        // Filter by size
        await uniformListPage.btn_sizeAccordion_header.click();
        await uniformListPage.chk_sizeFilter_selAll.setChecked(false);
        await uniformListPage.chk_sizeFilter(ids.sizeIds[0]).setChecked(true);
        await uniformListPage.btn_load.click();
        // Expect only uniforms with this size to be shown
        const count = data.uniformList.filter(u => (
            (u.fk_uniformType === ids.uniformTypeIds[0])
            && (u.fk_size === ids.sizeIds[0])
            && !u.recdelete
        )).length;
        await expect(uniformListPage.div_uitem_list).toHaveCount(count);
        const rows = await uniformListPage.div_uitem_list.all();
        await Promise.all(
            rows.map(async (row) => {
                await expect(row.getByTestId("div_size")).toHaveText(data.uniformSizes[0].name);
            })
        );
    });
});
