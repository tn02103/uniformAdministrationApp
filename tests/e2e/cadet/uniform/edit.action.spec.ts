import { Page, expect, test } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { CadetUniformComponent, UniformItemRowComponent } from "../../../pages/cadet/cadetUniform.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { testGenerations, testUniformItems } from "../../../testData/staticData";

test.use({ storageState: adminAuthFile });
test.describe('', () => {
    /**
     * The tests check the implementation of the UniformForm Compenten in the CadetUniformTable
     * The tests only check a small part of the functionality within the component
     */
    const testData = {
        cadetId: '0d06427b-3c12-11ee-8084-0068eb8ba754', // Marie Ackerman
        uniformId: '45f35815-3c0d-11ee-8084-0068eb8ba754', // Typ1
    }
    const uniform = testUniformItems.find(u => u.id === testData.uniformId);
    if (!uniform) throw Error('uniform not found');

    let page: Page;
    let unirowComponent: CadetUniformComponent;
    let rowComponent: UniformItemRowComponent;

    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();
        unirowComponent = new CadetUniformComponent(page);
        rowComponent = new UniformItemRowComponent(page, uniform.id);
    });
    test.afterAll(async () => page.close());

    test.beforeEach(async () => {
        await cleanupData();
        if (page.url().endsWith(testData.cadetId)) {
            await page.reload();
        } else {
            await page.goto(`/de/app/cadet/${testData.cadetId}`);
        }
    });

    // E2E0241
    test('validate formData', async () => {
        await test.step('open form', async () => {
            await expect(rowComponent.div_uitem).toBeVisible();
            await rowComponent.btn_edit.click();
            await expect(rowComponent.txt_comment).toBeVisible();
        });

        await test.step('validate selected Data', async () => {
            await Promise.all([
                expect.soft(rowComponent.sel_generation).toHaveValue(uniform.fk_generation as string),
                expect.soft(rowComponent.sel_size).toHaveValue(uniform.fk_size as string),
                expect.soft(rowComponent.txt_comment).toBeVisible(),
                expect.soft(rowComponent.txt_comment).toHaveValue(uniform.comment as string),
            ]);
        });
    });

    // E2E0242
    test('validate CancelFunction', async () => {
        await test.step('open form', async () => {
            await rowComponent.btn_edit.click();
            await expect(rowComponent.txt_comment).toBeVisible();
        });

        await test.step('select different Generation and cancel', async () => {
            await rowComponent.sel_generation.selectOption('acc01de5-3b83-11ee-ab4b-0068eb8ba754');
            await rowComponent.btn_cancel.click();
        });

        await test.step('validate data not changed', async () => {
            await expect.soft(rowComponent.txt_comment).not.toBeVisible();
            await expect.soft(rowComponent.div_generation).toHaveText('Generation1-4');
        });

        await test.step('reopen form and validate form is reset', async () => {
            await rowComponent.btn_edit.click();
            await expect(rowComponent.txt_comment).toBeVisible();
            await expect.soft(rowComponent.sel_generation).toHaveValue(uniform.fk_generation as string);
        });
    });

    // E2E0243
    test('validate SaveFunction', async () => {
        await test.step('without null values', async () => {
            await test.step('open form', async () => {
                await rowComponent.btn_edit.click();
                await expect(rowComponent.txt_comment).toBeVisible();
            });

            await test.step('change data and save', async () => {
                await rowComponent.sel_generation.selectOption('acc01de5-3b83-11ee-ab4b-0068eb8ba754');
                await rowComponent.sel_size.selectOption('37665288-3b83-11ee-ab4b-0068eb8ba754');
                await rowComponent.btn_save.click();
            });
            await test.step('validate data changed', async () => {
                await expect.soft(rowComponent.txt_comment).not.toBeVisible();
                await expect.soft(rowComponent.div_generation).toHaveText('Generation1-1');
                await expect.soft(rowComponent.div_size).toHaveText('2');
            });
        });
        await test.step('with null values', async () => {
            await test.step('open form', async () => {
                await rowComponent.btn_edit.click();
                await expect(rowComponent.txt_comment).toBeVisible();
            });

            await test.step('change data and save', async () => {
                await rowComponent.sel_generation.selectOption('');
                await rowComponent.sel_size.selectOption('');
                await rowComponent.btn_save.click();
            });
            await test.step('validate data changed', async () => {
                await expect.soft(rowComponent.txt_comment).not.toBeVisible();
                await expect.soft(rowComponent.div_generation).toHaveText('K.A.');
                await expect.soft(rowComponent.div_size).toHaveText('K.A.')
            });
        });
    });

    // E2E0244
    test('validate selOptions', async () => {
        await test.step('open form', async () => {
            await rowComponent.btn_edit.click();
            await expect(rowComponent.txt_comment).toBeVisible();
        });

        await test.step('validate generation', async () => {
            const generations = testGenerations
                .filter(g =>
                    (g.fk_uniformType === '036ff236-3b83-11ee-ab4b-0068eb8ba754')
                    && (g.recdelete === null)
                ).sort((a, b) => a.sortOrder - b.sortOrder);

            const options = await rowComponent.sel_generation.locator('option', { hasNotText: 'K.A.' }).all();

            expect(options.length).toBe(generations.length);
            await Promise.all(
                options.map(async (option, index) => {
                    await expect(option).toHaveAttribute("value", generations[index].id);
                    await expect(option).toHaveText(generations[index].name);
                    if (generations[index].outdated) {
                        await expect.soft(option).toHaveClass(/text-warning/);
                    }
                })
            );
        });

        await test.step('validate initialSizeList', async () => {
            const options = await rowComponent.sel_size.locator('option', { hasNotText: 'K.A.' }).all();
            expect(options.length).toBe(5);
            expect(options[0]).toHaveAttribute("value", "65942979-3b83-11ee-ab4b-0068eb8ba754");
            expect(options[0]).toHaveText('Größe16');
            expect(options[2]).toHaveAttribute("value", "6c8c017f-3b83-11ee-ab4b-0068eb8ba754");
            expect(options[2]).toHaveText('Größe18');
            expect(options[4]).toHaveAttribute("value", "74c1b7da-3b83-11ee-ab4b-0068eb8ba754");
            expect(options[4]).toHaveText('Größe20');
        });
        await test.step('validate changed generation size list', async () => {
            await rowComponent.sel_generation.selectOption('b839a899-3b83-11ee-ab4b-0068eb8ba754');
            const options = await rowComponent.sel_size.locator('option', { hasNotText: 'K.A.' }).all();

            expect(options.length).toBe(11);
            expect(options[0]).toHaveAttribute("value", "585509de-3b83-11ee-ab4b-0068eb8ba754");
            expect(options[0]).toHaveText('0');
            expect(options[5]).toHaveAttribute("value", "3b93f87a-3b83-11ee-ab4b-0068eb8ba754");
            expect(options[5]).toHaveText('5');
            expect(options[10]).toHaveAttribute("value", "47c68566-3b83-11ee-ab4b-0068eb8ba754");
            expect(options[10]).toHaveText('10');
        });
        await test.step('validate generation null size list', async () => {
            await rowComponent.sel_generation.selectOption('');
            const options = await rowComponent.sel_size.locator('option', { hasNotText: 'K.A.' }).all();

            expect(options.length).toBe(6);
            expect(options[0]).toHaveAttribute("value", "585509de-3b83-11ee-ab4b-0068eb8ba754");
            expect(options[0]).toHaveText('0');
            expect(options[5]).toHaveAttribute("value", "3b93f87a-3b83-11ee-ab4b-0068eb8ba754");
            expect(options[5]).toHaveText('5');
        });
    });
});
