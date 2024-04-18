import test, { Page, expect } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { acronymValidationTest, newNameValidationTests, numberValidationTests } from "../../../global/testSets";
import { GenerationListComponent } from "../../../pages/admin/uniform/GenerationList.component";
import { TypeDetailComponent } from "../../../pages/admin/uniform/typeDetail.component";
import { TypeListComponent } from "../../../pages/admin/uniform/typeList.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { testUniformTypes } from "../../../testData/staticData";
import t from "@/../public/locales/de";

const type = testUniformTypes.find(t => t.id === '036ff236-3b83-11ee-ab4b-0068eb8ba754')!;

test.use({ storageState: adminAuthFile });
test.describe('', () => {
    let page: Page;
    let listComponent: TypeListComponent;
    let detailComponent: TypeDetailComponent;
    let generationComponent: GenerationListComponent;
    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();
        listComponent = new TypeListComponent(page);
        detailComponent = new TypeDetailComponent(page);
        generationComponent = new GenerationListComponent(page);

        await page.goto('/de/app/admin/uniform');
    });
    test.beforeEach(async () => {
        await cleanupData();
        await page.reload();
        await listComponent.btn_open(type.id).click();
    });
    test.afterAll(() => page.close());

    test('validate data and visiblity', async () => {
        await test.step('uneditable', async () => {
            await Promise.all([
                expect.soft(detailComponent.div_name).toBeVisible(),
                expect.soft(detailComponent.txt_name).not.toBeVisible(),
                expect.soft(detailComponent.btn_edit).toBeVisible(),
                expect.soft(detailComponent.btn_cancel).not.toBeVisible(),
                expect.soft(detailComponent.btn_save).not.toBeVisible(),

                expect.soft(detailComponent.div_header).toContainText(type.name),
                expect.soft(detailComponent.div_name).toHaveText(type.name),
                expect.soft(detailComponent.div_acronym).toHaveText(type.acronym),
                expect.soft(detailComponent.div_issuedDefault).toHaveText(type.issuedDefault.toString()),
                expect.soft(detailComponent.div_usingGenerations).toHaveText(t.common.yes),
                expect.soft(detailComponent.div_usingSizes).toHaveText(t.common.yes),
                expect.soft(detailComponent.div_defaultSL).toHaveText('Liste1'),
            ]);
        });

        await detailComponent.btn_edit.click();

        await test.step('editable', async () => {
            await Promise.all([
                expect.soft(detailComponent.div_name).not.toBeVisible(),
                expect.soft(detailComponent.txt_name).toBeVisible(),
                expect.soft(detailComponent.btn_edit).not.toBeVisible(),
                expect.soft(detailComponent.btn_cancel).toBeVisible(),
                expect.soft(detailComponent.btn_save).toBeVisible(),

                expect.soft(detailComponent.txt_name).toHaveValue(type.name),
                expect.soft(detailComponent.txt_acronym).toHaveValue(type.acronym),
                expect.soft(detailComponent.txt_issuedDefault).toHaveValue(type.issuedDefault.toString()),
                expect.soft(detailComponent.chk_usingGenerations).toBeChecked(),
                expect.soft(detailComponent.chk_usingSizes).toBeChecked(),
                expect.soft(detailComponent.sel_defaultSL).toHaveValue(type.fk_defaultSizeList as string)
            ]);
        });
    });

    test.describe('validate formValidation', () => {
        test('name', async () => {
            const tests = newNameValidationTests({
                minLength: 1,
                maxLength: 10
            });

            for (const testSet of tests) {
                await test.step(testSet.testValue, async () => {
                    await page.reload();
                    await listComponent.btn_open(type.id).click();

                    await detailComponent.btn_edit.click();
                    await detailComponent.txt_name.fill(String(testSet.testValue));
                    await detailComponent.btn_save.click();

                    if (testSet.valid) {
                        await expect.soft(detailComponent.err_name).not.toBeVisible();
                    } else {
                        await expect.soft(detailComponent.err_name).toBeVisible();
                    }
                });
            }
        });
        test('acronym', async () => {
            const tests = acronymValidationTest({ emptyAllowed: false });
            for (const testSet of tests) {
                await test.step(testSet.testValue, async () => {
                    await page.reload();
                    await listComponent.btn_open(type.id).click();

                    await detailComponent.btn_edit.click();
                    await detailComponent.txt_acronym.fill(String(testSet.testValue));
                    await detailComponent.btn_save.click();

                    if (testSet.valid) {
                        await expect(detailComponent.err_acronym).not.toBeVisible();
                    } else {
                        await expect(detailComponent.err_acronym).toBeVisible();
                    }
                })
            }
        });

        test('defaultIssued', async () => {
            const tests = numberValidationTests({
                min: 0,
                max: 10,
                strict: false,
                testEmpty: true,
            })
            for (const testSet of tests) {
                await test.step(testSet.testValue, async () => {
                    await page.reload();
                    await listComponent.btn_open(type.id).click();

                    await detailComponent.btn_edit.click();
                    await detailComponent.txt_issuedDefault.fill(String(testSet.testValue));
                    await detailComponent.btn_save.click();
                    if (testSet.valid) {
                        await expect(detailComponent.err_issuedDefault).not.toBeVisible();
                    } else {
                        await expect(detailComponent.err_issuedDefault).toBeVisible();
                    }
                });
            }
        });
    });

    test('validate sel_defaultSl hidden when not using sizes', async () => {
        await detailComponent.btn_edit.click();
        await expect(detailComponent.chk_usingSizes).toBeChecked();
        await expect(detailComponent.sel_defaultSL).toBeVisible();

        await detailComponent.chk_usingSizes.click();
        await expect(detailComponent.chk_usingSizes).not.toBeChecked();
        await expect(detailComponent.sel_defaultSL).not.toBeVisible();
    });
    test('validate div_generationList hidden when not using generations', async () => {
        await expect(generationComponent.btn_create).toBeVisible();

        await detailComponent.btn_edit.click();
        await detailComponent.chk_usingGenerations.click();
        await detailComponent.btn_save.click();

        await expect(detailComponent.div_usingGenerations).toHaveText(t.common.no);
        await expect(generationComponent.btn_create).not.toBeVisible();
    });
    test('cancel function', async () => {
        await test.step('change data', async () => {
            await detailComponent.btn_edit.click();
            await detailComponent.txt_name.fill('NewName');
            await detailComponent.txt_acronym.fill('XX');
            await detailComponent.btn_cancel.click();
        });

        await test.step('validate data not changed', async () => {
            await expect(detailComponent.btn_edit).toBeVisible();
            await expect.soft(detailComponent.div_name).toHaveText(type.name);
            await expect.soft(detailComponent.div_acronym).toHaveText(type.acronym);
        });

        await test.step('validate formReset', async () => {
            await detailComponent.btn_edit.click();
            await expect.soft(detailComponent.txt_name).toHaveValue(type.name);
            await expect.soft(detailComponent.txt_acronym).toHaveValue(type.acronym);
        });
    });
    test('save function', async () => {
        await test.step('change data', async () => {
            await detailComponent.btn_edit.click();

            await detailComponent.txt_name.fill('NewName');
            await detailComponent.txt_acronym.fill('XX');
            await detailComponent.txt_issuedDefault.fill('3');
            await detailComponent.chk_usingGenerations.click();
            await detailComponent.sel_defaultSL.selectOption('277a262c-3b83-11ee-ab4b-0068eb8ba754')
            await detailComponent.btn_save.click();
        });
        await test.step('validate data changed', async () => {
            await expect(detailComponent.btn_edit).toBeVisible();
            await Promise.all([
                expect.soft(detailComponent.div_name).toHaveText('NewName'),
                expect.soft(detailComponent.div_acronym).toHaveText('XX'),
                expect.soft(detailComponent.div_issuedDefault).toHaveText('3'),
                expect.soft(detailComponent.div_usingGenerations).toHaveText(t.common.no),
                expect.soft(detailComponent.div_usingSizes).toHaveText(t.common.yes),
                expect.soft(detailComponent.div_defaultSL).toHaveText('Liste2'),
            ]);
        });
    });
});
