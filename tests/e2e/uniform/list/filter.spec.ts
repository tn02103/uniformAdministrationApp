import { Page, expect, test } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { UniformListPage } from "../../../pages/uniform/uniformList.page";
import { cleanupData } from "../../../testData/cleanupStatic";

test.use({ storageState: adminAuthFile })
test.describe('', async () => {
    let page: Page;
    let uniformListPage: UniformListPage;

    test.beforeAll(async ({ browser }) => {
        const loadPage = async () => {
            page = await (await browser.newContext()).newPage();
            uniformListPage = new UniformListPage(page);
        }

        await Promise.all([
            loadPage(),
            cleanupData(),
        ]);
    });
    test.beforeEach(async () => {
        await page.goto('/de/app/uniform/list/036ff236-3b83-11ee-ab4b-0068eb8ba754');
        await page.evaluate(() => window.sessionStorage.clear());
        await expect(uniformListPage.div_nodata).not.toBeVisible();
    });

    test('validate typeSelect', async () => {
        await test.step('initial with id', async () => {
            await expect(uniformListPage.sel_type).toHaveValue('036ff236-3b83-11ee-ab4b-0068eb8ba754');
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
            await uniformListPage.sel_type.selectOption('0b95e809-3b83-11ee-ab4b-0068eb8ba754');
            await expect(page).toHaveURL(/uniform\/list\/0b95e809-3b83-11ee-ab4b-0068eb8ba754/);
            await expect(uniformListPage.div_pageHeader).toContainText('Typ2');
            await expect(uniformListPage.div_othersAccordion).toBeVisible();
        });
    });
    test('validate initial filter and sessionStorage', async () => {
        await test.step('initial state', async () => {
            await Promise.all([
                expect.soft(uniformListPage.chk_genFilter('acc01de5-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter('b1f5af66-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter('b839a899-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter_nullValue).toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter_selAll).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter('585509de-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter('3656714b-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter('37665288-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
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
            await uniformListPage.chk_genFilter('acc01de5-3b83-11ee-ab4b-0068eb8ba754').setChecked(false);
            await uniformListPage.chk_genFilter('b1f5af66-3b83-11ee-ab4b-0068eb8ba754').setChecked(false);
            await uniformListPage.chk_genFilter_nullValue.setChecked(false);
            await uniformListPage.btn_othersAccordion_header.click();
            await uniformListPage.chk_withOwnerFilter.setChecked(false);
            await uniformListPage.chk_passiveFilter.setChecked(true);
            await uniformListPage.btn_load.click();
        });

        await test.step('select type2', async () => {
            await uniformListPage.sel_type.selectOption('0b95e809-3b83-11ee-ab4b-0068eb8ba754')
            await Promise.all([
                expect(uniformListPage.div_sizeAccordion).not.toBeVisible(),
                expect.soft(uniformListPage.chk_genFilter_nullValue).toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter('d22540b5-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                expect.soft(uniformListPage.chk_withOwnerFilter).toBeChecked(),
                expect.soft(uniformListPage.chk_withoutOwnerFilter).toBeChecked(),
                expect.soft(uniformListPage.chk_passiveFilter).not.toBeChecked(),
                expect.soft(uniformListPage.chk_activeFilter).toBeChecked(),
            ]);
        });
        await test.step('goback', async () => {
            await uniformListPage.sel_type.selectOption('036ff236-3b83-11ee-ab4b-0068eb8ba754');
            await Promise.all([
                expect.soft(uniformListPage.chk_genFilter('acc01de5-3b83-11ee-ab4b-0068eb8ba754')).not.toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter('b1f5af66-3b83-11ee-ab4b-0068eb8ba754')).not.toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter('b839a899-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter_nullValue).not.toBeChecked(),
                expect.soft(uniformListPage.chk_genFilter_selAll).not.toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter('585509de-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter('3656714b-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter('37665288-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter_nullValue).toBeChecked(),
                expect.soft(uniformListPage.chk_sizeFilter_selAll).toBeChecked(),
            ]);
        });
    });
    test('validate search input and helpText', async () => {
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
    test('validate typeChange via search', async () => {
        await uniformListPage.txt_search_input.fill('AB 10');
        await uniformListPage.btn_search_submit.click();

        await Promise.all([
            expect(page).toHaveURL(/uniform\/list\/0b95e809-3b83-11ee-ab4b-0068eb8ba754/),
            expect(uniformListPage.div_pageHeader).toContainText('Typ2'),
            expect(uniformListPage.div_sizeAccordion).not.toBeVisible(),
            expect.soft(uniformListPage.chk_genFilter_nullValue).toBeChecked(),
            expect.soft(uniformListPage.chk_genFilter('d22540b5-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
            expect.soft(uniformListPage.chk_withOwnerFilter).toBeChecked(),
            expect.soft(uniformListPage.chk_withoutOwnerFilter).toBeChecked(),
            expect.soft(uniformListPage.chk_passiveFilter).not.toBeChecked(),
            expect.soft(uniformListPage.chk_activeFilter).toBeChecked(),
        ]);
    });
    test('validate search filter', async () => {
        await test.step('via button', async () => {
            await uniformListPage.txt_search_input.fill('110');
            await uniformListPage.btn_search_submit.click();
            await expect(uniformListPage.div_uitem('45f31821-3c0d-11ee-8084-0068eb8ba754')).not.toBeVisible();
            expect(await uniformListPage.div_uitem_list.count()).toBe(6);
            await expect(page.getByTestId('div_hilight').nth(0)).toHaveText('110');
        });
        await test.step('via enter', async () => {
            await uniformListPage.txt_search_input.fill('12');
            await uniformListPage.txt_search_input.press('Enter');
            await expect(uniformListPage.div_uitem('45f31821-3c0d-11ee-8084-0068eb8ba754')).toBeVisible();
            expect(await uniformListPage.div_uitem_list.count()).toBe(8);
            await expect(page.getByTestId('div_hilight').nth(0)).toHaveText('12');
        });
    });
    test('validate filter options', async () => {
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
            await expect(await page.locator('input[name^="generations."]').count()).toBe(5);
            await expect(await page.locator('input[name^="sizes."]').count()).toBe(16);
        });

        await test.step('gen & size for typ2', async () => {
            await uniformListPage.sel_type.selectOption('0b95e809-3b83-11ee-ab4b-0068eb8ba754');
            await expect(uniformListPage.div_genAccordion).toBeVisible();
            await expect(uniformListPage.div_sizeAccordion).not.toBeVisible();
            await expect(await page.locator('input[name^="generations."]').count()).toBe(3);
        });

        await test.step('gen & size for typ3', async () => {
            await uniformListPage.sel_type.selectOption('0c35d0c1-3b83-11ee-ab4b-0068eb8ba754');
            await expect(uniformListPage.div_genAccordion).not.toBeVisible();
            await expect(uniformListPage.div_sizeAccordion).toBeVisible();
            await expect(await page.locator('input[name^="sizes."]').count()).toBe(12);
        });

        await test.step('gen & size for typ4', async () => {
            await uniformListPage.sel_type.selectOption('0cb53b49-3b83-11ee-ab4b-0068eb8ba754');
            await expect(uniformListPage.div_genAccordion).not.toBeVisible();
            await expect(uniformListPage.div_sizeAccordion).not.toBeVisible();
        });
    });
    test('validate selectAll', async () => {
        await test.step('generation', async () => {
            await uniformListPage.btn_genAccordion_header.click();
            await Promise.all([
                expect(uniformListPage.chk_genFilter_selAll).toBeChecked(),
                expect(uniformListPage.chk_genFilter_nullValue).toBeChecked(),
                expect(uniformListPage.chk_genFilter('acc01de5-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                expect(uniformListPage.chk_genFilter('b839a899-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
            ]);

            await test.step('validate indirect via gen', async () => {
                await uniformListPage.chk_genFilter('acc01de5-3b83-11ee-ab4b-0068eb8ba754').setChecked(false);
                await expect(uniformListPage.chk_genFilter_selAll).not.toBeChecked();
                await uniformListPage.chk_genFilter('acc01de5-3b83-11ee-ab4b-0068eb8ba754').setChecked(true);
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
                    expect(uniformListPage.chk_genFilter('acc01de5-3b83-11ee-ab4b-0068eb8ba754')).not.toBeChecked(),
                    expect(uniformListPage.chk_genFilter('b839a899-3b83-11ee-ab4b-0068eb8ba754')).not.toBeChecked(),
                ]);

                await uniformListPage.chk_genFilter_selAll.setChecked(true);
                await Promise.all([
                    expect(uniformListPage.chk_genFilter_nullValue).toBeChecked(),
                    expect(uniformListPage.chk_genFilter('acc01de5-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                    expect(uniformListPage.chk_genFilter('b839a899-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                ]);
            })
        });
        await test.step('size', async () => {
            await uniformListPage.btn_sizeAccordion_header.click();
            await Promise.all([
                expect(uniformListPage.chk_genFilter_selAll).toBeChecked(),
                expect(uniformListPage.chk_genFilter_nullValue).toBeChecked(),
                expect(uniformListPage.chk_sizeFilter('585509de-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                expect(uniformListPage.chk_sizeFilter('37665288-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
            ]);
            await test.step('validate indirect via size', async () => {
                await uniformListPage.chk_sizeFilter('585509de-3b83-11ee-ab4b-0068eb8ba754').setChecked(false);
                await expect(uniformListPage.chk_sizeFilter_selAll).not.toBeChecked();
                await uniformListPage.chk_sizeFilter('585509de-3b83-11ee-ab4b-0068eb8ba754').setChecked(true);
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
                    expect(uniformListPage.chk_sizeFilter('585509de-3b83-11ee-ab4b-0068eb8ba754')).not.toBeChecked(),
                    expect(uniformListPage.chk_sizeFilter('37665288-3b83-11ee-ab4b-0068eb8ba754')).not.toBeChecked(),
                ]);

                await uniformListPage.chk_sizeFilter_selAll.setChecked(true);
                await Promise.all([
                    expect(uniformListPage.chk_sizeFilter_nullValue).toBeChecked(),
                    expect(uniformListPage.chk_sizeFilter('585509de-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                    expect(uniformListPage.chk_sizeFilter('37665288-3b83-11ee-ab4b-0068eb8ba754')).toBeChecked(),
                ]);
            });
        });
    });
});
