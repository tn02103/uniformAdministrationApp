import { Page, expect, test } from "playwright/test";
import t from "../../../../public/locales/de";
import { adminAuthFile, inspectorAuthFile, materialAuthFile, userAuthFile } from "../../../auth.setup";
import { getTextColor } from "../../../global/helper";
import { CadetUniformComponent } from "../../../pages/cadet/cadetUniform.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { testAssosiation, testGenerations, testSizes, testUniformIssued, testUniformItems, testUniformTypes } from "../../../testData/staticData";

test.use({ storageState: adminAuthFile });
test.describe('', () => {
    const testdata = {
        cadetId: '0d06427b-3c12-11ee-8084-0068eb8ba754', // Marie Ackerman
        type1Id: '036ff236-3b83-11ee-ab4b-0068eb8ba754',
        type2Id: '0b95e809-3b83-11ee-ab4b-0068eb8ba754',
    }
    let page: Page;
    let uniformComponent: CadetUniformComponent;

    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();
        uniformComponent = new CadetUniformComponent(page);

        await cleanupData();
        await page.goto(`/de/app/cadet/${testdata.cadetId}`);
    });
    test.afterAll(async () => page.close());
    test.beforeEach(async () => {
        if (page.url().endsWith(testdata.cadetId)) {
            await page.reload();
        } else {
            await page.goto(`/de/app/cadet/${testdata.cadetId}`);
        }
    });

    //E2E0207
    test('validate different Displaysizes', async () => {
        // Test with Marie Ackermann, uniform 1184 of Typ1
        const uniformId = '45f35815-3c0d-11ee-8084-0068eb8ba754';

        await test.step('Displaysize xxl', async () => {
            await page.setViewportSize({ height: 800, width: 1500 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(testdata.type1Id)).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(testdata.type1Id)).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_edit(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_open(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(uniformId)).toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_size(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(uniformId)).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_menu(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_open(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_switch(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_withdraw(uniformId)).not.toBeVisible(),
            ]);
        });
        await test.step('Displaysize xl', async () => {
            await page.setViewportSize({ height: 800, width: 1300 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(testdata.type1Id)).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(testdata.type1Id)).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_edit(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_open(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(uniformId)).toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_size(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(uniformId)).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_menu(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_open(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_switch(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_withdraw(uniformId)).not.toBeVisible(),
            ]);
        });
        await test.step('Displaysize lg', async () => {
            await page.setViewportSize({ height: 800, width: 1000 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(testdata.type1Id)).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(testdata.type1Id)).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_edit(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_open(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(uniformId)).toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_size(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(uniformId)).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_menu(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_open(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_switch(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_withdraw(uniformId)).not.toBeVisible(),
            ]);
        });
        await test.step('Displaysize md', async () => {
            await page.setViewportSize({ height: 800, width: 800 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(testdata.type1Id)).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(testdata.type1Id)).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_edit(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_open(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(uniformId)).toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_size(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(uniformId)).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_menu(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_open(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_switch(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_withdraw(uniformId)).not.toBeVisible(),
            ]);
        });
        await test.step('Displaysize sm', async () => {
            await page.setViewportSize({ height: 800, width: 600 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(testdata.type1Id)).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(testdata.type1Id)).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_edit(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_open(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(uniformId)).toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem(uniformId).getByTestId('div_size')).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(uniformId)).not.toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_menu(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_open(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_switch(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_withdraw(uniformId)).not.toBeVisible(),
            ]);
        });
        await test.step('Displaysize xs', async () => {
            await page.setViewportSize({ height: 800, width: 500 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(testdata.type1Id)).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(testdata.type1Id)).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_edit(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_open(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(uniformId)).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(uniformId)).not.toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem(uniformId).getByTestId('div_size')).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(uniformId)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(uniformId)).not.toBeVisible(),
            ]);

            await expect.soft(uniformComponent.btn_uitem_menu(uniformId)).toBeVisible();
            await uniformComponent.btn_uitem_menu(uniformId).click();

            await expect.soft(uniformComponent.btn_uitem_menu_open(uniformId)).toBeVisible();
            await expect.soft(uniformComponent.btn_uitem_menu_switch(uniformId)).toBeVisible();
            await expect.soft(uniformComponent.btn_uitem_menu_withdraw(uniformId)).toBeVisible();
        });
    });

    test.describe('Test uniformType Rows', async () => {
        const defaultTextColor = 'rgb(33, 37, 41)';

        // E2E0208
        test('validate correct sortOrder of the typeRows', async () => {
            const types = testUniformTypes.filter(type => (!type.recdelete && (type.fk_assosiation === testAssosiation.id))).sort((a, b) => a.sortOrder - b.sortOrder);

            for (let i = 0; i < types.length; i++) {
                await expect.soft(uniformComponent.div_typeList.locator('> div').locator(`nth=${i}`)).toHaveAttribute('data-testid', `div_utype_${types[i].id}`);
                await expect.soft(uniformComponent.div_utype_name(types[i].id)).toHaveText(types[i].name);
            }
        });

        // E2E0209
        test('validate deleted Types not shown', async () => {
            const deletedTypes = testUniformTypes.filter(type => type.recdelete);

            await Promise.all(
                deletedTypes.map((type) => expect.soft(uniformComponent.div_utype(type.id)).not.toBeVisible())
            );
        });

        // E2E0210
        test('Check color and text of itemAmount div', async () => {
            await test.step('not enough items: Sven Keller -> Type1', async () => {
                await page.goto(`/de/app/cadet/c4d33a71-3c11-11ee-8084-0068eb8ba754`);
                await expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).toHaveText(`(2 ${t.common.of} 3)`);
                await expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).toHaveClass(/text-orange-500/);
                await expect.soft(await getTextColor(uniformComponent.div_utype_amount(testdata.type1Id))).not.toBe(defaultTextColor);
            });
            await test.step('to many: Antje Fried -> Type1', async () => {
                await page.goto(`/de/app/cadet/0692ae33-3c12-11ee-8084-0068eb8ba754`);
                await expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).toHaveText(`(4 ${t.common.of} 3)`);
                await expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).not.toHaveClass(/text-orange-500/);
                await expect.soft(await getTextColor(uniformComponent.div_utype_amount(testdata.type1Id))).toBe(defaultTextColor);
            });
            await test.step('correct amount: Marie Ackermann -> Type1', async () => {
                await page.goto(`/de/app/cadet/${testdata.cadetId}`);
                await expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).toHaveText(`(3 ${t.common.of} 3)`);
                await expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).not.toHaveClass(/text-orange-500/);
                await expect.soft(await getTextColor(uniformComponent.div_utype_amount(testdata.type1Id))).toBe(defaultTextColor);
            });
            await test.step('correct amount: Marie Ackermann -> Type2', async () => {
                await expect.soft(uniformComponent.div_utype_amount(testdata.type2Id)).toHaveText(`(1 ${t.common.of} 1)`);
                await expect.soft(uniformComponent.div_utype_amount(testdata.type2Id)).not.toHaveClass(/text-orange-500/);
                await expect.soft(await getTextColor(uniformComponent.div_utype_amount(testdata.type2Id))).toBe(defaultTextColor);
            });
        });
    });

    test.describe('Test uniformItem rows', () => {
        const defaultTextColor = 'rgb(33, 37, 41)';

        // E2E0211
        test('validate correct uniformItems are displayed in correct sortOrder', async () => {
            const typeList = testUniformTypes.filter(type => !type.recdelete);
            const uniformItems: any[] = testUniformIssued
                .filter(ui => (ui.fk_cadet === testdata.cadetId && !ui.dateReturned))
                .map(ui => testUniformItems.find(uitem => uitem.id === ui.fk_uniform))

            for (let type of typeList) {
                await test.step(`validate uniformItems for type: ${type.name}`, async () => {
                    const filteredItems = uniformItems.filter(uitem => uitem?.fk_uniformType == type.id).sort((a, b) => a?.number - b?.number);


                    for (let i = 0; i < filteredItems.length; i++) {
                        await expect.soft(uniformComponent.div_uitem(filteredItems[i].id)).toBeVisible();
                        await expect
                            .soft(uniformComponent.div_utype_itemList(type.id).locator('> div').locator(`nth=${i}`))
                            .toHaveAttribute("data-testid", `div_uitem_${filteredItems[i].id}`);
                    }
                });
            }
        });

        // E2E0212
        test('Validate returned items are not shown', async () => {
            const retunedIds = testUniformIssued.filter(ui => (ui.fk_cadet === testdata.cadetId && ui.dateReturned));

            await Promise.all(
                retunedIds.map((uitem) =>
                    expect.soft(uniformComponent.div_uitem(uitem.id)).not.toBeVisible()
                )
            );
        });

        //E2E0213
        test('validate data for uniformItem 1184', async () => {
            const uItem = testUniformItems.find(u => u.id === '45f35815-3c0d-11ee-8084-0068eb8ba754');
            if (!uItem) throw Error("Test Item not found");
            const uGeneration = testGenerations.find(g => g.id === uItem.fk_generation);
            const uSize = testSizes.find(s => s.id === uItem.fk_size);

            await Promise.all([
                expect.soft(uniformComponent.div_uitem(uItem.id)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_number(uItem.id)).toHaveText(uItem.number.toString()),
                expect.soft(uniformComponent.div_uitem_generation(uItem.id)).toHaveText(uGeneration?.name as string),
                expect.soft(uniformComponent.div_uitem_size(uItem.id)).toHaveText(uSize?.name as string),
                expect.soft(uniformComponent.div_uitem_comment(uItem.id)).toHaveText(uItem?.comment as string),
            ]);
        });

        //E2E0214
        test('validate generation hilighting', async () => {
            await test.step('generation not outdated: Marie Ackermann -> 1184', async () => {
                await page.goto(`/de/app/cadet/${testdata.cadetId}`);
                await expect.soft(await getTextColor(uniformComponent.div_uitem_generation('45f35815-3c0d-11ee-8084-0068eb8ba754'))).toBe(defaultTextColor);
            });

            await test.step('generation outdated: Maik Finkel -> 1100', async () => {
                await page.goto('/de/app/cadet/db998c2f-3c11-11ee-8084-0068eb8ba754');
                await expect.soft(await getTextColor(uniformComponent.div_uitem_generation('45f2fdcc-3c0d-11ee-8084-0068eb8ba754'))).not.toBe(defaultTextColor);
            });
        });

        // E2E0215
        test('validate uniformNumber hilighting', async () => {
            await test.step('uniform active: Marie Ackermann -> 1184', async () => {
                await page.goto(`/de/app/cadet/${testdata.cadetId}`);
                await expect.soft(await getTextColor(uniformComponent.div_uitem_number('45f35815-3c0d-11ee-8084-0068eb8ba754'))).toBe(defaultTextColor);
            });
            await test.step('uniform passive: Uwe Luft -> 1121', async () => {
                await page.goto('/de/app/cadet/d468ac3c-3c11-11ee-8084-0068eb8ba754');
                await expect.soft(await getTextColor(uniformComponent.div_uitem_number('45f31e47-3c0d-11ee-8084-0068eb8ba754'))).not.toBe(defaultTextColor);
            });
        });
    });

