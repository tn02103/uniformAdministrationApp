import { Page, expect, test } from "playwright/test";
import { adminAuthFile, inspectorAuthFile, userAuthFile } from "../../../auth.setup";
import { viewports } from "../../../global/helper";
import { UniformListPage } from "../../../pages/uniform/uniformList.page";
import { cleanupData } from "../../../testData/cleanupStatic";

test.use({ storageState: adminAuthFile });
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
        await page.reload();
        await expect(uniformListPage.div_nodata).not.toBeVisible();
    });

    test('E2E0308: validate sortorder', async () => {
        const idArray = [
            '45f3053a-3c0d-11ee-8084-0068eb8ba754', //1101
            '45f309c6-3c0d-11ee-8084-0068eb8ba754', //1103
            '45f3167a-3c0d-11ee-8084-0068eb8ba754', //1110
            '45f324d4-3c0d-11ee-8084-0068eb8ba754', //1125
            '45f325df-3c0d-11ee-8084-0068eb8ba754', //1127
            '45f3362f-3c0d-11ee-8084-0068eb8ba754', //1153
            '45f35815-3c0d-11ee-8084-0068eb8ba754', //1184
        ];
        await test.step('normal sortorder', async () => await Promise.all(
            [1, 3, 5, 17, 19, 40, 71].map(async (value, index) =>
                expect.soft(uniformListPage.div_uitem_list.nth(value)).toHaveAttribute('data-testid', `div_uitem_${idArray[index]}`)
            )
        ))

        await test.step('asc=false', async () => {
            await page.goto('/app/uniform/list/036ff236-3b83-11ee-ab4b-0068eb8ba754?asc=false');
            await Promise.all(
                [72, 70, 68, 56, 54, 33, 2].map(async (value, index) =>
                    expect.soft(uniformListPage.div_uitem_list.nth(value)).toHaveAttribute('data-testid', `div_uitem_${idArray[index]}`)
                )
            );
        });

        await test.step('generation', async () => {
            await page.goto('/app/uniform/list/036ff236-3b83-11ee-ab4b-0068eb8ba754?orderBy=generation');
            await Promise.all(
                [3, 5, 7, 20, 22, 71, 65].map(async (value, index) =>
                    expect.soft(uniformListPage.div_uitem_list.nth(value)).toHaveAttribute('data-testid', `div_uitem_${idArray[index]}`)
                )
            );
        });

        await test.step('size', async () => {
            await page.goto('/app/uniform/list/036ff236-3b83-11ee-ab4b-0068eb8ba754?orderBy=size');
            await Promise.all(
                [9, 11, 23, 17, 25, 71, 65].map(async (value, index) =>
                    expect.soft(uniformListPage.div_uitem_list.nth(value)).toHaveAttribute('data-testid', `div_uitem_${idArray[index]}`)
                )
            );
        });

        await test.step('owner', async () => {
            await page.goto('/app/uniform/list/036ff236-3b83-11ee-ab4b-0068eb8ba754?orderBy=owner');
            await Promise.all(
                [7, 24, 26, 38, 40, 55, 0].map(async (value, index) =>
                    expect.soft(uniformListPage.div_uitem_list.nth(value)).toHaveAttribute('data-testid', `div_uitem_${idArray[index]}`)
                )
            );
        });

        await test.step('comment', async () => {
            await page.goto('/app/uniform/list/036ff236-3b83-11ee-ab4b-0068eb8ba754?orderBy=comment');
            await Promise.all(
                [71, 2, 4, 16, 73, 38, 72].map(async (value, index) =>
                    expect.soft(uniformListPage.div_uitem_list.nth(value)).toHaveAttribute('data-testid', `div_uitem_${idArray[index]}`)
                )
            );
        });
    });

    test('E2E0309: validate headerButtons', async () => {
        await uniformListPage.div_header_number.click();
        await expect(page).toHaveURL('/de/app/uniform/list/036ff236-3b83-11ee-ab4b-0068eb8ba754?asc=false');

        await uniformListPage.div_header_number.click();
        await expect(page).toHaveURL('/de/app/uniform/list/036ff236-3b83-11ee-ab4b-0068eb8ba754?asc=true');

        await uniformListPage.div_header_generation.click();
        await expect(page).toHaveURL('/de/app/uniform/list/036ff236-3b83-11ee-ab4b-0068eb8ba754?asc=true&orderBy=generation');

        await uniformListPage.div_header_generation.click();
        await expect(page).toHaveURL('/de/app/uniform/list/036ff236-3b83-11ee-ab4b-0068eb8ba754?asc=false&orderBy=generation');

        await uniformListPage.div_header_size.click();
        await expect(page).toHaveURL('/de/app/uniform/list/036ff236-3b83-11ee-ab4b-0068eb8ba754?asc=true&orderBy=size');

        await uniformListPage.div_header_owner.click();
        await expect(page).toHaveURL('/de/app/uniform/list/036ff236-3b83-11ee-ab4b-0068eb8ba754?asc=true&orderBy=owner');

        await uniformListPage.div_header_comment.click();
        await expect(page).toHaveURL('/de/app/uniform/list/036ff236-3b83-11ee-ab4b-0068eb8ba754?asc=true&orderBy=comment');
    });
    test('E2E0310: validate filter', async () => {
        await test.step('initial count', async () => {
            await expect(uniformListPage.div_header_count).toContainText('74');
            await expect(await uniformListPage.div_uitem_list.count()).toBe(74);
        });

        await test.step('generation filter', async () => {
            await uniformListPage.btn_genAccordion_header.click();
            await uniformListPage.chk_genFilter_selAll.setChecked(false);
            await uniformListPage.chk_genFilter('acc01de5-3b83-11ee-ab4b-0068eb8ba754').setChecked(true);
            await uniformListPage.btn_load.click();

            await expect(uniformListPage.div_header_count).toContainText('16');
            await expect(uniformListPage.div_uitem_list).toHaveCount(16);
        });

        await test.step('size filter', async () => {
            await uniformListPage.btn_sizeAccordion_header.click();
            await uniformListPage.chk_sizeFilter_selAll.setChecked(false);
            await uniformListPage.chk_sizeFilter('3656714b-3b83-11ee-ab4b-0068eb8ba754').setChecked(true);
            await uniformListPage.btn_load.click();

            await expect(uniformListPage.div_header_count).toContainText('4');
            await expect(uniformListPage.div_uitem_list).toHaveCount(4);
        });

        await test.step('search filter', async () => {
            await uniformListPage.txt_search_input.fill('1101');
            await uniformListPage.btn_search_submit.click();

            await expect(uniformListPage.div_header_count).toContainText('1');// BUG: should be 1
            await expect(uniformListPage.div_uitem_list).toHaveCount(1);
        });
    });
    test('E2E0311: validate uItem data', async () => {
        await page.waitForTimeout(100);
        await uniformListPage.btn_othersAccordion_header.click();
        await uniformListPage.chk_passiveFilter.setChecked(true);
        await uniformListPage.btn_load.click();

        await Promise.all([
            expect.soft(uniformListPage.div_uitem_number('45f325df-3c0d-11ee-8084-0068eb8ba754')).toContainText('1127'),
            expect.soft(uniformListPage.div_uitem_generation('45f325df-3c0d-11ee-8084-0068eb8ba754')).toContainText('Generation1-2'),
            expect.soft(uniformListPage.div_uitem_size('45f325df-3c0d-11ee-8084-0068eb8ba754')).toContainText('3'),
            expect.soft(uniformListPage.lnk_uitem_owner('45f325df-3c0d-11ee-8084-0068eb8ba754')).not.toBeVisible(),
            expect.soft(uniformListPage.div_uitem_comment('45f325df-3c0d-11ee-8084-0068eb8ba754')).toContainText('Comment 2'),
            expect.soft(uniformListPage.div_uitem_passivLabel('45f325df-3c0d-11ee-8084-0068eb8ba754')).not.toBeVisible(),
            expect.soft(uniformListPage.div_uitem_number('45f323b0-3c0d-11ee-8084-0068eb8ba754')).toContainText('1123'),
            expect.soft(uniformListPage.div_uitem_generation('45f323b0-3c0d-11ee-8084-0068eb8ba754')).toContainText('Generation1-2'),
            expect.soft(uniformListPage.div_uitem_size('45f323b0-3c0d-11ee-8084-0068eb8ba754')).toContainText('1'),
            expect.soft(uniformListPage.lnk_uitem_owner('45f323b0-3c0d-11ee-8084-0068eb8ba754')).toContainText('Luft Uwe'),
            expect.soft(uniformListPage.div_uitem_comment('45f323b0-3c0d-11ee-8084-0068eb8ba754')).toContainText(''),
            expect.soft(uniformListPage.div_uitem_passivLabel('45f323b0-3c0d-11ee-8084-0068eb8ba754')).toBeVisible(),
        ]);

        await uniformListPage.lnk_uitem_owner('45f323b0-3c0d-11ee-8084-0068eb8ba754').click();
        await expect(page).toHaveURL('/de/app/cadet/d468ac3c-3c11-11ee-8084-0068eb8ba754');
        await page.goBack();
    });
    test.describe('', async () => {
        test.use({ storageState: inspectorAuthFile });
        test('E2E0313: validate DisplaySizes inspector', async ({ page }) => {
            const uniformListPage = new UniformListPage(page);
            const testId = `45f2fdcc-3c0d-11ee-8084-0068eb8ba754`;
            await page.goto('/de/app/uniform/list/036ff236-3b83-11ee-ab4b-0068eb8ba754');
            await expect(uniformListPage.div_nodata).not.toBeVisible();

            await test.step('xs', async () => {
                await page.setViewportSize(viewports.xs);
                await Promise.all([
                    expect.soft(uniformListPage.div_uitem_number(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_generation(testId)).not.toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_size(testId)).not.toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_comment(testId)).not.toBeVisible(),
                    expect.soft(uniformListPage.lnk_uitem_owner(testId)).toBeVisible(),
                    expect.soft(uniformListPage.btn_uitem_open(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_header_number).toBeVisible(),
                    expect.soft(uniformListPage.div_header_generation).not.toBeVisible(),
                    expect.soft(uniformListPage.div_header_size).not.toBeVisible(),
                    expect.soft(uniformListPage.div_header_comment).not.toBeVisible(),
                    expect.soft(uniformListPage.div_header_owner).toBeVisible(),
                    expect.soft(uniformListPage.div_header_count).toBeVisible(),
                ]);
            });
            await test.step('sm', async () => {
                await page.setViewportSize(viewports.sm);
                await Promise.all([
                    expect.soft(uniformListPage.div_uitem_number(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_generation(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_size(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_comment(testId)).not.toBeVisible(),
                    expect.soft(uniformListPage.lnk_uitem_owner(testId)).toBeVisible(),
                    expect.soft(uniformListPage.btn_uitem_open(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_header_number).toBeVisible(),
                    expect.soft(uniformListPage.div_header_generation).toBeVisible(),
                    expect.soft(uniformListPage.div_header_size).toBeVisible(),
                    expect.soft(uniformListPage.div_header_comment).not.toBeVisible(),
                    expect.soft(uniformListPage.div_header_owner).toBeVisible(),
                    expect.soft(uniformListPage.div_header_count).toBeVisible(),
                ]);
            });
            await test.step('md', async () => {
                await page.setViewportSize(viewports.md);
                await Promise.all([
                    expect.soft(uniformListPage.div_uitem_number(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_generation(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_size(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_comment(testId)).toBeVisible(),
                    expect.soft(uniformListPage.lnk_uitem_owner(testId)).toBeVisible(),
                    expect.soft(uniformListPage.btn_uitem_open(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_header_number).toBeVisible(),
                    expect.soft(uniformListPage.div_header_generation).toBeVisible(),
                    expect.soft(uniformListPage.div_header_size).toBeVisible(),
                    expect.soft(uniformListPage.div_header_comment).toBeVisible(),
                    expect.soft(uniformListPage.div_header_owner).toBeVisible(),
                    expect.soft(uniformListPage.div_header_count).toBeVisible(),
                ]);
            });
        });
    });
    test.describe('', async () => {
        test.use({ storageState: userAuthFile });

        test('E2E0314: validate DisplaySizes user', async ({ page }) => {
            const uniformListPage = new UniformListPage(page);
            const testId = `45f2fdcc-3c0d-11ee-8084-0068eb8ba754`;
            await page.goto('/de/app/uniform/list/036ff236-3b83-11ee-ab4b-0068eb8ba754');
            await expect(uniformListPage.div_nodata).not.toBeVisible();

            await test.step('xs', async () => {
                await page.setViewportSize(viewports.xs);
                await Promise.all([
                    expect.soft(uniformListPage.div_uitem_number(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_generation(testId)).not.toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_size(testId)).not.toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_comment(testId)).not.toBeVisible(),
                    expect.soft(uniformListPage.lnk_uitem_owner(testId)).toBeVisible(),
                    expect.soft(uniformListPage.btn_uitem_open(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_header_number).toBeVisible(),
                    expect.soft(uniformListPage.div_header_generation).not.toBeVisible(),
                    expect.soft(uniformListPage.div_header_size).not.toBeVisible(),
                    expect.soft(uniformListPage.div_header_comment).not.toBeVisible(),
                    expect.soft(uniformListPage.div_header_owner).toBeVisible(),
                    expect.soft(uniformListPage.div_header_count).toBeVisible(),
                ]);
            });
            await test.step('sm', async () => {
                await page.setViewportSize(viewports.sm);
                await Promise.all([
                    expect.soft(uniformListPage.div_uitem_number(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_generation(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_size(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_comment(testId)).not.toBeVisible(),
                    expect.soft(uniformListPage.lnk_uitem_owner(testId)).toBeVisible(),
                    expect.soft(uniformListPage.btn_uitem_open(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_header_number).toBeVisible(),
                    expect.soft(uniformListPage.div_header_generation).toBeVisible(),
                    expect.soft(uniformListPage.div_header_size).toBeVisible(),
                    expect.soft(uniformListPage.div_header_comment).not.toBeVisible(),
                    expect.soft(uniformListPage.div_header_owner).toBeVisible(),
                    expect.soft(uniformListPage.div_header_count).toBeVisible(),
                ]);
            });
            await test.step('md', async () => {
                await page.setViewportSize(viewports.md);
                await Promise.all([
                    expect.soft(uniformListPage.div_uitem_number(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_generation(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_size(testId)).toBeVisible(),
                    expect.soft(uniformListPage.div_uitem_comment(testId)).toBeVisible(),
                    expect.soft(uniformListPage.lnk_uitem_owner(testId)).toBeVisible(),
                    expect.soft(uniformListPage.btn_uitem_open(testId)).not.toBeVisible(),
                    expect.soft(uniformListPage.div_header_number).toBeVisible(),
                    expect.soft(uniformListPage.div_header_generation).toBeVisible(),
                    expect.soft(uniformListPage.div_header_size).toBeVisible(),
                    expect.soft(uniformListPage.div_header_comment).toBeVisible(),
                    expect.soft(uniformListPage.div_header_owner).toBeVisible(),
                    expect.soft(uniformListPage.div_header_count).toBeVisible(),
                ]);
            });
        });
    });

    /*
    test.skip('validate delete', async () => {
        await uniformListPage.btn_othersAccordion_header.click();
        await uniformListPage.chk_passiveFilter.setChecked(true);
        await uniformListPage.btn_load.click();
        
        await test.step('disabled with owner', async () => {
            await expect.soft(uniformListPage.btn_uitem_delete('45f323b0-3c0d-11ee-8084-0068eb8ba754')).toBeDisabled();
            await expect.soft(uniformListPage.btn_uitem_delete('45f2fdcc-3c0d-11ee-8084-0068eb8ba754')).toBeDisabled();
            await expect.soft(uniformListPage.btn_uitem_delete('45f309c6-3c0d-11ee-8084-0068eb8ba754')).toBeEnabled();
        });

        await test.step('open and validate popup', async () => {
            await uniformListPage.btn_uitem_delete('45f309c6-3c0d-11ee-8084-0068eb8ba754').click();
            await expect(messageModal.div_popup).toBeVisible();
            await expect.soft(messageModal.div_header).toContainText(/Typ1/);
            await expect.soft(messageModal.div_header).toContainText(/1103/);
            await expect.soft(messageModal.div_header).toHaveClass(/bg-danger/);
        });

        await test.step('delete and validate', async () => {
            await messageModal.btn_save.click();
            await expect(messageModal.div_popup).not.toBeVisible();
            await expect(uniformListPage.div_uitem('45f309c6-3c0d-11ee-8084-0068eb8ba754')).not.toBeVisible();

            const dbData = await prisma.uniform.findUnique({
                where: {
                    id: '45f309c6-3c0d-11ee-8084-0068eb8ba754'
                }
            });
            expect(dbData).toBeDefined();
            expect(dbData?.recdelete).not.toBeNull();
            expect(dbData?.recdeleteUser).toBe('test4');
        });
    });*/
}); 
