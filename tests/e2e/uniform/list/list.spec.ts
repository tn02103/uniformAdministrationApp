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

    test('integration: sort order and header buttons', async ({ page, uniformListPage, staticData: { ids } }) => {
        // Click header buttons and check URL and data order
        await uniformListPage.div_header_number.click();
        await expect(page).toHaveURL(`/de/app/uniform/list/${ids.uniformTypeIds[0]}?asc=false`);
        await uniformListPage.div_header_number.click();
        await expect(page).toHaveURL(`/de/app/uniform/list/${ids.uniformTypeIds[0]}?asc=true`);
        await uniformListPage.div_header_generation.click();
        await expect(page).toHaveURL(`/de/app/uniform/list/${ids.uniformTypeIds[0]}?asc=true&orderBy=generation`);
        await uniformListPage.div_header_owner.click();
        await expect(page).toHaveURL(`/de/app/uniform/list/${ids.uniformTypeIds[0]}?asc=true&orderBy=owner`);
    });

    test('integration: filter and search update displayed data', async ({ uniformListPage, staticData: { ids, data } }) => {
        // Initial count
        let uniformList = data.uniformList.filter(u => u.fk_uniformType === ids.uniformTypeIds[0]);
        await expect(uniformListPage.div_header_count).not.toHaveText(String(uniformList.length));

        // Filter by size
        await uniformListPage.btn_sizeAccordion_header.click();
        await uniformListPage.chk_sizeFilter_selAll.setChecked(false);
        await uniformListPage.chk_sizeFilter(ids.sizeIds[1]).setChecked(true);
        await uniformListPage.btn_load.click();
        // Expect filtered count
        uniformList = uniformList.filter(u => u.fk_size === ids.sizeIds[1]);
        await expect(uniformListPage.div_header_count).not.toHaveText(String(uniformList.length));
        // Search
        await uniformListPage.txt_search_input.fill('1101');
        await uniformListPage.btn_search_submit.click();
        await expect(uniformListPage.div_header_count).toContainText('1');
        await expect(uniformListPage.div_uitem_list).toHaveCount(1);
    });

    test('integration: displayed data matches expected after filter and search', async ({ uniformListPage, staticData: { ids, data } }) => {
        // Apply a filter and search, then check a known uniform
        await uniformListPage.btn_genAccordion_header.click();
        await uniformListPage.chk_genFilter_selAll.setChecked(false);
        await uniformListPage.chk_genFilter(ids.uniformGenerationIds[0]).setChecked(true);
        await uniformListPage.btn_load.click();
        await uniformListPage.txt_search_input.fill('1101');
        await uniformListPage.btn_search_submit.click();
        // Check that the correct uniform is visible
        await expect(uniformListPage.div_uitem_list.nth(0)).toBeVisible();
        await expect(uniformListPage.div_uitem_number(ids.uniformIds[0][1])).toHaveText('1101');
        await expect(uniformListPage.div_uitem_generation(ids.uniformIds[0][1])).toHaveText(data.uniformGenerations[0].name);
        await expect(uniformListPage.div_uitem_size(ids.uniformIds[0][1])).toHaveText(data.uniformSizes[1].name);
        await expect(uniformListPage.lnk_uitem_owner(ids.uniformIds[0][1])).toContainText(data.cadets[5].firstname);
        await expect(uniformListPage.lnk_uitem_owner(ids.uniformIds[0][1])).toContainText(data.cadets[5].lastname);
        await expect(uniformListPage.div_uitem_comment(ids.uniformIds[0][1])).toHaveText(data.uniformList[1].comment ?? "");

        await uniformListPage.txt_search_input.fill('99999');
        await uniformListPage.btn_search_submit.click();
        // After searching for a non-existent uniform, expect no items
        await expect(uniformListPage.div_nodata).toBeVisible();
        await expect(uniformListPage.div_uitem_list).toHaveCount(0);

        await uniformListPage.txt_search_input.fill('AC-1310');
        await uniformListPage.btn_search_submit.click();
        // After searching for a valid uniform, expect it to be visible again
        await expect(uniformListPage.div_uitem_list).toHaveCount(1);
        await expect(uniformListPage.div_uitem_number(ids.uniformIds[2][10])).toHaveText('1310');
        await expect(uniformListPage.div_uitem_generation(ids.uniformIds[2][10])).toBeHidden();
        await expect(uniformListPage.div_uitem_size(ids.uniformIds[2][10])).toHaveText(data.uniformSizes[2].name);
        await expect(uniformListPage.div_uitem(ids.uniformIds[2][10])).toContainText(data.storageUnits[2].name);
    });
});
