import { expect } from "playwright/test";
import { prisma } from "../../../../src/lib/db";
import { numberValidationTests } from "../../../_playwrightConfig/global/testSets";
import { CreateUniformPage } from "../../../_playwrightConfig/pages/uniform/create/index.page";
import { adminTest } from "../../../_playwrightConfig/setup";
import { StaticData } from "../../../_playwrightConfig/testData/staticDataLoader";

type Fixture = {
    createPage: CreateUniformPage,
}
const year = (+(new Date().getFullYear()) % 100);
const test = adminTest.extend<Fixture>({
    createPage: async ({ page }, use) => use(new CreateUniformPage(page)),
    staticData: async ({ staticData }: { staticData: StaticData }, use: (r: StaticData) => Promise<void>) => {
        const uniformNumbers = [`${year}03`, `${year}04`, `${year}10`, `${year}11`, `${year}12`];
        await prisma.uniform.createMany({
            data: uniformNumbers.map(number => {
                return {
                    number: +number,
                    fk_uniformType: staticData.ids.uniformTypeIds[0]
                }
            })
        });
        await use(staticData);
        await prisma.uniform.deleteMany({
            where: { number: { in: uniformNumbers.map(m => +m), }, }
        });
    }
});
test.beforeEach(async ({ page, createPage }) => {
    await page.goto(`/de/app/uniform/new`)
    await createPage.btn_tab_generateIds.click();
});

