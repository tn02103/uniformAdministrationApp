import { prisma } from "@/lib/db";
import { Uniform } from "@prisma/client";
import { expect } from "playwright/test";
import { adminTest } from "../../../setup";
import { viewports } from "../../../global/helper";
import { CadetUniformComponent, UniformItemRowComponent } from "../../../pages/cadet/cadetUniform.component";

type Fixture = {
    uniform: Uniform;
    uniformComponent: CadetUniformComponent;
    rowComponent: UniformItemRowComponent;
};

const test = adminTest.extend<Fixture>({
    uniform: async ({ staticData }, use) => use(staticData.data.uniformList.find(u => u.number === 1184)!),
    uniformComponent: async ({ page }, use) => use(new CadetUniformComponent(page)),
    rowComponent: async ({ page, staticData }, use) => use(new UniformItemRowComponent(page, staticData.ids.uniformIds[0][84])),
});
test.afterEach(async ({ uniform }) => {
    await prisma.uniform.update({
        where: { id: uniform.id },
        data: uniform
    });
});

test.describe(() => {
    test.beforeEach(async ({ page, staticData: { ids } }) => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`);
    });

    test('validate formHandling', async ({ rowComponent, uniform, staticData: { ids } }) => {
        await test.step('validate inital formState', async () => {
            await test.step('before editclick', async () => {
                await expect(rowComponent.btn_save).not.toBeVisible();
                await expect(rowComponent.btn_cancel).not.toBeVisible();
                await expect(rowComponent.btn_edit).toBeVisible();
                await expect(rowComponent.btn_open).toBeVisible();
            });
            await rowComponent.btn_edit.click();

            await test.step('after editclick', async () => {
                await expect(rowComponent.btn_save).toBeVisible();
                await expect(rowComponent.btn_cancel).toBeVisible();
                await expect(rowComponent.btn_edit).not.toBeVisible();
                await expect(rowComponent.btn_open).not.toBeVisible();

                await Promise.all([
                    expect.soft(rowComponent.sel_generation).toHaveValue(uniform.fk_generation as string),
                    expect.soft(rowComponent.sel_size).toHaveValue(uniform.fk_size as string),
                    expect.soft(rowComponent.txt_comment).toHaveValue(uniform.comment as string),
                ]);
            });
        });
        await test.step('validate sel options', async () => {
            await test.step('sel_generation', async () => {
                const generations = await prisma.uniformGeneration.findMany({
                    where: { fk_uniformType: ids.uniformTypeIds[0], recdelete: null },
                    orderBy: { sortOrder: "asc" }
                });

                const options = await rowComponent.sel_generation.locator('option', { hasNotText: 'K.A.' }).all();

                expect(options).toHaveLength(generations.length);
                await Promise.all(
                    options.map(async (option, index) => {
                        await expect.soft(option).toHaveAttribute("value", generations[index].id);
                        await expect.soft(option).toHaveText(generations[index].name);
                        if (generations[index].outdated) {
                            await expect.soft(option).toHaveClass(/text-warning/);
                        }
                    })
                );
            });
            await test.step('validate initialSizelist', async () => {
                const options = rowComponent.sel_size.locator('option', { hasNotText: 'K.A.' });
                await Promise.all([
                    expect(options).toHaveCount(5),
                    expect(options.nth(0)).toHaveAttribute("value", ids.sizeIds[16]),
                    expect(options.nth(0)).toHaveText('Größe16'),
                    expect(options.nth(2)).toHaveAttribute("value", ids.sizeIds[18]),
                    expect(options.nth(2)).toHaveText('Größe18'),
                    expect(options.nth(4)).toHaveAttribute("value", ids.sizeIds[20]),
                    expect(options.nth(4)).toHaveText('Größe20'),
                ]);
            });
            await test.step('validate changed generation size list', async () => {
                await rowComponent.sel_generation.selectOption(ids.uniformGenerationIds[2]);
                const options = rowComponent.sel_size.locator('option', { hasNotText: 'K.A.' });

                await Promise.all([
                    expect(options).toHaveCount(11),
                    expect(options.nth(0)).toHaveAttribute("value", ids.sizeIds[0]),
                    expect(options.nth(0)).toHaveText('0'),
                    expect(options.nth(5)).toHaveAttribute("value", ids.sizeIds[5]),
                    expect(options.nth(5)).toHaveText('5'),
                    expect(options.nth(10)).toHaveAttribute("value", ids.sizeIds[10]),
                    expect(options.nth(10)).toHaveText('10'),
                ]);
            });
            await test.step('validate generation null size list', async () => {
                await rowComponent.sel_generation.selectOption('');
                const options = rowComponent.sel_size.locator('option', { hasNotText: 'K.A.' });

                await Promise.all([
                    expect(options).toHaveCount(6),
                    expect(options.nth(0)).toHaveAttribute("value", ids.sizeIds[0]),
                    expect(options.nth(0)).toHaveText('0'),
                    expect(options.nth(5)).toHaveAttribute("value", ids.sizeIds[5]),
                    expect(options.nth(5)).toHaveText('5'),
                ]);
            });
        })
    });

    test('validate CancelFunction', async ({ rowComponent, uniform, staticData: { ids } }) => {
        await test.step('open form', async () => {
            await rowComponent.btn_edit.click();
            await expect(rowComponent.txt_comment).toBeVisible();
        });
        await test.step('select different Generation and cancel', async () => {
            await rowComponent.sel_generation.selectOption(ids.uniformGenerationIds[0]);
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
    test('validate viewport change', async ({ page, rowComponent, uniform, staticData: { ids } }) => {
        await test.step('open form & change data', async () => {
            await expect(rowComponent.btn_edit).toBeVisible();
            await expect(rowComponent.btn_cancel).not.toBeVisible();
            await expect(rowComponent.btn_save).not.toBeVisible();

            await rowComponent.btn_edit.click();

            await expect(rowComponent.btn_edit).not.toBeVisible();
            await expect(rowComponent.btn_cancel).toBeVisible();
            await expect(rowComponent.btn_save).toBeVisible();
            await expect(rowComponent.txt_comment).toBeVisible();
        });
        await test.step('viewport md', async () => {
            await page.setViewportSize(viewports.md);
            await expect(rowComponent.btn_edit).not.toBeVisible();
            await expect(rowComponent.btn_cancel).not.toBeVisible();
            await expect(rowComponent.btn_save).not.toBeVisible();
        });
        await test.step('viewport lg', async () => {
            await page.setViewportSize(viewports.lg);
            await expect(rowComponent.btn_edit).toBeVisible();
            await expect(rowComponent.btn_cancel).not.toBeVisible();
            await expect(rowComponent.btn_save).not.toBeVisible();

            await rowComponent.btn_edit.click();
            await expect(rowComponent.btn_edit).not.toBeVisible();
            await expect(rowComponent.btn_cancel).toBeVisible();
            await expect(rowComponent.btn_save).toBeVisible();
        });
    });

    test('validate edit and save', async ({ rowComponent, staticData: { ids } }) => {
        await test.step('without null values', async () => {
            await test.step('change data and save', async () => {
                await rowComponent.btn_edit.click();
                await rowComponent.sel_generation.selectOption(ids.uniformGenerationIds[0]);
                await rowComponent.sel_size.selectOption(ids.sizeIds[2]);
                await rowComponent.txt_comment.fill('some new Comment');
                await rowComponent.btn_save.click();
                await expect.soft(rowComponent.txt_comment).not.toBeVisible();
            });
            await test.step('validate data changed', async () => {
                await expect.soft(rowComponent.div_generation).toHaveText('Generation1-1');
                await expect.soft(rowComponent.div_size).toHaveText('2');
                await expect.soft(rowComponent.div_comment).toHaveText('some new Comment')
            });
            await test.step('validate db', async () => {
                const uniform = await prisma.uniform.findUniqueOrThrow({ where: { id: ids.uniformIds[0][84] } });

                expect(uniform).toEqual(expect.objectContaining({
                    fk_generation: ids.uniformGenerationIds[0],
                    fk_size: ids.sizeIds[2],
                    active: true,
                    comment: 'some new Comment'
                }));
            });
        });
        await test.step('with null values', async () => {
            await test.step('change data and save', async () => {
                await rowComponent.btn_edit.click();
                await rowComponent.sel_generation.selectOption('');
                await rowComponent.sel_size.selectOption('');
                await rowComponent.txt_comment.fill('');
                await rowComponent.btn_save.click();
            });
            await test.step('validate data changed', async () => {
                await expect.soft(rowComponent.txt_comment).not.toBeVisible();
                await expect.soft(rowComponent.div_generation).toHaveText('K.A.');
                await expect.soft(rowComponent.div_size).toHaveText('K.A.');
                await expect.soft(rowComponent.div_comment).toHaveText('');
            });
            await test.step('validate db', async () => {
                const uniform = await prisma.uniform.findUniqueOrThrow({ where: { id: ids.uniformIds[0][84] } });

                expect(uniform).toEqual(expect.objectContaining({
                    fk_generation: null,
                    fk_size: null,
                    active: true,
                    comment: ''
                }));
            });
        });
    });
});
