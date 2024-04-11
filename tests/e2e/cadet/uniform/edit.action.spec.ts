import { Page, expect, test } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { CadetUniformComponent } from "../../../pages/cadet/cadetUniform.component";
import { EditUniformFormComponent } from "../../../pages/uniform/EditUniformForm.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { testUniformItems } from "../../../testData/staticData";

test.use({ storageState: adminAuthFile });
test.describe.skip('', () => {
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
    let uniformComponent: CadetUniformComponent;
    let formComponent: EditUniformFormComponent;

    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();
        uniformComponent = new CadetUniformComponent(page);
        formComponent = new EditUniformFormComponent(page, testData.uniformId);
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


    test('validate formData', async () => {
        await expect(uniformComponent.div_uitem(uniform.id)).toBeVisible();

        await test.step('open form', async () => {
            await uniformComponent.btn_uitem_edit(uniform.id).click();
            await expect(formComponent.div_component).toBeVisible();
        });

        await test.step('validate selected Data', async () => {
            await Promise.all([
                expect.soft(formComponent.sel_generation).toHaveValue(uniform.fk_generation as string),
                expect.soft(formComponent.sel_size).toHaveValue(uniform.fk_size as string),
                expect.soft(formComponent.txt_comment).toBeVisible(),
                expect.soft(formComponent.txt_comment).toHaveValue(uniform.comment as string),
                expect.soft(formComponent.chk_active).toBeChecked(),
                expect.soft(formComponent.chk_active).toBeDisabled(),
            ]);
        });
    });

    test('validate CancelFunction', async () => {
        await test.step('open form', async () => {
            await uniformComponent.btn_uitem_edit(uniform.id).click();
            await expect(formComponent.div_component).toBeVisible();
        });

        await test.step('select different Generation and cancel', async () => {
            await formComponent.sel_generation.selectOption('acc01de5-3b83-11ee-ab4b-0068eb8ba754');
            await formComponent.btn_cancel.click();
        });

        await test.step('validate data not changed', async () => {
            await expect.soft(formComponent.div_component).not.toBeVisible();
            await expect.soft(uniformComponent.div_utiem_generation(uniform.id)).toHaveText('Generation1-4');
        });

        await test.step('reopen form and validate form is reset', async () => {
            await uniformComponent.btn_uitem_edit(uniform.id).click();
            await expect(formComponent.div_component).toBeVisible();
            await expect.soft(formComponent.sel_generation).toHaveValue(uniform.fk_generation as string);
        });
    });

    test('validate SaveFunction', async () => {
        await test.step('open form', async () => {
            await uniformComponent.btn_uitem_edit(uniform.id).click();
            await expect(formComponent.div_component).toBeVisible();
        });

        await test.step('select different Generation and save', async () => {
            await formComponent.sel_generation.selectOption('acc01de5-3b83-11ee-ab4b-0068eb8ba754');
            await formComponent.btn_save.click();
        });

        await test.step('validate data changed', async () => {
            await expect.soft(formComponent.div_component).not.toBeVisible();
            await expect.soft(uniformComponent.div_utiem_generation(uniform.id)).toHaveText('Generation1-1');
        });
    });

    test('validate passive UT', async () => {
        const formComponent = new EditUniformFormComponent(page, '45f31e47-3c0d-11ee-8084-0068eb8ba754');
        // using Uwe Luft   
        await page.goto(`/de/app/cadet/d468ac3c-3c11-11ee-8084-0068eb8ba754`);

        await test.step('open form', async () => {
            await uniformComponent.btn_uitem_edit('45f31e47-3c0d-11ee-8084-0068eb8ba754').click();
            await expect(formComponent.div_component).toBeVisible();
        });

        await test.step('validate', async () => {
            await expect.soft(formComponent.chk_active).not.toBeChecked();
            await expect.soft(formComponent.chk_active).not.toBeDisabled();
        });
    });

    test('validate mobileButton', async () => {
        await page.setViewportSize({ width: 300, height: 800 });

        await expect(uniformComponent.btn_uitem_menu(testData.uniformId)).toBeVisible();
        await uniformComponent.btn_uitem_menu(testData.uniformId).click();
        /*
                await expect(uniformComponent.btn_uitem_menu_edit(testData.uniformId)).toBeVisible();
                await uniformComponent.btn_uitem_menu_edit(testData.uniformId).click();
        
                await expect(formComponent.div_component).toBeVisible();*/
    });
});
