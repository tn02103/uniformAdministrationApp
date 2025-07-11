import { expect } from "playwright/test";
import { numberValidationTests } from "../../../_playwrightConfig/global/testSets";
import { CreateUniformPage } from "../../../_playwrightConfig/pages/uniform/create/index.page";
import { adminTest } from "../../../_playwrightConfig/setup";

type Fixture = {
    createPage: CreateUniformPage,
}
const test = adminTest.extend<Fixture>({
    createPage: async ({ page }, use) => use(new CreateUniformPage(page)),
});
test.beforeEach(async ({ page, createPage, staticData: { ids } }) => {
    await page.goto(`/de/app/uniform/new`)
    await createPage.btn_tab_knownIds.click();

    await createPage.configurator.sel_type.selectOption(ids.uniformTypeIds[3]);
    await createPage.configurator.btn_continue.click();
});

test('formValidation', async ({ page, createPage: { numberInput } }) => {
    await test.step('numberStart', async () => {
        const tests = numberValidationTests({ max: 99999999, min: 1, strict: false, testEmpty: true });
        for (const { testValue, valid } of tests) {
            await test.step(String(testValue), async () => {
                await numberInput.txt_numStart.fill(String(testValue));
                await numberInput.btn_numAdd.click();

                if (valid) {
                    await expect.soft(numberInput.err_numStart).toBeHidden();
                } else {
                    await expect.soft(numberInput.err_numStart).toBeVisible();
                }
            });
        }
    });
    await test.step('numberEnd', async () => {
        const tests = numberValidationTests({ max: 99999999, min: 1, strict: false });
        for (const { testValue, valid } of tests) {
            await test.step(String(testValue), async () => {
                await numberInput.txt_numEnd.fill(String(testValue));
                await page.waitForTimeout(20);
                await numberInput.btn_numAdd.click();

                if (valid) {
                    await expect.soft(numberInput.err_numEnd).toBeHidden();
                } else {
                    await expect.soft(numberInput.err_numEnd).toBeVisible();
                }
            });
        }
    });
});
test('validate special validations', async ({ page, createPage: { numberInput, configurator } }) => {
    await test.step('start smaller end', async () => {
        await numberInput.txt_numStart.fill("10");
        await numberInput.txt_numEnd.fill("5");
        await numberInput.btn_numAdd.click();

        await expect(page.locator('.Toastify__toast--error')).toBeVisible();
        await page.locator('.Toastify__close-button').click();
    });
    await test.step('at max amount of numbers', async () => {
        await expect(page.locator('.Toastify__toast--error')).toBeHidden()
        await numberInput.btn_back.click();
        await configurator.btn_continue.click();

        await numberInput.txt_numStart.fill("1");
        await numberInput.txt_numEnd.fill("99");
        await numberInput.btn_numAdd.click();

        await expect(numberInput.div_number(24)).toBeVisible();
    });
    await test.step('over max amount of numbers', async () => {
        await expect(page.locator('.Toastify__toast--error')).toBeHidden()
        await numberInput.btn_back.click();
        await configurator.btn_continue.click();

        await numberInput.txt_numStart.fill("1");
        await numberInput.txt_numEnd.fill("100");
        await numberInput.btn_numAdd.click();

        await expect(page.locator('.Toastify__toast--error')).toBeVisible();
        await page.locator('.Toastify__close-button').click();
    });
    await test.step('over max amount with already added', async () => {
        await expect(page.locator('.Toastify__toast--error')).toBeHidden()
        await numberInput.btn_back.click();
        await configurator.btn_continue.click();

        await numberInput.txt_numStart.fill("1");
        await numberInput.txt_numEnd.fill("50");
        await numberInput.btn_numAdd.click();
        await expect(numberInput.div_number(24)).toBeVisible();

        await numberInput.txt_numStart.fill("100");
        await numberInput.txt_numEnd.fill("180");
        await numberInput.btn_numAdd.click();

        await expect(page.locator('.Toastify__toast--error')).toBeVisible();
        await page.locator('.Toastify__close-button').click();
    });
});

test('validate input', async ({ createPage: { numberInput } }) => {
    await test.step('create single number 1', async () => {
        await numberInput.txt_numStart.fill("1");
        await numberInput.btn_numAdd.click();

        await expect(numberInput.div_number(1)).toBeVisible();
        await expect.soft(numberInput.txt_numStart).toHaveValue("");
    });
    await test.step('create single number 2 using both fields', async () => {
        await numberInput.txt_numStart.fill("2");
        await numberInput.txt_numEnd.fill("2");
        await numberInput.btn_numAdd.click();

        await Promise.all([
            expect(numberInput.div_number(2)).toBeVisible(),
            expect.soft(numberInput.txt_numStart).toHaveValue(""),
            expect.soft(numberInput.txt_numEnd).toHaveValue(""),
        ]);
    });
    await test.step('create single number alread created', async () => {
        await numberInput.txt_numStart.fill("2");
        await numberInput.txt_numEnd.fill("");
        await numberInput.btn_numAdd.click();

        await expect.soft(numberInput.div_number(2)).toBeVisible();
    });
    await test.step('create first batch of numbers', async () => {
        await numberInput.txt_numStart.fill("3");
        await numberInput.txt_numEnd.fill("6");
        await numberInput.btn_numAdd.click();

        await Promise.all([
            ...[3, 4, 5, 6].map(async (value) => {
                await expect(numberInput.div_number(value)).toBeVisible();
            }),
            expect.soft(numberInput.txt_numStart).toHaveValue(""),
            expect.soft(numberInput.txt_numEnd).toHaveValue(""),
        ]);
    });
    await test.step('delete number 4', async () => {
        await numberInput.div_number(4).hover();
        await expect(numberInput.btn_number_remove(4)).toBeVisible();
        await numberInput.btn_number_remove(4).click();
        await expect(numberInput.div_number(4)).toBeHidden();
    });

    await test.step('create seccond batch of numbers', async () => {
        await numberInput.txt_numStart.fill("3");
        await numberInput.txt_numEnd.fill("8");
        await numberInput.btn_numAdd.click();

        await Promise.all(
            [1, 2, 3, 4, 5, 6, 7, 8].map(async (value) => {
                await expect.soft(numberInput.div_number(value)).toBeVisible();
            })
        );
    });
});
