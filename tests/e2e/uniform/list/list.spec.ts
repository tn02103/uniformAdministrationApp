import { Page, expect } from "playwright/test";
import { adminAuthFile, adminTest, inspectorAuthFile, inspectorTest, userAuthFile, userTest } from "../../../auth.setup";
import { viewports } from "../../../global/helper";
import { UniformListPage } from "../../../pages/uniform/uniformList.page";
import { cleanupData } from "../../../testData/cleanupStatic";

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
    });

    test('E2E0308: validate sortorder', async ({ page, uniformListPage, staticData: { ids } }) => {
        const idArray = [
            ids.uniformIds[0][1], ids.uniformIds[0][3], ids.uniformIds[0][10],
            ids.uniformIds[0][25], ids.uniformIds[0][27], ids.uniformIds[0][53],
            ids.uniformIds[0][84],
        ];
        await test.step('normal sortorder', async () => await Promise.all(
            [1, 3, 5, 17, 19, 40, 71].map(async (value, index) =>
                expect.soft(uniformListPage.div_uitem_list.nth(value)).toHaveAttribute('data-testid', `div_uitem_${idArray[index]}`)
            )
        ))

        await test.step('asc=false', async () => {
            await page.goto(`/app/uniform/list/${ids.uniformTypeIds[0]}?asc=false`);
            await Promise.all(
                [72, 70, 68, 56, 54, 33, 2].map(async (value, index) =>
                    expect.soft(uniformListPage.div_uitem_list.nth(value)).toHaveAttribute('data-testid', `div_uitem_${idArray[index]}`)
                )
            );
        });

        await test.step('generation', async () => {
            await page.goto(`/app/uniform/list/${ids.uniformTypeIds[0]}?orderBy=generation`);
            await Promise.all(
                [3, 5, 7, 20, 22, 71, 65].map(async (value, index) =>
                    expect.soft(uniformListPage.div_uitem_list.nth(value)).toHaveAttribute('data-testid', `div_uitem_${idArray[index]}`)
                )
            );
        });

        await test.step('size', async () => {
            await page.goto(`/app/uniform/list/${ids.uniformTypeIds[0]}?orderBy=size`);
            await Promise.all(
                [9, 11, 23, 17, 25, 71, 65].map(async (value, index) =>
                    expect.soft(uniformListPage.div_uitem_list.nth(value)).toHaveAttribute('data-testid', `div_uitem_${idArray[index]}`)
                )
            );
        });

        await test.step('owner', async () => {
            await page.goto(`/app/uniform/list/${ids.uniformTypeIds[0]}?orderBy=owner`);
            await Promise.all(
                [7, 24, 26, 38, 40, 55, 0].map(async (value, index) =>
                    expect.soft(uniformListPage.div_uitem_list.nth(value)).toHaveAttribute('data-testid', `div_uitem_${idArray[index]}`)
                )
            );
        });

        await test.step('comment', async () => {
            await page.goto(`/app/uniform/list/${ids.uniformTypeIds[0]}?orderBy=comment`);
            await Promise.all(
                [71, 2, 4, 16, 73, 38, 72].map(async (value, index) =>
                    expect.soft(uniformListPage.div_uitem_list.nth(value)).toHaveAttribute('data-testid', `div_uitem_${idArray[index]}`)
                )
            );
        });
    });


    test('E2E0309: validate headerButtons', async ({ page, uniformListPage, staticData: { ids } }) => {
        await uniformListPage.div_header_number.click();
        await expect(page).toHaveURL(`/de/app/uniform/list/${ids.uniformTypeIds[0]}?asc=false`);

        await uniformListPage.div_header_number.click();
        await expect(page).toHaveURL(`/de/app/uniform/list/${ids.uniformTypeIds[0]}?asc=true`);

        await uniformListPage.div_header_generation.click();
        await expect(page).toHaveURL(`/de/app/uniform/list/${ids.uniformTypeIds[0]}?asc=true&orderBy=generation`);

        await uniformListPage.div_header_generation.click();
        await expect(page).toHaveURL(`/de/app/uniform/list/${ids.uniformTypeIds[0]}?asc=false&orderBy=generation`);

        await uniformListPage.div_header_size.click();
        await expect(page).toHaveURL(`/de/app/uniform/list/${ids.uniformTypeIds[0]}?asc=true&orderBy=size`);

        await uniformListPage.div_header_owner.click();
        await expect(page).toHaveURL(`/de/app/uniform/list/${ids.uniformTypeIds[0]}?asc=true&orderBy=owner`);

        await uniformListPage.div_header_comment.click();
        await expect(page).toHaveURL(`/de/app/uniform/list/${ids.uniformTypeIds[0]}?asc=true&orderBy=comment`);
    });

    test('E2E0310: validate filter', async ({ uniformListPage, staticData: { ids } }) => {
        await test.step('initial count', async () => {
            await expect(uniformListPage.div_header_count).toContainText('74');
            await expect(await uniformListPage.div_uitem_list.count()).toBe(74);
        });

        await test.step('generation filter', async () => {
            await uniformListPage.btn_genAccordion_header.click();
            await uniformListPage.chk_genFilter_selAll.setChecked(false);
            await uniformListPage.chk_genFilter(ids.uniformGenerationIds[0]).setChecked(true);
            await uniformListPage.btn_load.click();

            await expect(uniformListPage.div_header_count).toContainText('16');
            await expect(uniformListPage.div_uitem_list).toHaveCount(16);
        });

        await test.step('size filter', async () => {
            await uniformListPage.btn_sizeAccordion_header.click();
            await uniformListPage.chk_sizeFilter_selAll.setChecked(false);
            await uniformListPage.chk_sizeFilter(ids.sizeIds[1]).setChecked(true);
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

    test('E2E0311: validate uItem data', async ({ page, uniformListPage, staticData: { ids } }) => {
        //   await page.waitForTimeout(100);
        await uniformListPage.btn_othersAccordion_header.click();
        await uniformListPage.chk_passiveFilter.setChecked(true);
        await uniformListPage.btn_load.click();

        await Promise.all([
            expect.soft(uniformListPage.div_uitem_number(ids.uniformIds[0][27])).toContainText('1127'),
            expect.soft(uniformListPage.div_uitem_generation(ids.uniformIds[0][27])).toContainText('Generation1-2'),
            expect.soft(uniformListPage.div_uitem_size(ids.uniformIds[0][27])).toContainText('3'),
            expect.soft(uniformListPage.lnk_uitem_owner(ids.uniformIds[0][27])).not.toBeVisible(),
            expect.soft(uniformListPage.div_uitem_comment(ids.uniformIds[0][27])).toContainText('Comment 2'),
            expect.soft(uniformListPage.div_uitem_passivLabel(ids.uniformIds[0][27])).not.toBeVisible(),
            expect.soft(uniformListPage.div_uitem_number(ids.uniformIds[0][23])).toContainText('1123'),
            expect.soft(uniformListPage.div_uitem_generation(ids.uniformIds[0][23])).toContainText('Generation1-2'),
            expect.soft(uniformListPage.div_uitem_size(ids.uniformIds[0][23])).toContainText('1'),
            expect.soft(uniformListPage.lnk_uitem_owner(ids.uniformIds[0][23])).toContainText('Luft Uwe'),
            expect.soft(uniformListPage.div_uitem_comment(ids.uniformIds[0][23])).toContainText(''),
            expect.soft(uniformListPage.div_uitem_passivLabel(ids.uniformIds[0][23])).toBeVisible(),
        ]);

        await uniformListPage.lnk_uitem_owner(ids.uniformIds[0][23]).click();
        await expect(page).toHaveURL(`/de/app/cadet/${ids.cadetIds[4]}`);
        await page.goBack();
    });   
});

inspectorTest('E2E0313: validate DisplaySizes inspector', async ({ page, staticData: { ids } }) => {
    const uniformListPage = new UniformListPage(page);
    const testId = ids.uniformIds[0][0];
    await page.goto(`/de/app/uniform/list/${ids.uniformTypeIds[0]}`);
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

userTest('E2E0314: validate DisplaySizes user', async ({ page, staticData: {ids}}) => {
    const uniformListPage = new UniformListPage(page);
    const testId = ids.uniformIds[0][0];
    await page.goto(`/de/app/uniform/list/${ids.uniformTypeIds[0]}`);
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
