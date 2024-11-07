import { expect } from "playwright/test";
import { CreateUniformPage } from "../../../_playwrightConfig/pages/uniform/create/index.page";
import { adminTest } from "../../../_playwrightConfig/setup";

type Fixture = {
    createPage: CreateUniformPage,
}
const test = adminTest.extend<Fixture>({
    createPage: async ({ page }, use) => use(new CreateUniformPage(page)),
});
test.beforeEach(async ({ page }) => await page.goto(`/de/app/uniform/new`));


test('effect of knownIdsToggle on Configurator', async ({ createPage }) => {
    await test.step('initial state', async () => {
        await Promise.all([
            expect(createPage.btn_tab_knownIds).toBeVisible(),
            expect(createPage.btn_tab_generateIds).toBeVisible(),
            expect(createPage.configurator.div_configurator).not.toBeVisible(),
        ]);
    });

    await test.step('knownIds state', async () => {
        await createPage.btn_tab_knownIds.click();
        await Promise.all([
            expect.soft(createPage.configurator.div_configurator).toBeVisible(),
            expect.soft(createPage.btn_tab_knownIds.locator('..')).toHaveClass(/active/),
            expect.soft(createPage.configurator.sel_size).toBeVisible(),
        ]);
    });

    await test.step('generateIds state', async () => {
        await createPage.btn_tab_generateIds.click();
        await Promise.all([
            expect.soft(createPage.configurator.div_configurator).toBeVisible(),
            expect.soft(createPage.btn_tab_generateIds.locator('..')).toHaveClass(/active/),
            expect.soft(createPage.configurator.sel_size).not.toBeVisible(),
        ]);
    });
});
test('formValidations', async ({ createPage, staticData: { ids } }) => {
    await test.step('initialState', async () => {
        await createPage.btn_tab_knownIds.click();
        await Promise.all([
            expect.soft(createPage.configurator.sel_type).toBeEnabled(),
            expect.soft(createPage.configurator.sel_generation).toBeDisabled(),
            expect.soft(createPage.configurator.sel_size).toBeDisabled(),
            expect.soft(createPage.configurator.chk_active).toBeEnabled(),
            expect.soft(createPage.configurator.txt_comment).toBeEnabled(),
        ]);
    });

    await test.step('type required', async () => {
        await createPage.configurator.btn_continue.click();
        await expect.soft(createPage.configurator.sel_type).toHaveClass(/is-invalid/);
    });

    await test.step('generation and size required', async () => {
        await createPage.configurator.sel_type.selectOption(ids.uniformTypeIds[0]);

        await Promise.all([
            expect.soft(createPage.configurator.sel_generation).toBeEnabled(),
            expect.soft(createPage.configurator.sel_size).toBeEnabled(),
        ]);

        await createPage.configurator.btn_continue.click();

        await Promise.all([
            expect.soft(createPage.configurator.sel_generation).toHaveClass(/is-invalid/),
            expect.soft(createPage.configurator.sel_size).toHaveClass(/is-invalid/),
        ]);
    });

    await test.step('only generation required', async () => {
        await createPage.configurator.sel_type.selectOption(ids.uniformTypeIds[1]);

        await Promise.all([
            expect.soft(createPage.configurator.sel_generation).toBeEnabled(),
            expect.soft(createPage.configurator.sel_size).toBeDisabled(),
        ]);

        await createPage.configurator.btn_continue.click();

        await Promise.all([
            expect.soft(createPage.configurator.sel_generation).toHaveClass(/is-invalid/),
            expect.soft(createPage.configurator.sel_size).not.toHaveClass(/is-invalid/),
        ]);
    });
    await test.step('only size required', async () => {
        await createPage.configurator.sel_type.selectOption(ids.uniformTypeIds[2]);

        await Promise.all([
            expect.soft(createPage.configurator.sel_generation).toBeDisabled(),
            expect.soft(createPage.configurator.sel_size).toBeEnabled(),
        ]);

        await createPage.configurator.btn_continue.click();

        await Promise.all([
            expect.soft(createPage.configurator.sel_generation).not.toHaveClass(/is-invalid/),
            expect.soft(createPage.configurator.sel_size).toHaveClass(/is-invalid/),
        ]);
    });
    await test.step('none required', async () => {
        await createPage.configurator.sel_type.selectOption(ids.uniformTypeIds[3]);

        await Promise.all([
            expect.soft(createPage.configurator.sel_generation).toBeDisabled(),
            expect.soft(createPage.configurator.sel_size).toBeDisabled(),
        ]);

        await createPage.configurator.btn_continue.click();

        await Promise.all([
            expect.soft(createPage.configurator.sel_generation).not.toHaveClass(/is-invalid/),
            expect.soft(createPage.configurator.sel_size).not.toHaveClass(/is-invalid/),
            expect.soft(createPage.configurator.btn_continue).not.toBeVisible(),
        ]);
    });
});