test.describe('validate Inputs', () => {
    test('without sizes Input', async ({ createPage: { configurator, generateStep1 }, staticData: { ids } }) => {
        await configurator.sel_type.selectOption(ids.uniformTypeIds[3]);
        await configurator.btn_continue.click();

        await expect(generateStep1.txt_amount_default).toBeVisible();
    });
    test('with sizes Input', async ({ createPage: { configurator, generateStep1 }, staticData: { ids } }) => {
        await test.step('sizelist Liste1', async () => {
            await configurator.sel_type.selectOption(ids.uniformTypeIds[0]);
            await configurator.sel_generation.selectOption(ids.uniformGenerationIds[0]);
            await configurator.btn_continue.click();

            await Promise.all([
                expect.soft(generateStep1.txt_amount_size(ids.sizeIds[5])).toBeVisible(), // 5
                expect.soft(generateStep1.txt_amount_size(ids.sizeIds[10])).toBeHidden(), // 10
                expect.soft(generateStep1.txt_amount_size(ids.sizeIds[16])).toBeHidden(), // Größe16
            ]);
        });
        await test.step('sizelist Liste2', async () => {
            await generateStep1.btn_back.click();
            await configurator.sel_generation.selectOption(ids.uniformGenerationIds[2]);
            await configurator.btn_continue.click();

            await Promise.all([
                expect.soft(generateStep1.txt_amount_size(ids.sizeIds[5])).toBeVisible(), // 5
                expect.soft(generateStep1.txt_amount_size(ids.sizeIds[10])).toBeVisible(), // 10
                expect.soft(generateStep1.txt_amount_size(ids.sizeIds[16])).toBeHidden(), // Größe16
            ]);
        });
        await test.step('sizelist Liste3', async () => {
            await generateStep1.btn_back.click();
            await configurator.sel_generation.selectOption(ids.uniformGenerationIds[3]);
            await configurator.btn_continue.click();

            await Promise.all([
                expect.soft(generateStep1.txt_amount_size(ids.sizeIds[5])).toBeHidden(), // 5
                expect.soft(generateStep1.txt_amount_size(ids.sizeIds[10])).toBeHidden(), // 10
                expect.soft(generateStep1.txt_amount_size(ids.sizeIds[16])).toBeVisible(), // Größe16
            ]);
        });
    });
    test('formValidation', async ({ createPage: { configurator, generateStep1 }, staticData: { ids } }) => {
        await configurator.sel_type.selectOption(ids.uniformTypeIds[3]);
        await configurator.btn_continue.click();

        const tests = numberValidationTests({ min: 1, strict: false, testEmpty: true })
        for (const { testValue, valid } of tests) {
            await test.step(String(testValue), async () => {
                await generateStep1.txt_amount_default.fill(String(testValue));
                if (valid) {
                    await expect.soft(generateStep1.err_amount_default).toBeHidden();
                } else {
                    await expect.soft(generateStep1.err_amount_default).toBeVisible();
                }
            });
        }
    });
    test('max and min Numbers', async ({ createPage: { configurator, generateStep1 }, staticData: { ids } }) => {
        await configurator.sel_type.selectOption(ids.uniformTypeIds[0]);
        await configurator.sel_generation.selectOption(ids.uniformGenerationIds[2]);
        await configurator.btn_continue.click();

        await test.step('over min', async () => {
            await generateStep1.txt_amount_size(ids.sizeIds[5]).fill('1'); // 5
            await generateStep1.txt_amount_size(ids.sizeIds[10]).fill('0'); // 10

            await expect(generateStep1.err_itemCount).toBeHidden();
        });
        await test.step('under min', async () => {
            await generateStep1.txt_amount_size(ids.sizeIds[5]).fill('0'); // 5
            await expect(generateStep1.err_itemCount).toBeVisible();
        });
        await test.step('under max', async () => {
            await generateStep1.txt_amount_size(ids.sizeIds[5]).fill('50'); // 5
            await generateStep1.txt_amount_size(ids.sizeIds[10]).fill('49'); // 10

            await expect(generateStep1.err_itemCount).toBeHidden();
        });
        await test.step('over max', async () => {
            await generateStep1.txt_amount_size(ids.sizeIds[5]).fill('50'); // 5
            await generateStep1.txt_amount_size(ids.sizeIds[10]).fill('50'); // 10

            await expect(generateStep1.err_itemCount).toBeVisible();
        });
        await test.step('over max with negative', async () => {
            await generateStep1.txt_amount_size(ids.sizeIds[5]).fill('101'); // 5
            await generateStep1.txt_amount_size(ids.sizeIds[10]).fill('-4'); // 10

            await expect(generateStep1.err_itemCount).toBeVisible();
        });
    });
});
test('validate Generator nonContinuous', async ({ createPage: { configurator, generateStep1, generateStep2 }, staticData: { ids } }) => {
    await test.step('preparation', async () => {
        await configurator.sel_type.selectOption(ids.uniformTypeIds[0]);
        await configurator.sel_generation.selectOption(ids.uniformGenerationIds[0]);
        await configurator.btn_continue.click();
    });

    await test.step('input', async () => {
        await generateStep1.txt_amount_size(ids.sizeIds[0]).fill('5'); // 0
        await generateStep1.txt_amount_size(ids.sizeIds[1]).fill('6'); // 1
        await generateStep1.sel_continuous.setChecked(false);
        await generateStep1.btn_generate.click();
    });

    await test.step('validation', async () => {
        const size1Numbers = [`${year}00`, `${year}01`, `${year}02`, `${year}05`, `${year}06`];
        const size2Numbers = [`${year}07`, `${year}08`, `${year}09`, `${year}13`, `${year}14`, `${year}15`];

        await Promise.all([
            ...size1Numbers.map((number) =>
                expect
                    .soft(generateStep2.chk_size_number(ids.sizeIds[0], number))
                    .toBeVisible()
            ),
            ...size2Numbers.map((number) =>
                expect
                    .soft(generateStep2.chk_size_number(ids.sizeIds[1], number))
                    .toBeVisible()
            )
        ]);
    });
});
test('validate Generator continuous', async ({ createPage: { configurator, generateStep1, generateStep2 }, staticData: { ids } }) => {
    await test.step('preparation', async () => {
        await configurator.sel_type.selectOption(ids.uniformTypeIds[0]);
        await configurator.sel_generation.selectOption(ids.uniformGenerationIds[0]);
        await configurator.btn_continue.click();
    });

    await test.step('input', async () => {
        await generateStep1.txt_amount_size(ids.sizeIds[0]).fill('6'); // 0
        await generateStep1.txt_amount_size(ids.sizeIds[1]).fill('4'); // 1
        await generateStep1.sel_continuous.setChecked(true);
        await generateStep1.btn_generate.click();
    });

    await test.step('validation', async () => {
        const size1Numbers = [`${year}13`, `${year}14`, `${year}15`, `${year}16`, `${year}17`, `${year}18`];
        const size2Numbers = [`${year}05`, `${year}06`, `${year}07`, `${year}08`];

        await Promise.all([
            ...size1Numbers.map((number) =>
                expect
                    .soft(generateStep2.chk_size_number(ids.sizeIds[0], number))
                    .toBeVisible()
            ),
            ...size2Numbers.map((number) =>
                expect
                    .soft(generateStep2.chk_size_number(ids.sizeIds[1], number))
                    .toBeVisible()
            )
        ]);
    });
});
