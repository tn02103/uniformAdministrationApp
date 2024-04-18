import { Page, expect, test } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { newNameValidationTests, numberValidationTests } from "../../../global/testSets";
import { UniformSizeAdministrationPage } from "../../../pages/admin/uniform/UniformSizeAdministration.page";
import { MessagePopupComponent } from "../../../pages/popups/MessagePopup.component";
import { SimpleFormPopupComponent } from "../../../pages/popups/SimpleFormPopup.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { testAssosiation, testSizes } from "../../../testData/staticData";
import t from "@/../public/locales/de";

const sizes = testSizes
    .filter(s => (s.fk_assosiation === testAssosiation.id))
    .sort((a, b) => a.sortOrder - b.sortOrder);

test.use({ storageState: adminAuthFile });
test.describe.skip('', () => {
    let page: Page;
    let uniformSizePage: UniformSizeAdministrationPage;
    let simpleFormPopup: SimpleFormPopupComponent;
    let messagePopup: MessagePopupComponent;

    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();
        uniformSizePage = new UniformSizeAdministrationPage(page);
        simpleFormPopup = new SimpleFormPopupComponent(page);
        messagePopup = new MessagePopupComponent(page);
        await page.goto('/de/app/admin/uniform/sizes');
    });
    test.beforeEach(async () => {
        await cleanupData();
        await page.reload();
    });
    test.afterAll(() => page.close());

    test('validate Data', async () => {
        await expect(uniformSizePage.div_size(sizes[0].id)).toBeVisible();

        const divList = await page.locator('div[data-testid^="div_size_"]').all();
        await expect(divList.length).toBe(sizes.length);

        const promises = [];
        for (let i = 0; i < divList.length; i++) {
            promises.push(expect.soft(divList[i]).toHaveAttribute("data-testid", `div_size_${sizes[i].id}`));
            promises.push(expect.soft((await uniformSizePage.div_name(sizes[i].id))).toHaveText(sizes[i].name));
            promises.push(expect.soft(uniformSizePage.div_index(sizes[i].id)).toHaveText(String(i)));
        }

        await Promise.all(promises);
    });

    test('validate SizePannel hover', async () => {
        const sizeId = sizes[0].id
        await expect(uniformSizePage.div_size(sizeId)).toBeVisible();

        await Promise.all([
            expect.soft(uniformSizePage.div_name(sizeId)).toBeVisible(),
            expect.soft(uniformSizePage.div_index(sizeId)).toBeVisible(),
            expect.soft(uniformSizePage.btn_menu(sizeId)).not.toBeVisible(),
            expect.soft(uniformSizePage.btn_moveUp(sizeId)).not.toBeVisible(),
            expect.soft(uniformSizePage.btn_moveDown(sizeId)).not.toBeVisible(),
        ]);
        await uniformSizePage.div_name(sizeId).hover();

        await Promise.all([
            expect.soft(uniformSizePage.div_name(sizeId)).toBeVisible(),
            expect.soft(uniformSizePage.div_index(sizeId)).toBeVisible(),
            expect.soft(uniformSizePage.btn_menu(sizeId)).toBeVisible(),
            expect.soft(uniformSizePage.btn_moveUp(sizeId)).toBeVisible(),
            expect.soft(uniformSizePage.btn_moveDown(sizeId)).toBeVisible(),
        ]);
    });

    test('validate MoveUp', async () => {
        await uniformSizePage.div_size(sizes[1].id).hover();
        await uniformSizePage.btn_moveUp(sizes[1].id).click();

        const divList = await page.locator('div[data-testid^="div_size_"]').all();
        await expect.soft(divList[0]).toHaveAttribute("data-testid", `div_size_${sizes[1].id}`);
    });

    test('validate MoveDown', async () => {
        await uniformSizePage.div_size(sizes[1].id).hover();
        await uniformSizePage.btn_moveDown(sizes[1].id).click();

        const divList = await page.locator('div[data-testid^="div_size_"]').all();
        await expect.soft(divList[2]).toHaveAttribute("data-testid", `div_size_${sizes[1].id}`);
    });

    test('validate create', async () => {
        await uniformSizePage.btn_create.click();

        await expect(simpleFormPopup.div_popup).toBeVisible();
        await simpleFormPopup.txt_input.fill('newSize');
        await simpleFormPopup.btn_save.click();

        await expect(simpleFormPopup.div_popup).not.toBeVisible();
        await expect(page.getByText('newSize')).toBeVisible();
    });
    test('validate namePopup formValidation', async () => {
        const tests = newNameValidationTests({
            minLength: 1,
            maxLength: 10
        });
        for (const testSet of tests) {
            await test.step(testSet.testValue, async () => {
                await page.reload();
                await uniformSizePage.btn_create.click();

                await simpleFormPopup.txt_input.fill(String(testSet.testValue));
                await simpleFormPopup.btn_save.click();

                if (testSet.valid) {
                    await expect.soft(simpleFormPopup.err_input).not.toBeVisible();
                } else {
                    await expect.soft(simpleFormPopup.err_input).toBeVisible();
                }
            });
        }
    });
    test('validate setPosition', async () => {
        await uniformSizePage.div_size(sizes[10].id).hover();
        await uniformSizePage.btn_menu(sizes[10].id).click();
        await uniformSizePage.btn_menu_setPosition(sizes[10].id).click();

        await expect(simpleFormPopup.div_popup).toBeVisible();
        await simpleFormPopup.txt_input.fill('0');
        const responseTimeout = page.waitForResponse(`/api/uniform/size/${sizes[10].id}/sortOrder`);
        await simpleFormPopup.btn_save.click();
        await responseTimeout;
        await page.waitForTimeout(100);

        const divList = await page.locator('div[data-testid^="div_size_"]').all();
        await expect.soft(divList[0]).toHaveAttribute("data-testid", `div_size_${sizes[10].id}`);
    });
    test('validate setPosition formValidation', async () => {
        const tests = numberValidationTests({
            testEmpty: true
        });

        for (const testSet of tests) {
            await test.step(testSet.testValue, async () => {
                await page.reload();
                await uniformSizePage.div_size(sizes[10].id).hover();
                await uniformSizePage.btn_menu(sizes[10].id).click();
                await uniformSizePage.btn_menu_setPosition(sizes[10].id).click();

                await simpleFormPopup.txt_input.fill(String(testSet.testValue));
                await simpleFormPopup.btn_save.click();

                if (testSet.valid) {
                    await expect(simpleFormPopup.err_input).not.toBeVisible();
                } else {
                    await expect(simpleFormPopup.err_input).toBeVisible();
                }
            });
        }
    });

    test('validate delete Size', async () => {
        const deleteModal = t.admin.uniform.size.deleteModal;
        await uniformSizePage.div_size(sizes[0].id).hover();
        await uniformSizePage.btn_menu(sizes[0].id).click();
        await uniformSizePage.btn_menu_delete(sizes[0].id).click();

        await expect(messagePopup.div_popup).toBeVisible();
        await expect
            .soft(messagePopup.div_header)
            .toHaveText(deleteModal.header.replace('{size}', sizes[0].name));
        await expect
            .soft(messagePopup.div_message)
            .toHaveText(deleteModal.message.replace('{size}', sizes[0].name));
        await messagePopup.btn_save.click();
        await expect(uniformSizePage.div_size(sizes[0].id)).not.toBeVisible();
    });
});
