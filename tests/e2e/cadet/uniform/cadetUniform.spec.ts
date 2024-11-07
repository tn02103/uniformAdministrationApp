import { prisma } from "@/lib/db";
import { UniformType } from "@prisma/client";
import { expect } from "playwright/test";
import t from "../../../../public/locales/de";
import { adminTest, inspectorTest, managerTest, userTest } from "../../../_playwrightConfig/setup";
import { getTextColor } from "../../../_playwrightConfig/global/helper";
import { CadetUniformComponent } from "../../../_playwrightConfig/pages/cadet/cadetUniform.component";

type Fixture = {
    uniformComponent: CadetUniformComponent;
}

const test = adminTest.extend<Fixture>({
    uniformComponent: async ({ page }, use) => use(new CadetUniformComponent(page)),
});

test.describe(() => {
    test.beforeEach(async ({ page, staticData: { ids } }) => page.goto(`/de/app/cadet/${ids.cadetIds[1]}`));

    test('Test different Displaysizes', async ({ page, uniformComponent, staticData: { ids } }) => {
        // Test with Marie Becker, uniform 1184 of Typ1

        await test.step('Displaysize xxl', async () => {
            await page.setViewportSize({ height: 800, width: 1500 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(ids.uniformTypeIds[0])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_edit(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_open(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_size(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_menu(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_open(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_switch(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_withdraw(ids.uniformIds[0][84])).not.toBeVisible(),
            ]);
        });
        await test.step('Displaysize xl', async () => {
            await page.setViewportSize({ height: 800, width: 1300 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(ids.uniformTypeIds[0])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_edit(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_open(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_size(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_menu(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_open(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_switch(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_withdraw(ids.uniformIds[0][84])).not.toBeVisible(),
            ]);
        });
        await test.step('Displaysize lg', async () => {
            await page.setViewportSize({ height: 800, width: 1000 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(ids.uniformTypeIds[0])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_edit(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_open(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_size(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_menu(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_open(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_switch(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_withdraw(ids.uniformIds[0][84])).not.toBeVisible(),
            ]);
        });
        await test.step('Displaysize md', async () => {
            await page.setViewportSize({ height: 800, width: 800 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(ids.uniformTypeIds[0])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_edit(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_open(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_size(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_menu(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_open(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_switch(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_withdraw(ids.uniformIds[0][84])).not.toBeVisible(),
            ]);
        });
        await test.step('Displaysize sm', async () => {
            await page.setViewportSize({ height: 800, width: 600 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(ids.uniformTypeIds[0])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_edit(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_open(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][84]).getByTestId('div_size')).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(ids.uniformIds[0][84])).not.toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_menu(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_open(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_switch(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_withdraw(ids.uniformIds[0][84])).not.toBeVisible(),
            ]);
        });
        await test.step('Displaysize xs', async () => {
            await page.setViewportSize({ height: 800, width: 500 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(ids.uniformTypeIds[0])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_edit(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_open(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(ids.uniformIds[0][84])).not.toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84])).not.toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][84]).getByTestId('div_size')).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(ids.uniformIds[0][84])).not.toBeVisible(),
            ]);

            await expect.soft(uniformComponent.btn_uitem_menu(ids.uniformIds[0][84])).toBeVisible();
            await uniformComponent.btn_uitem_menu(ids.uniformIds[0][84]).click();

            await expect.soft(uniformComponent.btn_uitem_menu_open(ids.uniformIds[0][84])).toBeVisible();
            await expect.soft(uniformComponent.btn_uitem_menu_switch(ids.uniformIds[0][84])).toBeVisible();
            await expect.soft(uniformComponent.btn_uitem_menu_withdraw(ids.uniformIds[0][84])).toBeVisible();
        });
    });
    test.describe('Test uniformType Rows', async () => {
        const defaultTextColor = 'rgb(33, 37, 41)';

        test('validate correct sortOrder of the typeRows', async ({ uniformComponent, staticData: { data } }) => {
            const types = data.uniformTypes.filter(type => !type.recdelete).sort((a, b) => a.sortOrder - b.sortOrder);

            for (let i = 0; i < types.length; i++) {
                await expect.soft(uniformComponent.div_typeList.locator('> div').locator(`nth=${i}`)).toHaveAttribute('data-testid', `div_utype_${types[i].id}`);
                await expect.soft(uniformComponent.div_utype_name(types[i].id)).toHaveText(types[i].name);
            }
        });

        test('validate deleted Types not shown', async ({ uniformComponent, staticData: { data } }) => {
            const deletedTypes = data.uniformTypes.filter(type => type.recdelete);

            await Promise.all(
                deletedTypes.map((type) => expect.soft(uniformComponent.div_utype(type.id)).not.toBeVisible())
            );
        });

        test('Check color and text of itemAmount div', async ({ page, uniformComponent, staticData: { ids } }) => {
            await test.step('not enough items: Sven Keller -> Type1', async () => {
                await page.goto(`/de/app/cadet/${ids.cadetIds[2]}`);
                await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toHaveText(`(2 ${t.common.of} 3)`);
                await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toHaveClass(/text-orange-500/);
                await expect.soft(await getTextColor(uniformComponent.div_utype_amount(ids.uniformTypeIds[0]))).not.toBe(defaultTextColor);
            });
            await test.step('to many: Antje Fried -> Type1', async () => {
                await page.goto(`/de/app/cadet/${ids.cadetIds[0]}`);
                await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toHaveText(`(4 ${t.common.of} 3)`);
                await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).not.toHaveClass(/text-orange-500/);
                await expect.soft(await getTextColor(uniformComponent.div_utype_amount(ids.uniformTypeIds[0]))).toBe(defaultTextColor);
            });
            await test.step('correct amount: Marie Becker -> Type1', async () => {
                await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`);
                await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toHaveText(`(3 ${t.common.of} 3)`);
                await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).not.toHaveClass(/text-orange-500/);
                await expect.soft(await getTextColor(uniformComponent.div_utype_amount(ids.uniformTypeIds[0]))).toBe(defaultTextColor);
            });
            await test.step('correct amount: Marie Becker -> Type2', async () => {
                await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[1])).toHaveText(`(1 ${t.common.of} 1)`);
                await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[1])).not.toHaveClass(/text-orange-500/);
                await expect.soft(await getTextColor(uniformComponent.div_utype_amount(ids.uniformTypeIds[1]))).toBe(defaultTextColor);
            });
        });
    });

    test.describe('Test uniformItem rows', () => {
        const defaultTextColor = 'rgb(33, 37, 41)';

        test('validate correct uniformItems are displayed in correct sortOrder', async ({ uniformComponent, staticData: { ids, data } }) => {
            const uniformItems: any[] = await prisma.uniform.findMany({
                where: {
                    issuedEntries: {
                        some: {
                            fk_cadet: ids.cadetIds[1],
                            dateReturned: null
                        }
                    }
                }
            });

            for (let type of data.uniformTypes) {
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

        test('Validate returned items are not shown', async ({ uniformComponent, staticData: { ids } }) => {
            const retunedIds = await prisma.uniform.findMany({
                where: {
                    issuedEntries: {
                        some: {
                            fk_cadet: ids.cadetIds[1],
                            NOT: { dateReturned: null }
                        }
                    }
                }
            });

            await Promise.all(
                retunedIds.map((uitem) =>
                    expect.soft(uniformComponent.div_uitem(uitem.id)).not.toBeVisible()
                )
            );
        });

        test('validate data for uniformItem 1184', async ({ uniformComponent, staticData: { ids } }) => {
            const uItem = await prisma.uniform.findUniqueOrThrow({
                where: { id: ids.uniformIds[0][84] },
                include: {
                    generation: true,
                    size: true,
                },
            });

            await Promise.all([
                expect.soft(uniformComponent.div_uitem(uItem.id)).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_number(uItem.id)).toHaveText(uItem.number.toString()),
                expect.soft(uniformComponent.div_uitem_generation(uItem.id)).toHaveText(uItem.generation?.name as string),
                expect.soft(uniformComponent.div_uitem_size(uItem.id)).toHaveText(uItem.size?.name as string),
                expect.soft(uniformComponent.div_uitem_comment(uItem.id)).toHaveText(uItem.comment as string),
            ]);
        });

        test('validate generation hilighting', async ({ page, uniformComponent, staticData: { ids } }) => {
            await test.step('generation not outdated: Marie Becker -> 1184', async () => {
                await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`);
                await expect.soft(await getTextColor(uniformComponent.div_uitem_generation(ids.uniformIds[0][84]))).toBe(defaultTextColor);
            });

            await test.step('generation outdated: Maik Finkel -> 1100', async () => {
                await page.goto(`/de/app/cadet/${ids.cadetIds[5]}`);
                await expect.soft(await getTextColor(uniformComponent.div_uitem_generation(ids.uniformIds[0][0]))).not.toBe(defaultTextColor);
            });
        });

        test('validate uniformNumber hilighting', async ({ page, uniformComponent, staticData: { ids } }) => {
            await test.step('uniform active: Marie Becker -> 1184', async () => {
                await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`);
                await expect.soft(await getTextColor(uniformComponent.div_uitem_number(ids.uniformIds[0][84]))).toBe(defaultTextColor);
            });
            await test.step('uniform passive: Uwe Luft -> 1121', async () => {
                await page.goto(`/de/app/cadet/${ids.cadetIds[4]}`);
                await expect.soft(await getTextColor(uniformComponent.div_uitem_number(ids.uniformIds[0][21]))).not.toBe(defaultTextColor);
            });
        });
    });
});

managerTest('validate Authroles: manager', async ({ page, staticData: { ids } }) => {
    const uniformComponent = new CadetUniformComponent(page);
    await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`);

    await Promise.all([
        expect.soft(uniformComponent.div_utype(ids.uniformTypeIds[0])).toBeVisible(),
        expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toBeVisible(),
        expect.soft(uniformComponent.div_utype_name(ids.uniformTypeIds[0])).toBeVisible(),

        expect.soft(uniformComponent.btn_uitem_open(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.btn_uitem_edit(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.btn_uitem_switch(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84])).toBeVisible(),

        expect.soft(uniformComponent.div_uitem_number(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.div_uitem_size(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.div_uitem_generation(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.div_uitem_comment(ids.uniformIds[0][84])).toBeVisible(),
    ]);

    await page.setViewportSize({ height: 800, width: 500 });
    await expect.soft(uniformComponent.btn_uitem_menu(ids.uniformIds[0][84])).toBeVisible();
    await uniformComponent.btn_uitem_menu(ids.uniformIds[0][84]).click();
    await expect.soft(uniformComponent.btn_uitem_menu_open(ids.uniformIds[0][84])).toBeVisible();
    await expect.soft(uniformComponent.btn_uitem_menu_switch(ids.uniformIds[0][84])).toBeVisible();
    await expect.soft(uniformComponent.btn_uitem_menu_withdraw(ids.uniformIds[0][84])).toBeVisible();
});

inspectorTest('validate Authroles: inspector', async ({ page, staticData: { ids }
}) => {
    const uniformComponent = new CadetUniformComponent(page);
    await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`);

    await Promise.all([
        expect.soft(uniformComponent.div_utype(ids.uniformTypeIds[0])).toBeVisible(),
        expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toBeVisible(),
        expect.soft(uniformComponent.div_utype_name(ids.uniformTypeIds[0])).toBeVisible(),

        expect.soft(uniformComponent.btn_uitem_open(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.btn_uitem_edit(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.btn_uitem_switch(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.div_uitem_number(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.div_uitem_size(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.div_uitem_generation(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.div_uitem_comment(ids.uniformIds[0][84])).toBeVisible(),
    ]);


    await page.setViewportSize({ height: 800, width: 500 });
    await expect.soft(uniformComponent.btn_uitem_menu(ids.uniformIds[0][84])).toBeVisible();

    await uniformComponent.btn_uitem_menu(ids.uniformIds[0][84]).click();
    await expect.soft(uniformComponent.btn_uitem_menu_open(ids.uniformIds[0][84])).toBeVisible();
    await expect.soft(uniformComponent.btn_uitem_menu_switch(ids.uniformIds[0][84])).toBeVisible();
    await expect.soft(uniformComponent.btn_uitem_menu_withdraw(ids.uniformIds[0][84])).toBeVisible();

});
userTest('validate Authroles: user', async ({ page, staticData: { ids } }) => {
    const uniformComponent = new CadetUniformComponent(page);
    await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`);

    await Promise.all([
        expect.soft(uniformComponent.div_utype(ids.uniformTypeIds[0])).toBeVisible(),
        expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toBeVisible(),
        expect.soft(uniformComponent.div_utype_name(ids.uniformTypeIds[0])).toBeVisible(),

        expect.soft(uniformComponent.btn_uitem_open(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.btn_uitem_edit(ids.uniformIds[0][84])).not.toBeVisible(),
        expect.soft(uniformComponent.btn_uitem_switch(ids.uniformIds[0][84])).not.toBeVisible(),
        expect.soft(uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84])).not.toBeVisible(),
        expect.soft(uniformComponent.div_uitem_number(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.div_uitem_size(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.div_uitem_generation(ids.uniformIds[0][84])).toBeVisible(),
        expect.soft(uniformComponent.div_uitem_comment(ids.uniformIds[0][84])).toBeVisible(),
    ]);

    await page.setViewportSize({ height: 800, width: 500 });
    await expect.soft(uniformComponent.btn_uitem_menu(ids.uniformIds[0][84])).not.toBeVisible();
});