// E2E0216
    test.describe('Validate different Users', async () => {
        const uniformId = '45f35815-3c0d-11ee-8084-0068eb8ba754'; //1184

        test.describe('Admin', async () => {
            test.use({ storageState: adminAuthFile });
            test('', async ({ page }) => {
                const uniformComponent = new CadetUniformComponent(page);
                await page.goto(`/de/app/cadet/${testdata.cadetId}`);

                await test.step('test', async () => {
                    await Promise.all([
                        expect.soft(uniformComponent.div_utype(testdata.type1Id)).toBeVisible(),
                        expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).toBeVisible(),
                        expect.soft(uniformComponent.div_utype_name(testdata.type1Id)).toBeVisible(),

                        expect.soft(uniformComponent.btn_uitem_edit(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.btn_uitem_open(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.btn_uitem_switch(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.btn_uitem_withdraw(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.div_uitem_number(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.div_uitem_size(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.div_uitem_generation(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.div_uitem_comment(uniformId)).toBeVisible(),
                    ]);

                    await page.setViewportSize({ height: 800, width: 500 });
                    await expect.soft(uniformComponent.btn_uitem_menu(uniformId)).toBeVisible();

                    await uniformComponent.btn_uitem_menu(uniformId).click();
                    await expect.soft(uniformComponent.btn_uitem_menu_open(uniformId)).toBeVisible();
                    await expect.soft(uniformComponent.btn_uitem_menu_switch(uniformId)).toBeVisible();
                    await expect.soft(uniformComponent.btn_uitem_menu_withdraw(uniformId)).toBeVisible();
                });
            });
        });
        test.describe('Material', async () => {
            test.use({ storageState: materialAuthFile });
            test('', async ({ page }) => {
                const uniformComponent = new CadetUniformComponent(page);
                await page.goto(`/de/app/cadet/${testdata.cadetId}`);

                await test.step('test', async () => {
                    await Promise.all([
                        expect.soft(uniformComponent.div_utype(testdata.type1Id)).toBeVisible(),
                        expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).toBeVisible(),
                        expect.soft(uniformComponent.div_utype_name(testdata.type1Id)).toBeVisible(),

                        expect.soft(uniformComponent.btn_uitem_open(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.btn_uitem_edit(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.btn_uitem_switch(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.btn_uitem_withdraw(uniformId)).toBeVisible(),

                        expect.soft(uniformComponent.div_uitem_number(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.div_uitem_size(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.div_uitem_generation(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.div_uitem_comment(uniformId)).toBeVisible(),
                    ]);

                    await page.setViewportSize({ height: 800, width: 500 });
                    await expect.soft(uniformComponent.btn_uitem_menu(uniformId)).toBeVisible();
                    await uniformComponent.btn_uitem_menu(uniformId).click();
                    await expect.soft(uniformComponent.btn_uitem_menu_open(uniformId)).toBeVisible();
                    await expect.soft(uniformComponent.btn_uitem_menu_switch(uniformId)).toBeVisible();
                    await expect.soft(uniformComponent.btn_uitem_menu_withdraw(uniformId)).toBeVisible();
                });
            });
        });
        test.describe('inspector', async () => {
            test.use({ storageState: inspectorAuthFile });
            test('', async ({ page }) => {
                const uniformComponent = new CadetUniformComponent(page);
                await page.goto(`/de/app/cadet/${testdata.cadetId}`);

                await test.step('test', async () => {
                    await Promise.all([
                        expect.soft(uniformComponent.div_utype(testdata.type1Id)).toBeVisible(),
                        expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).toBeVisible(),
                        expect.soft(uniformComponent.div_utype_name(testdata.type1Id)).toBeVisible(),

                        expect.soft(uniformComponent.btn_uitem_open(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.btn_uitem_edit(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.btn_uitem_switch(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.btn_uitem_withdraw(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.div_uitem_number(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.div_uitem_size(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.div_uitem_generation(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.div_uitem_comment(uniformId)).toBeVisible(),
                    ]);


                    await page.setViewportSize({ height: 800, width: 500 });
                    await expect.soft(uniformComponent.btn_uitem_menu(uniformId)).toBeVisible();

                    await uniformComponent.btn_uitem_menu(uniformId).click();
                    await expect.soft(uniformComponent.btn_uitem_menu_open(uniformId)).toBeVisible();
                    await expect.soft(uniformComponent.btn_uitem_menu_switch(uniformId)).toBeVisible();
                    await expect.soft(uniformComponent.btn_uitem_menu_withdraw(uniformId)).toBeVisible();
                });
            });
        });
        test.describe('user', async () => {
            test.use({ storageState: userAuthFile });
            test('', async ({ page }) => {
                const uniformComponent = new CadetUniformComponent(page);
                await page.goto(`/de/app/cadet/${testdata.cadetId}`);

                await test.step('test', async () => {
                    await Promise.all([
                        expect.soft(uniformComponent.div_utype(testdata.type1Id)).toBeVisible(),
                        expect.soft(uniformComponent.div_utype_amount(testdata.type1Id)).toBeVisible(),
                        expect.soft(uniformComponent.div_utype_name(testdata.type1Id)).toBeVisible(),

                        expect.soft(uniformComponent.btn_uitem_open(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.btn_uitem_edit(uniformId)).not.toBeVisible(),
                        expect.soft(uniformComponent.btn_uitem_switch(uniformId)).not.toBeVisible(),
                        expect.soft(uniformComponent.btn_uitem_withdraw(uniformId)).not.toBeVisible(),
                        expect.soft(uniformComponent.div_uitem_number(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.div_uitem_size(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.div_uitem_generation(uniformId)).toBeVisible(),
                        expect.soft(uniformComponent.div_uitem_comment(uniformId)).toBeVisible(),
                    ]);

                    await page.setViewportSize({ height: 800, width: 500 });
                    await expect.soft(uniformComponent.btn_uitem_menu(uniformId)).not.toBeVisible();
                });
            });
        });
    });
});