test('select options', async ({ createPage, staticData: { ids } }) => {
    const { configurator } = createPage
    await test.step('initial state', async () => {
        await createPage.btn_tab_knownIds.click();

        await Promise.all([
            expect(configurator.sel_type).toBeEnabled(),
            expect(configurator.sel_generation).toBeDisabled(),
            expect(configurator.sel_size).toBeDisabled(),
            expect(configurator.sel_type_option(ids.uniformTypeIds[0])).toBeAttached(),
            expect(configurator.sel_type_option(ids.uniformTypeIds[3])).toBeAttached(),
            expect(configurator.sel_type_option(ids.uniformTypeIds[4])).not.toBeAttached(),
        ]);
    });

    await test.step('Typ-1', async () => {
        await test.step('initial', async () => {
            await configurator.sel_type.selectOption(ids.uniformTypeIds[0]);
            await Promise.all([
                expect(configurator.sel_generation).toBeEnabled(),
                expect(configurator.sel_size).toBeEnabled(),
                expect.soft(configurator.sel_generation_option('null')).toBeAttached(),
                expect.soft(configurator.sel_generation_option(ids.uniformGenerationIds[0])).toBeAttached(), // Generation1-1
                expect.soft(configurator.sel_generation_option(ids.uniformGenerationIds[3])).toBeAttached(), // Generation1-4
                expect.soft(configurator.sel_generation_option(ids.uniformGenerationIds[4])).not.toBeAttached(), // Generation2-1
                expect.soft(configurator.sel_size_option('null')).toBeAttached(),
                expect.soft(configurator.sel_size_option(ids.sizeIds[0])).toBeAttached(), // Size -> 0
                expect.soft(configurator.sel_size_option(ids.sizeIds[13])).not.toBeAttached(), // Size -> 13
                expect.soft(configurator.sel_size_option(ids.sizeIds[16])).not.toBeAttached(), // Size -> Größe16 
            ]);
        });
        await test.step('Generation1-1', async () => {
            await configurator.sel_generation.selectOption(ids.uniformGenerationIds[0]);

            await Promise.all([
                expect.soft(configurator.sel_size_option(ids.sizeIds[0])).toBeAttached(), // Size -> 0
                expect.soft(configurator.sel_size_option(ids.sizeIds[5])).toBeAttached(), // Size -> 5
                expect.soft(configurator.sel_size_option(ids.sizeIds[6])).not.toBeAttached(), // Size -> 6
                expect.soft(configurator.sel_size_option(ids.sizeIds[16])).not.toBeAttached(), // Size -> Größe16 
            ]);

            await configurator.sel_size.selectOption(ids.sizeIds[5]);
        });
        await test.step('Generation1-3', async () => {
            // sizelistChange with sameSize
            await configurator.sel_generation.selectOption(ids.uniformGenerationIds[2]);
            await Promise.all([
                expect.soft(configurator.sel_size_option(ids.sizeIds[0])).toBeAttached(), // Size -> 0
                expect.soft(configurator.sel_size_option(ids.sizeIds[5])).toBeAttached(), // Size -> 5
                expect.soft(configurator.sel_size_option(ids.sizeIds[6])).toBeAttached(), // Size -> 6
                expect.soft(configurator.sel_size_option(ids.sizeIds[16])).not.toBeAttached(), // Size -> Größe16
                expect.soft(configurator.sel_size).toHaveValue(ids.sizeIds[5]),
            ]);
        });
        await test.step('Generation1-4', async () => {
            // sizelistChange with different size
            await configurator.sel_generation.selectOption(ids.uniformGenerationIds[3]);

            await Promise.all([
                expect.soft(configurator.sel_size_option(ids.sizeIds[0])).not.toBeAttached(), // Size -> 0
                expect.soft(configurator.sel_size_option(ids.sizeIds[5])).not.toBeAttached(), // Size -> 5
                expect.soft(configurator.sel_size_option(ids.sizeIds[6])).not.toBeAttached(), // Size -> 6
                expect.soft(configurator.sel_size_option(ids.sizeIds[16])).toBeAttached(), // Size -> Größe16 
                expect.soft(configurator.sel_size).not.toHaveValue(ids.sizeIds[5]),
            ]);
        });
    });
    await test.step('Typ-2', async () => {
        await configurator.sel_type.selectOption(ids.uniformTypeIds[1]);

        await Promise.all([
            expect(configurator.sel_generation).toBeEnabled(),
            expect(configurator.sel_size).toBeDisabled(),
            expect.soft(configurator.sel_generation_option(ids.uniformGenerationIds[0])).not.toBeAttached(), // Generation1-1
            expect.soft(configurator.sel_generation_option(ids.uniformGenerationIds[4])).toBeAttached(), // Generation2-1
            expect.soft(configurator.sel_generation_option(ids.uniformGenerationIds[5])).toBeAttached(), // Generation2-2
            expect.soft(configurator.sel_generation_option(ids.uniformGenerationIds[6])).not.toBeAttached(), // Generation2-3 (deleted)
        ]);
    });
    await test.step('Typ-3', async () => {
        await configurator.sel_type.selectOption(ids.uniformTypeIds[2]);

        await Promise.all([
            expect(configurator.sel_generation).toBeDisabled(),
            expect(configurator.sel_size).toBeEnabled(),
            expect.soft(configurator.sel_size_option(ids.sizeIds[0])).toBeAttached(), // Size -> 0
            expect.soft(configurator.sel_size_option(ids.sizeIds[5])).toBeAttached(), // Size -> 5
            expect.soft(configurator.sel_size_option(ids.sizeIds[6])).toBeAttached(), // Size -> 6
            expect.soft(configurator.sel_size_option(ids.sizeIds[16])).not.toBeAttached(), // Size -> Größe16  
        ]);
    });
    await test.step('Typ-4', async () => {
        await configurator.sel_type.selectOption(ids.uniformTypeIds[3]);
        await Promise.all([
            expect(configurator.sel_generation).toBeDisabled(),
            expect(configurator.sel_size).toBeDisabled(),
        ]);
    });
});
