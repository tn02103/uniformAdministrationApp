import { expect } from "playwright/test";
import { prisma } from "../../../../src/lib/db";
import { CreateUniformPage } from "../../../_playwrightConfig/pages/uniform/create/index.page";
import { adminTest } from "../../../_playwrightConfig/setup";


type Fixture = {
    createPage: CreateUniformPage,
}
const test = adminTest.extend<Fixture>({
    createPage: async ({ page }, use) => use(new CreateUniformPage(page)),
});
test.beforeEach(async ({ page }) => await page.goto(`/de/app/uniform/new`));
test.afterEach(async ({ staticData: { cleanup } }) => cleanup.uniform());

test('validate knownIds', async ({ page, createPage, staticData: { ids, organisationId } }) => {
    await test.step('configuration', async () => {
        await createPage.btn_tab_knownIds.click();

        await createPage.configurator.sel_type.selectOption(ids.uniformTypeIds[0]);
        await createPage.configurator.sel_generation.selectOption(ids.uniformGenerationIds[2]);
        await createPage.configurator.sel_size.selectOption(ids.sizeIds[8]);
        await createPage.configurator.txt_comment.fill('test comment');
        await createPage.configurator.chk_isReserve.setChecked(true);
        await createPage.configurator.btn_continue.click();
    });
    await test.step('add ids', async () => {
        await createPage.numberInput.txt_numStart.fill('9980');
        await createPage.numberInput.txt_numEnd.fill('9990');
        await createPage.numberInput.btn_numAdd.click();

        await createPage.numberInput.div_number(9985).hover();
        await createPage.numberInput.btn_number_remove(9985).click();
        await createPage.numberInput.btn_create.click();

        await expect(page.locator('.Toastify__toast--success')).toBeVisible();
    });

    await test.step('validate dbData', async () => {
        const uniformItems = await prisma.uniform.findMany({
            where: {
                number: { gte: 9900 },
                recdelete: null,
                type: { organisationId }
            }
        });

        expect(uniformItems.length).toBe(10);
        expect.soft(uniformItems[0].comment).toBe('test comment');
        expect.soft(uniformItems[0].isReserve).toBeTruthy();
        expect.soft(uniformItems[0].fk_uniformType).toBe(ids.uniformTypeIds[0]);
        expect.soft(uniformItems[0].fk_generation).toBe(ids.uniformGenerationIds[2]);
        expect.soft(uniformItems[0].fk_size).toBe(ids.sizeIds[8]);
    });
});
test('validate generate Ids', async ({ page, createPage, staticData: { ids, organisationId } }) => {
    const year = (+(new Date().getFullYear()) % 100);
    await test.step('configuration', async () => {
        await createPage.btn_tab_generateIds.click();
        await createPage.configurator.sel_type.selectOption(ids.uniformTypeIds[0]);
        await createPage.configurator.sel_generation.selectOption(ids.uniformGenerationIds[3]);
        await createPage.configurator.txt_comment.fill('test comment2');
        await createPage.configurator.chk_isReserve.setChecked(false);
        await createPage.configurator.btn_continue.click();
    });

    await test.step('generate ids', async () => {
        await createPage.generateStep1.txt_amount_size(ids.sizeIds[16]).fill('5');
        await createPage.generateStep1.txt_amount_size(ids.sizeIds[17]).fill('8');
        await createPage.generateStep1.btn_generate.click();
        await createPage.generateStep2.chk_size_number(ids.sizeIds[17], `${year}07`).setChecked(false);
        await createPage.generateStep2.chk_size_number(ids.sizeIds[17], `${year}08`).setChecked(false);
        await expect(createPage.generateStep2.btn_create).toContainText("11");
        await createPage.generateStep2.btn_create.click();
        await expect(page.locator('.Toastify__toast--success')).toBeVisible();
    });

    await test.step('validate dbData', async () => {
        const uniformItems = await prisma.uniform.findMany({
            where: {
                number: {
                    gte: (year * 100),
                    lt: ((year + 1) * 100),
                },
                recdelete: null,
                type: { organisationId }
            }
        });

        expect(uniformItems.length).toBe(11);
        expect.soft(uniformItems[0].comment).toBe('test comment2');
        expect.soft(uniformItems[0].isReserve).toBeFalsy();
        expect.soft(uniformItems[0].fk_uniformType).toBe(ids.uniformTypeIds[0]);
        expect.soft(uniformItems[0].fk_generation).toBe(ids.uniformGenerationIds[3]);
        expect.soft(uniformItems[6].comment).toBe('test comment2');
        expect.soft(uniformItems[6].isReserve).toBeFalsy();
        expect.soft(uniformItems[6].fk_uniformType).toBe(ids.uniformTypeIds[0]);
        expect.soft(uniformItems[6].fk_generation).toBe(ids.uniformGenerationIds[3]);
        expect.soft(uniformItems[0].fk_size).toBe(ids.sizeIds[16]);
        expect.soft(uniformItems[4].fk_size).toBe(ids.sizeIds[16]);
        expect.soft(uniformItems[5].fk_size).toBe(ids.sizeIds[17]);
        expect.soft(uniformItems[6].fk_size).toBe(ids.sizeIds[17]);
    });
});
