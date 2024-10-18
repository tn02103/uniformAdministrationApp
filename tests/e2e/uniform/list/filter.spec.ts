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
        await expect(uniformListPage.div_nodata).not.toBeVisible();
    })

    test('E2E0301: validate typeSelect', async ({ page, uniformListPage, staticData: { ids } }) => {
        await test.step('initial with id', async () => {
            await expect(uniformListPage.sel_type).toHaveValue(ids.uniformTypeIds[0]);
            await expect(uniformListPage.div_pageHeader).toContainText('Typ1');
            await expect(uniformListPage.div_othersAccordion).toBeVisible();
        });

        await test.step('initial without id', async () => {
            await page.goto('/de/app/uniform/list');
            await expect(uniformListPage.sel_type).toHaveValue('null');
            await expect(uniformListPage.div_pageHeader).toHaveText('Uniformteile: ');
            await expect(uniformListPage.div_othersAccordion).not.toBeVisible();
            await expect(uniformListPage.div_nodata).toBeVisible();
        });

        await test.step('change selected without id', async () => {
            await uniformListPage.sel_type.selectOption(ids.uniformTypeIds[1]);
            await expect(page).toHaveURL(/uniform\/list\/[\w\d-]{12,36}/);
            await expect(page.url()).toContain(ids.uniformTypeIds[1])
            await expect(uniformListPage.div_pageHeader).toContainText('Typ2');
            await expect(uniformListPage.div_othersAccordion).toBeVisible();
        });
    });
    test('E2E0302: validate initial filter and sessionStorage', async ({ uniformListPage, staticData: { ids } }) => {
        await test.step('initial state', async () => {
            await Promise.all([
                expect.soft(uniformListPage.chk_genFilter(ids.uniformGenerationIds[0])).toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter(ids.uniformGenerationIds[1])).toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter(ids.uniformGenerationIds[2])).toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter_nullValue).toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter_selAll).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter(ids.sizeIds[0])).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter(ids.sizeIds[1])).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter(ids.sizeIds[2])).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter_nullValue).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter_selAll).toBeChecked(),
                expect.soft(uniformListPage.chk_withOwnerFilter).toBeChecked(),
                expect.soft(uniformListPage.chk_withoutOwnerFilter).toBeChecked(),
                expect.soft(uniformListPage.chk_passiveFilter).not.toBeChecked(),
                expect.soft(uniformListPage.chk_activeFilter).toBeChecked(),
            ]);
        });
        await test.step('change data for typ1', async () => {
            await uniformListPage.btn_genAccordion_header.click();
            await uniformListPage.chk_genFilter(ids.uniformGenerationIds[0]).setChecked(false);
            await uniformListPage.chk_genFilter(ids.uniformGenerationIds[1]).setChecked(false);
            await uniformListPage.chk_genFilter_nullValue.setChecked(false);
            await uniformListPage.btn_othersAccordion_header.click();
            await uniformListPage.chk_withOwnerFilter.setChecked(false);
            await uniformListPage.chk_passiveFilter.setChecked(true);
            await uniformListPage.btn_load.click();
        });

        await test.step('select type2', async () => {
            await uniformListPage.sel_type.selectOption(ids.uniformTypeIds[1])
            await Promise.all([
                expect(uniformListPage.div_sizeAccordion).not.toBeVisible(),
                expect.soft(uniformListPage.chk_genFilter_nullValue).toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter(ids.uniformGenerationIds[4])).toBeChecked(),
                expect.soft(uniformListPage.chk_withOwnerFilter).toBeChecked(),
                expect.soft(uniformListPage.chk_withoutOwnerFilter).toBeChecked(),
                expect.soft(uniformListPage.chk_passiveFilter).not.toBeChecked(),
                expect.soft(uniformListPage.chk_activeFilter).toBeChecked(),
            ]);
        });
        await test.step('goback', async () => {
            await uniformListPage.sel_type.selectOption(ids.uniformTypeIds[0]);
            await Promise.all([
                expect.soft(uniformListPage.chk_genFilter(ids.uniformGenerationIds[0])).not.toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter(ids.uniformGenerationIds[1])).not.toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter(ids.uniformGenerationIds[2])).toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter_nullValue).not.toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter_selAll).not.toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter(ids.sizeIds[0])).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter(ids.sizeIds[1])).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter(ids.sizeIds[2])).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter_nullValue).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter_selAll).toBeChecked(),
            ]);
        });
    });
    test('E2E0303: validate search input and helpText', async ({ uniformListPage }) => {
        await test.step('success- 1110', async () => {
            await uniformListPage.txt_search_input.fill(' 1110');
            await expect.soft(uniformListPage.div_search_helptext).toHaveText('1110');
            await expect.soft(uniformListPage.err_search_invalidInput).not.toBeVisible();
        });
        await test.step('success-11 10 ', async () => {
            await uniformListPage.txt_search_input.fill('11 10 ');
            await expect.soft(uniformListPage.div_search_helptext).toHaveText('1110');
            await expect.soft(uniformListPage.err_search_invalidInput).not.toBeVisible();
        });
        await test.step('success-AA1110', async () => {
            await uniformListPage.txt_search_input.fill('AA1110');
            await expect.soft(uniformListPage.div_search_helptext).toContainText('Typ1 - 1110');
            await expect.soft(uniformListPage.err_search_invalidInput).not.toBeVisible();
        });
        await test.step('success-AA-1110', async () => {
            await uniformListPage.txt_search_input.fill('AA-1110');
            await expect.soft(uniformListPage.div_search_helptext).toContainText('Typ1 - 1110');
            await expect.soft(uniformListPage.err_search_invalidInput).not.toBeVisible();
        });
        await test.step('success- AB 1110', async () => {
            await uniformListPage.txt_search_input.fill(' AB 1110');
            await expect.soft(uniformListPage.div_search_helptext).toContainText('Typ2 - 1110');
            await expect.soft(uniformListPage.err_search_invalidInput).not.toBeVisible();
        });
        await test.step('failure-ABC-234', async () => {
            await uniformListPage.txt_search_input.fill('ABC-234');
            await expect.soft(uniformListPage.div_search_helptext).not.toBeVisible();
            await expect.soft(uniformListPage.err_search_invalidInput).toBeVisible();
        });
        await test.step('failure-2sw23', async () => {
            await uniformListPage.txt_search_input.fill('2sw23');
            await expect.soft(uniformListPage.div_search_helptext).not.toBeVisible();
            await expect.soft(uniformListPage.err_search_invalidInput).toBeVisible();
        });
        await test.step('failure-A!235', async () => {
            await uniformListPage.txt_search_input.fill('A!235');
            await expect.soft(uniformListPage.div_search_helptext).not.toBeVisible();
            await expect.soft(uniformListPage.err_search_invalidInput).toBeVisible();
        });
        await test.step('failure-23.23', async () => {
            await uniformListPage.txt_search_input.fill('23.23');
            await expect.soft(uniformListPage.div_search_helptext).not.toBeVisible();
            await expect.soft(uniformListPage.err_search_invalidInput).toBeVisible();
        });
    });
    test('E2E0304: validate typeChange via search', async ({ page, uniformListPage, staticData: { ids } }) => {
        await uniformListPage.txt_search_input.fill('AB 10');
        await uniformListPage.btn_search_submit.click();

        await expect(uniformListPage.div_pageHeader).toContainText('Typ2'),
            await expect(page.url()).toContain(ids.uniformTypeIds[1]),
            await expect(uniformListPage.div_sizeAccordion).not.toBeVisible(),
            await Promise.all([
                expect.soft(uniformListPage.chk_genFilter_nullValue).toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter(ids.uniformGenerationIds[4])).toBeChecked(),
                expect.soft(uniformListPage.chk_withOwnerFilter).toBeChecked(),
                expect.soft(uniformListPage.chk_withoutOwnerFilter).toBeChecked(),
                expect.soft(uniformListPage.chk_passiveFilter).not.toBeChecked(),
                expect.soft(uniformListPage.chk_activeFilter).toBeChecked(),
            ]);
    });
    test('E2E0305: validate search filter', async ({ page, uniformListPage, staticData: { ids } }) => {
        await test.step('via button', async () => {
            await uniformListPage.txt_search_input.fill('110');
            await uniformListPage.btn_search_submit.click();
            await expect(uniformListPage.div_uitem(ids.uniformIds[0][12])).not.toBeVisible();
            await expect(uniformListPage.div_uitem_list).toHaveCount(6);
            await expect(page.getByTestId('div_hilight').nth(0)).toHaveText('110');
        });
        await test.step('via enter', async () => {
            await uniformListPage.txt_search_input.fill('12');
            await uniformListPage.txt_search_input.press('Enter');
            await expect(uniformListPage.div_uitem(ids.uniformIds[0][12])).toBeVisible();
            await expect(uniformListPage.div_uitem_list).toHaveCount(8);
            await expect(page.getByTestId('div_hilight').nth(0)).toHaveText('12');
        });
    });
    test('E2E0306: validate filter options', async ({ page, uniformListPage, staticData: { ids } }) => {
        await test.step('other filters', async () => {
            await uniformListPage.btn_othersAccordion_header.click();
            await uniformListPage.chk_activeFilter.setChecked(false);
            await uniformListPage.chk_passiveFilter.setChecked(false);
            await expect(uniformListPage.err_filter).toBeVisible();

            await uniformListPage.chk_passiveFilter.setChecked(true);
            await expect(uniformListPage.err_filter).not.toBeVisible();

            await uniformListPage.chk_withOwnerFilter.setChecked(false);
            await uniformListPage.chk_withoutOwnerFilter.setChecked(false);
            await expect(uniformListPage.err_filter).toBeVisible();

            await uniformListPage.chk_withOwnerFilter.setChecked(true);
            await expect(uniformListPage.err_filter).not.toBeVisible();
        });

        await test.step('gen & size for typ1', async () => {
            await expect(uniformListPage.div_genAccordion).toBeVisible();
            await expect(uniformListPage.div_sizeAccordion).toBeVisible();
            await expect(page.locator('input[name^="generations."]')).toHaveCount(5);
            await expect(page.locator('input[name^="sizes."]')).toHaveCount(16);
        });

        await test.step('gen & size for typ2', async () => {
            await uniformListPage.sel_type.selectOption(ids.uniformTypeIds[1]);
            await expect(uniformListPage.div_genAccordion).toBeVisible();
            await expect(uniformListPage.div_sizeAccordion).not.toBeVisible();
            await expect(page.locator('input[name^="generations."]')).toHaveCount(3);
        });

        await test.step('gen & size for typ3', async () => {
            await uniformListPage.sel_type.selectOption(ids.uniformTypeIds[2]);
            await expect(uniformListPage.div_genAccordion).not.toBeVisible();
            await expect(uniformListPage.div_sizeAccordion).toBeVisible();
            await expect(page.locator('input[name^="sizes."]')).toHaveCount(12);
        });

        await test.step('gen & size for typ4', async () => {
            await uniformListPage.sel_type.selectOption(ids.uniformTypeIds[3]);
            await expect(uniformListPage.div_genAccordion).not.toBeVisible();
            await expect(uniformListPage.div_sizeAccordion).not.toBeVisible();
        });
    });
    test('E2E0307: validate selectAll', async ({ uniformListPage, staticData: { ids } }) => {
        await test.step('generation', async () => {
            await uniformListPage.btn_genAccordion_header.click();
            await Promise.all([
                expect(uniformListPage.chk_genFilter_selAll).toBeChecked(),
                expect(uniformListPage.chk_genFilter_nullValue).toBeChecked(),
                expect(uniformListPage.chk_genFilter(ids.uniformGenerationIds[0])).toBeChecked(),
                expect(uniformListPage.chk_genFilter(ids.uniformGenerationIds[2])).toBeChecked(),
            ]);

            await test.step('validate indirect via gen', async () => {
                await uniformListPage.chk_genFilter(ids.uniformGenerationIds[0]).setChecked(false);
                await expect(uniformListPage.chk_genFilter_selAll).not.toBeChecked();
                await uniformListPage.chk_genFilter(ids.uniformGenerationIds[0]).setChecked(true);
                await expect(uniformListPage.chk_genFilter_selAll).toBeChecked();
            });

            await test.step('validate indirect via nullValue', async () => {
                await uniformListPage.chk_genFilter_nullValue.setChecked(false);
                await expect(uniformListPage.chk_genFilter_selAll).not.toBeChecked();
                await uniformListPage.chk_genFilter_nullValue.setChecked(true);
                await expect(uniformListPage.chk_genFilter_selAll).toBeChecked();
            });

            await test.step('validate direct', async () => {
                await uniformListPage.chk_genFilter_selAll.setChecked(false);
                await Promise.all([
                    expect(uniformListPage.chk_genFilter_nullValue).not.toBeChecked(),
                    expect(uniformListPage.chk_genFilter(ids.uniformGenerationIds[0])).not.toBeChecked(),
                    expect(uniformListPage.chk_genFilter(ids.uniformGenerationIds[2])).not.toBeChecked(),
                ]);

                await uniformListPage.chk_genFilter_selAll.setChecked(true);
                await Promise.all([
                    expect(uniformListPage.chk_genFilter_nullValue).toBeChecked(),
                    expect(uniformListPage.chk_genFilter(ids.uniformGenerationIds[0])).toBeChecked(),
                    expect(uniformListPage.chk_genFilter(ids.uniformGenerationIds[2])).toBeChecked(),
                ]);
            })
        });
        await test.step('size', async () => {
            await uniformListPage.btn_sizeAccordion_header.click();
            await Promise.all([
                expect(uniformListPage.chk_genFilter_selAll).toBeChecked(),
                expect(uniformListPage.chk_genFilter_nullValue).toBeChecked(),
                expect(uniformListPage.chk_sizeFilter(ids.sizeIds[0])).toBeChecked(),
                expect(uniformListPage.chk_sizeFilter(ids.sizeIds[2])).toBeChecked(),
            ]);
            await test.step('validate indirect via size', async () => {
                await uniformListPage.chk_sizeFilter(ids.sizeIds[0]).setChecked(false);
                await expect(uniformListPage.chk_sizeFilter_selAll).not.toBeChecked();
                await uniformListPage.chk_sizeFilter(ids.sizeIds[0]).setChecked(true);
                await expect(uniformListPage.chk_sizeFilter_selAll).toBeChecked();
            });
            await test.step('validate indirect via nullValue', async () => {
                await uniformListPage.chk_sizeFilter_nullValue.setChecked(false);
                await expect(uniformListPage.chk_sizeFilter_selAll).not.toBeChecked();
                await uniformListPage.chk_sizeFilter_nullValue.setChecked(true);
                await expect(uniformListPage.chk_sizeFilter_selAll).toBeChecked();
            });
            await test.step('validate direct', async () => {
                await uniformListPage.chk_sizeFilter_selAll.setChecked(false);
                await Promise.all([
                    expect(uniformListPage.chk_sizeFilter_nullValue).not.toBeChecked(),
                    expect(uniformListPage.chk_sizeFilter(ids.sizeIds[0])).not.toBeChecked(),
                    expect(uniformListPage.chk_sizeFilter(ids.sizeIds[2])).not.toBeChecked(),
                ]);

                await uniformListPage.chk_sizeFilter_selAll.setChecked(true);
                await Promise.all([
                    expect(uniformListPage.chk_sizeFilter_nullValue).toBeChecked(),
                    expect(uniformListPage.chk_sizeFilter(ids.sizeIds[0])).toBeChecked(),
                    expect(uniformListPage.chk_sizeFilter(ids.sizeIds[2])).toBeChecked(),
                ]);
            });
        });
    });
});