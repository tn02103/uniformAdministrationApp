import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import { CadetUniformComponent } from "../../../_playwrightConfig/pages/cadet/cadetUniform.component";
import { adminTest } from "../../../_playwrightConfig/setup";

type Fixture = {
    uniformComponent: CadetUniformComponent;
}

const test = adminTest.extend<Fixture>({
    uniformComponent: async ({ page }, use) => use(new CadetUniformComponent(page)),
});

test.describe(() => {
    test.beforeEach(async ({ page, staticData: { ids } }) => page.goto(`/de/app/cadet/${ids.cadetIds[1]}`));

    test('different Displaysizes', async ({ page, uniformComponent, staticData: { ids } }) => {
        // Test with Marie Becker, uniform 1184 of Typ1

        await test.step('Displaysize xxl', async () => {
            await page.setViewportSize({ height: 800, width: 1500 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(ids.uniformTypeIds[0])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_open(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_size(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_menu(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_menu_open(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_menu_switch(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_menu_withdraw(ids.uniformIds[0][84])).toBeHidden(),
            ]);
        });
        await test.step('Displaysize xl', async () => {
            await page.setViewportSize({ height: 800, width: 1300 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(ids.uniformTypeIds[0])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_open(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_size(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_menu(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_menu_open(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_menu_switch(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_menu_withdraw(ids.uniformIds[0][84])).toBeHidden(),
            ]);
        });
        await test.step('Displaysize lg', async () => {
            await page.setViewportSize({ height: 800, width: 1000 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(ids.uniformTypeIds[0])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_open(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_size(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_menu(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_menu_open(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_menu_switch(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_menu_withdraw(ids.uniformIds[0][84])).toBeHidden(),
            ]);
        });
        await test.step('Displaysize md', async () => {
            await page.setViewportSize({ height: 800, width: 800 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(ids.uniformTypeIds[0])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_open(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_switch(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.div_uitem_number(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_size(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(ids.uniformIds[0][84])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_menu(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_menu_open(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_menu_switch(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_menu_withdraw(ids.uniformIds[0][84])).toBeHidden(),
            ]);
        });
        await test.step('Displaysize sm', async () => {
            await page.setViewportSize({ height: 800, width: 600 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(ids.uniformTypeIds[0])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_open(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_switch(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84])).toBeHidden(),

                expect.soft(uniformComponent.div_uitem_number(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][84]).getByTestId('div_size')).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(ids.uniformIds[0][84])).toBeHidden(),

                expect.soft(uniformComponent.btn_uitem_menu(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.btn_uitem_menu_open(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_menu_switch(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_menu_withdraw(ids.uniformIds[0][84])).toBeHidden(),
            ]);
        });
        await test.step('Displaysize xs', async () => {
            await page.setViewportSize({ height: 800, width: 500 });

            await Promise.all([
                expect.soft(uniformComponent.div_utype(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toBeVisible(),
                expect.soft(uniformComponent.div_utype_name(ids.uniformTypeIds[0])).toBeVisible(),

                expect.soft(uniformComponent.btn_uitem_open(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_switch(ids.uniformIds[0][84])).toBeHidden(),
                expect.soft(uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84])).toBeHidden(),

                expect.soft(uniformComponent.div_uitem_number(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][84]).getByTestId('div_size')).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_generation(ids.uniformIds[0][84])).toBeVisible(),
                expect.soft(uniformComponent.div_uitem_comment(ids.uniformIds[0][84])).toBeHidden(),
            ]);

            await expect.soft(uniformComponent.btn_uitem_menu(ids.uniformIds[0][84])).toBeVisible();
            await uniformComponent.btn_uitem_menu(ids.uniformIds[0][84]).click();

            await expect.soft(uniformComponent.btn_uitem_menu_open(ids.uniformIds[0][84])).toBeVisible();
            await expect.soft(uniformComponent.btn_uitem_menu_switch(ids.uniformIds[0][84])).toBeVisible();
            await expect.soft(uniformComponent.btn_uitem_menu_withdraw(ids.uniformIds[0][84])).toBeVisible();
        });
    });

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
            deletedTypes.map((type) => expect.soft(uniformComponent.div_utype(type.id)).toBeHidden())
        );
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
                expect.soft(uniformComponent.div_uitem(uitem.id)).toBeHidden()
            )
        );
    });
});
