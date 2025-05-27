import { prisma } from "@/lib/db";
import { UniformType } from "@prisma/client";
import { expect } from "playwright/test";
import german from "../../../../public/locales/de";
import { DangerConfirmationModal } from "../../../_playwrightConfig/pages/popups/DangerConfirmationPopup.component";
import { adminTest } from "../../../_playwrightConfig/setup";

const actionText = german.common.actions;

type Fixture = {
    types: UniformType[];
}

const test = adminTest.extend<Fixture>({
    types: async ({ staticData }, use) => {
        use(staticData.data.uniformTypes.filter(t => t.recdelete === null));
    },
});
test.beforeEach(async ({ page }) => {
    await page.goto('/de/app/admin/uniform');
})
test.afterEach(async ({ staticData: { cleanup } }) => {
    await cleanup.uniformTypeConfiguration();
});

test.describe('UniformGeneration Configuration', () => {

    test('change sort order up', async ({ page, types, staticData: { data }, browserName }) => {
        test.skip(browserName !== 'chromium', 'This test only runs on Chrome');

        const generationList = data.uniformGenerations.filter(g => g.recdelete === null && g.fk_uniformType === types[0].id);
        await test.step('open type offcanvas', async () => {
            await expect(page.getByRole('row', { name: types[0].name })).toBeVisible();

            await page.getByRole('row', { name: types[0].name }).getByRole('button', { name: 'open' }).click();

            await expect(page.getByRole('dialog').getByRole('heading', { name: types[0].name })).toBeVisible();
        });
        const dialog = page.getByRole('dialog');
        const generationTable = dialog.getByRole('table');

        await test.step('change generation SortOrder', async () => {
            const firstRow = generationTable.getByRole('row', { name: generationList[0].name });
            const thirdRow = generationTable.getByRole('row', { name: generationList[2].name });
            const firstRowMove = firstRow.locator('span[draggable="true"]');
            const thirdRowMove = thirdRow.locator('span[draggable="true"]');

            await expect(firstRow).toBeVisible();
            await expect(firstRowMove).toBeVisible();
            await expect(thirdRowMove).toBeVisible();

            await firstRowMove.dragTo(thirdRowMove, {
                targetPosition: { x: 10, y: 5 }, // Adjust the `y` value to drag further up
            });

            await expect(page.getByText(german.common.success.changeSortorder)).toBeVisible();
        });
        await test.step('check if sortorder is changed', async () => {
            const rows = await generationTable.locator('tbody').getByRole('row').all();

            expect(rows).toHaveLength(4);
            await expect(rows[0]).toHaveAttribute('aria-label', generationList[1].name);
            await expect(rows[1]).toHaveAttribute('aria-label', generationList[2].name);
            await expect(rows[2]).toHaveAttribute('aria-label', generationList[0].name);
            await expect(rows[3]).toHaveAttribute('aria-label', generationList[3].name);
        });
        await test.step('validate db sortorder', async () => {
            const dbGenerationList = await prisma.uniformGeneration.findMany({
                    where: {
                        recdelete: null,
                        fk_uniformType: types[0].id,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                });
            expect(dbGenerationList).toHaveLength(4);
            expect(dbGenerationList[0].id).toEqual(generationList[1].id);
            expect(dbGenerationList[1].id).toEqual(generationList[2].id);
            expect(dbGenerationList[2].id).toEqual(generationList[0].id);
            expect(dbGenerationList[3].id).toEqual(generationList[3].id);
        });
    });

    test('change sort order down', async ({ page, types, staticData: { data }, browserName }) => {
        test.skip(browserName !== 'chromium', 'This test only runs on Chrome');

        const generationList = data.uniformGenerations.filter(g => g.recdelete === null && g.fk_uniformType === types[0].id);
        await test.step('open type offcanvas', async () => {
            await expect(page.getByRole('row', { name: types[0].name })).toBeVisible();
            await page.getByRole('row', { name: types[0].name }).getByRole('button', { name: 'open' }).click();
            await expect(page.getByRole('dialog').getByRole('heading', { name: types[0].name })).toBeVisible();
        });
        const dialog = page.getByRole('dialog');
        const generationTable = dialog.getByRole('table');

        await test.step('change generation SortOrder', async () => {
            const secondRow = generationTable.getByRole('row', { name: generationList[1].name });
            const thirdRow = generationTable.getByRole('row', { name: generationList[2].name });
            const secondRowMove = secondRow.locator('span[draggable="true"]');
            const thirdRowMove = thirdRow.locator('span[draggable="true"]');

            await expect(secondRowMove).toBeVisible();
            await expect(thirdRowMove).toBeVisible();

            await thirdRowMove.dragTo(secondRowMove, {
                targetPosition: { x: 10, y: 25 }, // Adjust the `y` value to drag further down
            });

            await expect(page.getByText(german.common.success.changeSortorder)).toBeVisible();
        });
        await test.step('check if sortorder is changed', async () => {
            const rows = await generationTable.locator('tbody').getByRole('row').all();

            expect(rows).toHaveLength(4);
            await expect(rows[0]).toHaveAttribute('aria-label', generationList[0].name);
            await expect(rows[1]).toHaveAttribute('aria-label', generationList[2].name);
            await expect(rows[2]).toHaveAttribute('aria-label', generationList[1].name);
            await expect(rows[3]).toHaveAttribute('aria-label', generationList[3].name);
        });
        await test.step('validate db sortorder', async () => {
            const dbGenerationList = await prisma.uniformGeneration.findMany({
                    where: {
                        recdelete: null,
                        fk_uniformType: types[0].id,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                });
            expect(dbGenerationList).toHaveLength(4);
            expect(dbGenerationList[0].id).toEqual(generationList[0].id);
            expect(dbGenerationList[1].id).toEqual(generationList[2].id);
            expect(dbGenerationList[2].id).toEqual(generationList[1].id);
            expect(dbGenerationList[3].id).toEqual(generationList[3].id);
        });
    });

    test('open generation offcanvas', async ({ page, types, staticData: { data } }) => {
        const generationList = data.uniformGenerations.filter(g => g.recdelete === null && g.fk_uniformType === types[0].id);
        await test.step('open type offcanvas', async () => {
            await expect(page.getByRole('row', { name: types[0].name })).toBeVisible();
            await page.getByRole('row', { name: types[0].name }).getByRole('button', { name: 'open' }).click();
            await expect(page.getByRole('dialog').getByRole('heading', { name: types[0].name })).toBeVisible();
        });
        const dialog = page.getByRole('dialog');
        const generationTable = dialog.getByRole('table');

        await test.step('open generation offcanvas', async () => {
            const firstRow = generationTable.getByRole('row', { name: generationList[0].name });
            const openButton = firstRow.getByRole('button', { name: 'open' });

            await expect(openButton).toBeVisible();
            await openButton.click();
            await expect(page.getByRole('heading', { name: generationList[0].name })).toBeVisible();
        });
    });

    test('create generation with size', async ({ page, types, staticData: { data, fk_assosiation } }) => {
        await test.step('open type offcanvas', async () => {
            await expect(page.getByRole('row', { name: types[0].name })).toBeVisible();
            await page.getByRole('row', { name: types[0].name }).getByRole('button', { name: 'open' }).click();
            await expect(page.getByRole('dialog').getByRole('heading', { name: types[0].name })).toBeVisible();
        });

        const typeDialog = page.getByRole('dialog', { name: types[0].name });
        const generationTable = typeDialog.getByRole('table');
        await test.step('open crete generation canvas', async () => {
            const createButton = generationTable.getByRole('button', { name: 'create' });

            await expect(createButton).toBeVisible();
            await createButton.click();
            await expect(page.getByRole('heading', { name: actionText.create })).toBeVisible();
        });

        await test.step('fill form', async () => {
            const dialog = page.getByRole('dialog', { name: actionText.create });
            await expect(dialog).toBeVisible();
            await expect(dialog.getByRole('textbox')).toBeVisible();

            await dialog.getByRole('textbox', { name: german.common.name }).fill('Test Generation 1');
            await dialog.getByRole('switch', { name: german.common.uniform.generation.outdated }).check();
            await dialog.getByRole('combobox', { name: german.common.uniform.sizelist.label }).selectOption(data.uniformSizelists[0].id);
            await dialog.getByRole('button', { name: actionText.create }).click();
        });

        await test.step('check if generation is created', async () => {
            const firstRow = generationTable.getByRole('row', { name: 'Test Generation 1' });

            await expect(firstRow).toBeVisible();
            await expect(firstRow.getByText('Test Generation 1')).toBeVisible();
            await expect(firstRow.getByText(german.common.yes)).toBeVisible();
            await expect(firstRow.getByText(data.uniformSizelists[0].name)).toBeVisible();
        });

        await test.step('check if generation is created in db', async () => {
            const dbGeneration = await prisma.uniformGeneration.findFirst({
                where: {
                    name: 'Test Generation 1',
                    recdelete: null,
                    type: {
                        fk_assosiation
                    },
                },
            });
            expect(dbGeneration).not.toBeNull();
            expect(dbGeneration).toBeDefined();
            expect(dbGeneration).toEqual(
                expect.objectContaining({
                    name: 'Test Generation 1',
                    outdated: true,
                    fk_uniformType: types[0].id,
                    fk_sizelist: data.uniformSizelists[0].id,
                    sortOrder: 4,
                    recdelete: null,
                    recdeleteUser: null,
                }),
            );
        });
    });
    test('create generation without size', async ({ page, types, staticData: {fk_assosiation } }) => {
        await test.step('open type offcanvas', async () => {
            await expect(page.getByRole('row', { name: types[1].name })).toBeVisible();
            await page.getByRole('row', { name: types[1].name }).getByRole('button', { name: 'open' }).click();
            await expect(page.getByRole('dialog').getByRole('heading', { name: types[1].name })).toBeVisible();
        });

        const typeDialog = page.getByRole('dialog', { name: types[1].name });
        const generationTable = typeDialog.getByRole('table');
        await test.step('open crete generation canvas', async () => {
            const createButton = generationTable.getByRole('button', { name: 'create' });
            await expect(createButton).toBeVisible();
            await createButton.click();
            await expect(page.getByRole('heading', { name: actionText.create })).toBeVisible();
        });

        await test.step('fill form', async () => {
            const dialog = page.getByRole('dialog', { name: actionText.create });
            await expect(dialog).toBeVisible();
            await expect(dialog.getByRole('textbox')).toBeVisible();
            await expect(dialog.getByRole('combobox', { name: german.common.uniform.sizelist.label })).toBeHidden();

            await dialog.getByRole('textbox', { name: german.common.name }).fill('Test Generation 1');
            await dialog.getByRole('switch', { name: german.common.uniform.generation.outdated }).check();
            await dialog.getByRole('button', { name: actionText.create }).click();
        });

        await test.step('check if generation is created', async () => {
            const firstRow = generationTable.getByRole('row', { name: 'Test Generation 1' });
            await expect(firstRow).toBeVisible();
            await expect(firstRow.getByText('Test Generation 1')).toBeVisible();
            await expect(firstRow.getByText(german.common.yes)).toBeVisible();
        });

        await test.step('check if generation is created in db', async () => {
            const dbGeneration = await prisma.uniformGeneration.findFirst({
                where: {
                    name: 'Test Generation 1',
                    recdelete: null,
                    type: {
                        fk_assosiation
                    },
                },
            });
            expect(dbGeneration).not.toBeNull();
            expect(dbGeneration).toBeDefined();
            expect(dbGeneration).toEqual(
                expect.objectContaining({
                    name: 'Test Generation 1',
                    outdated: true,
                    fk_uniformType: types[1].id,
                    fk_sizelist: null,
                    sortOrder: 2,
                    recdelete: null,
                    recdeleteUser: null,
                }),
            );
        });
    });
    test('update generation with size', async ({ page, types, staticData: { data } }) => {
        const generation = data.uniformGenerations[0];
        await test.step('open type offcanvas', async () => {
            await expect(page.getByRole('row', { name: types[0].name })).toBeVisible();
            await page.getByRole('row', { name: types[0].name }).getByRole('button', { name: 'open' }).click();
            await expect(page.getByRole('dialog').getByRole('heading', { name: types[0].name })).toBeVisible();
        });

        const typeDialog = page.getByRole('dialog', { name: types[0].name });
        const generationTable = typeDialog.getByRole('table');
        await test.step('open crete generation canvas', async () => {
            const genRow = generationTable.getByRole('row', { name: generation.name });
            await expect(genRow).toBeVisible();
            await genRow.getByRole('button', { name: 'open' }).click();
            await expect(page.getByRole('heading', { name: generation.name })).toBeVisible();
        });

        await test.step('fill form', async () => {
            const dialog = page.getByRole('dialog', { name: generation.name });
            await expect(dialog).toBeVisible();
            await dialog.getByRole('button', { name: actionText.edit }).click();

            await dialog.getByRole('textbox', { name: german.common.name }).fill('Test Generation 1');
            await dialog.getByRole('switch', { name: german.common.uniform.generation.outdated }).uncheck();
            await dialog.getByRole('combobox', { name: german.common.uniform.sizelist.label }).selectOption(data.uniformSizelists[2].id);
            await dialog.getByRole('button', { name: actionText.save }).click();
        });

        await test.step('check generation dialog', async () => {
            const dialog = page.getByRole('dialog', { name: 'Test Generation 1' });
            await expect(dialog).toBeVisible();

            await expect(dialog.getByRole('textbox', { name: german.common.name })).toBeDisabled();
            await expect(dialog.getByRole('switch', { name: german.common.uniform.generation.outdated })).toBeDisabled();
            await expect(dialog.getByRole('combobox', { name: german.common.uniform.sizelist.label })).toBeHidden();
            await expect(dialog.getByLabel(german.common.uniform.sizelist.label)).toBeVisible();

            await expect(dialog.getByRole('textbox', { name: german.common.name })).toHaveValue('Test Generation 1');
            await expect(dialog.getByRole('switch', { name: german.common.uniform.generation.outdated })).not.toBeChecked();
            await expect(dialog.getByLabel(german.common.uniform.sizelist.label)).toHaveText(data.uniformSizelists[2].name);
            await dialog.getByRole('button', { name: 'close' }).click();
            await expect(dialog).toBeHidden();
        });

        await test.step('check table', async () => {
            const newGenRow = generationTable.getByRole('row', { name: 'Test Generation 1' });
            await expect(newGenRow).toBeVisible();
            await expect(newGenRow.getByText('Test Generation 1')).toBeVisible();
            await expect(newGenRow.getByText(german.common.no)).toBeVisible();
            await expect(newGenRow.getByText(data.uniformSizelists[2].name)).toBeVisible();
        });

        await test.step('check if generation is created in db', async () => {
            const dbGeneration = await prisma.uniformGeneration.findFirst({
                where: {
                    id: generation.id,
                },
            });
            expect(dbGeneration).not.toBeNull();
            expect(dbGeneration).toBeDefined();
            expect(dbGeneration).toEqual(
                expect.objectContaining({
                    name: 'Test Generation 1',
                    outdated: false,
                    fk_uniformType: types[0].id,
                    fk_sizelist: data.uniformSizelists[2].id,
                    recdelete: null,
                    recdeleteUser: null,
                    sortOrder: 0,
                }),
            );
        });
    });
    test('update generation without size', async ({ page, types, staticData: { data } }) => {
        const generation = data.uniformGenerations[5];
        await test.step('open type offcanvas', async () => {
            await expect(page.getByRole('row', { name: types[1].name })).toBeVisible();
            await page.getByRole('row', { name: types[1].name }).getByRole('button', { name: 'open' }).click();
            await expect(page.getByRole('dialog').getByRole('heading', { name: types[1].name })).toBeVisible();
        });

        const typeDialog = page.getByRole('dialog', { name: types[1].name });
        const generationTable = typeDialog.getByRole('table');
        await test.step('open crete generation canvas', async () => {
            const genRow = generationTable.getByRole('row', { name: generation.name });
            await expect(genRow).toBeVisible();
            await genRow.getByRole('button', { name: 'open' }).click();
            await expect(page.getByRole('heading', { name: generation.name })).toBeVisible();
        });

        await test.step('fill form', async () => {
            const dialog = page.getByRole('dialog', { name: generation.name });
            await expect(dialog).toBeVisible();
            await dialog.getByRole('button', { name: actionText.edit }).click();

            await dialog.getByRole('textbox', { name: german.common.name }).fill('Test Generation 1');
            await dialog.getByRole('switch', { name: german.common.uniform.generation.outdated }).uncheck();
            await dialog.getByRole('button', { name: actionText.save }).click();
        });

        await test.step('check generation dialog', async () => {
            const dialog = page.getByRole('dialog', { name: 'Test Generation 1' });
            await expect(dialog).toBeVisible();

            await expect(dialog.getByRole('textbox', { name: german.common.name })).toBeDisabled();
            await expect(dialog.getByRole('switch', { name: german.common.uniform.generation.outdated })).toBeDisabled();

            await expect(dialog.getByRole('textbox', { name: german.common.name })).toHaveValue('Test Generation 1');
            await expect(dialog.getByRole('switch', { name: german.common.uniform.generation.outdated })).not.toBeChecked();

            await dialog.getByRole('button', { name: 'close' }).click();
            await expect(dialog).toBeHidden();
        });

        await test.step('check table', async () => {
            const newGenRow = generationTable.getByRole('row', { name: 'Test Generation 1' });
            await expect(newGenRow).toBeVisible();
            await expect(newGenRow.getByText('Test Generation 1')).toBeVisible();
            await expect(newGenRow.getByText(german.common.no)).toBeVisible();
        });

        await test.step('check if generation is created in db', async () => {
            const dbGeneration = await prisma.uniformGeneration.findFirst({
                where: {
                    id: generation.id,
                },
            });
            expect(dbGeneration).not.toBeNull();
            expect(dbGeneration).toBeDefined();
            expect(dbGeneration).toEqual(
                expect.objectContaining({
                    name: 'Test Generation 1',
                    outdated: false,
                    fk_uniformType: types[1].id,
                    fk_sizelist: null,
                    recdelete: null,
                    recdeleteUser: null,
                    sortOrder: 1,
                }),
            );
        });
    });

    test('delete generation', async ({ page, types, staticData: { data } }) => {
        const dangerDialog = new DangerConfirmationModal(page);
        const generation = data.uniformGenerations[0];
        await test.step('open type offcanvas', async () => {
            await expect(page.getByRole('row', { name: types[0].name })).toBeVisible();
            await page.getByRole('row', { name: types[0].name }).getByRole('button', { name: 'open' }).click();
            await expect(page.getByRole('dialog').getByRole('heading', { name: types[0].name })).toBeVisible();
        });

        const typeDialog = page.getByRole('dialog', { name: types[0].name });
        const generationTable = typeDialog.getByRole('table');
        await test.step('open generation offcanvas', async () => {
            const genRow = generationTable.getByRole('row', { name: generation.name });
            await expect(genRow).toBeVisible();

            await genRow.getByRole('button', { name: 'open' }).click();
            await expect(page.getByRole('heading', { name: generation.name })).toBeVisible();
        });
        const generationDialog = page.getByRole('dialog', { name: generation.name });

        await test.step('delete generation', async () => {
            await generationDialog.getByRole('button', { name: actionText.delete }).click();

            await expect(dangerDialog.div_popup).toBeVisible();

            await expect(dangerDialog.div_header).toContainText(generation.name);
            await expect(dangerDialog.div_header).toHaveClass(/bg-danger/);

            await dangerDialog.btn_save.click();
            await expect(dangerDialog.btn_save).toBeDisabled();

            await dangerDialog.txt_confirmation.fill(`Generation-${generation.name}`);
            await expect(dangerDialog.btn_save).toBeEnabled();

            await dangerDialog.btn_save.click();
            await expect(dangerDialog.div_popup).toBeHidden();
        });

        await test.step('check if generation is delete in table', async () => {
            await expect(generationDialog).toBeHidden();
            await expect(generationTable.getByRole('row', { name: generation.name })).toBeHidden();
            await expect(page.getByText(generation.name)).toBeHidden();
        });

        await test.step('check if generation is delete in db', async () => {
            const dbGeneration = await prisma.uniformGeneration.findUnique({
                where: {
                    id: generation.id,
                },
            });

            expect(dbGeneration).not.toBeNull();
            expect(dbGeneration).toEqual(
                expect.objectContaining({
                    ...generation,
                    recdelete: expect.any(Date),
                    recdeleteUser: 'test4',
                })
            );
        });
    });
});