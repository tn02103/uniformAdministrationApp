import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import { adminTest, inspectorTest, userTest } from "../../../auth.setup";
import { defaultTextColor, getTextColor } from "../../../global/helper";
import { CadetMaterialComponent } from "../../../pages/cadet/cadetMaterial.component";

type Fixture = {
    materialComponent: CadetMaterialComponent;
}
const test = adminTest.extend<Fixture>({
    materialComponent: async ({ page }, use) => use(new CadetMaterialComponent(page)),
});

inspectorTest('Authroles: Inspector', async ({ page, staticData: { ids } }) => {
    const cadetMaterialComponent = new CadetMaterialComponent(page);
    await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`);

    await test.step('test', async () => {
        await Promise.all([
            // div
            expect.soft(cadetMaterialComponent.div_group(ids.materialGroupIds[1])).toBeVisible(),
            expect.soft(cadetMaterialComponent.div_group_name(ids.materialGroupIds[1])).toBeVisible(),
            expect.soft(cadetMaterialComponent.div_material(ids.materialIds[2])).toBeVisible(),
            expect.soft(cadetMaterialComponent.div_material_name(ids.materialIds[2])).toBeVisible(),
            expect.soft(cadetMaterialComponent.div_material_issued(ids.materialIds[2])).toBeVisible(),
            // btn
            expect.soft(cadetMaterialComponent.btn_group_issue(ids.materialGroupIds[1])).toBeVisible(),
            expect.soft(cadetMaterialComponent.btn_material_return(ids.materialIds[2])).toBeVisible(),
            expect.soft(cadetMaterialComponent.btn_material_switch(ids.materialIds[2])).toBeVisible(),
        ]);
    });
});

userTest('Authroles: User', async ({ page, staticData: { ids } }) => {
    const cadetMaterialComponent = new CadetMaterialComponent(page);
    await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`);

    await test.step('test', async () => {
        await Promise.all([
            // div
            expect.soft(cadetMaterialComponent.div_group(ids.materialGroupIds[1])).toBeVisible(),
            expect.soft(cadetMaterialComponent.div_group_name(ids.materialGroupIds[1])).toBeVisible(),
            expect.soft(cadetMaterialComponent.div_material(ids.materialIds[2])).toBeVisible(),
            expect.soft(cadetMaterialComponent.div_material_name(ids.materialIds[2])).toBeVisible(),
            expect.soft(cadetMaterialComponent.div_material_issued(ids.materialIds[2])).toBeVisible(),
            // btn
            expect.soft(cadetMaterialComponent.btn_group_issue(ids.materialGroupIds[1])).not.toBeVisible(),
            expect.soft(cadetMaterialComponent.btn_material_return(ids.materialIds[2])).not.toBeVisible(),
            expect.soft(cadetMaterialComponent.btn_material_switch(ids.materialIds[2])).not.toBeVisible(),
        ]);
    });
});


test.describe(async () => {
    test.beforeEach(async ({ page, staticData }) => {
        await page.goto(`/de/app/cadet/${staticData.ids.cadetIds[1]}`);
    });

    test('validate MarterialGroupRows', async ({ page, materialComponent, staticData: { ids } }) => {
        await test.step('sortOrder', async () => {
            expect(page.locator('div[data-testid^="div_matGroup_"]')).toHaveCount(3);

            const divList = await page.locator('div[data-testid^="div_matGroup_"]').all()
            expect.soft(divList[0]).toHaveAttribute('data-testid', `div_matGroup_${ids.materialGroupIds[0]}`);
            expect.soft(divList[0].getByTestId('div_groupName')).toHaveText('Gruppe1');
            expect.soft(divList[1]).toHaveAttribute('data-testid', `div_matGroup_${ids.materialGroupIds[1]}`);
            expect.soft(divList[1].getByTestId('div_groupName')).toHaveText('Gruppe2');
            expect.soft(divList[2]).toHaveAttribute('data-testid', `div_matGroup_${ids.materialGroupIds[2]}`);
            expect.soft(divList[2].getByTestId('div_groupName')).toHaveText('Gruppe3');
        });
        await test.step('deleted', async () => {
            expect(materialComponent.div_group(ids.materialGroupIds[3])).not.toBeVisible();
        });

        await test.step('validate btn_issued dissabled', async () => {
            await expect
                .soft(materialComponent.btn_group_issue(ids.materialGroupIds[2]))
                .toBeDisabled();
        });

        await test.step('validate div_groupName highlighting', async () => {
            const groupId2 = ids.materialGroupIds[1];
            const groupId3 = ids.materialGroupIds[2];

            await test.step('one item', async () => {
                //Marie Becker
                await expect
                    .soft(materialComponent.div_group_name(groupId2))
                    .not
                    .toHaveClass(/text-danger/);
                await expect
                    .soft(await getTextColor(materialComponent.div_group_name(groupId2)))
                    .toBe(defaultTextColor);
            });

            await test.step('no items', async () => {
                await page.goto(`/de/app/cadet/${ids.cadetIds[2]}`); //Sven Keller
                await expect
                    .soft(materialComponent.div_group_name(groupId2))
                    .not
                    .toHaveClass(/text-danger/);
                await expect
                    .soft(await getTextColor(materialComponent.div_group_name(groupId2)))
                    .toBe(defaultTextColor);
            });

            await test.step('multiple not allowed', async () => {
                await page.goto(`/de/app/cadet/${ids.cadetIds[0]}`); //Antje Fried
                await expect
                    .soft(materialComponent.div_group_name(groupId2))
                    .toHaveClass(/text-danger/);
                await expect
                    .soft(await getTextColor(materialComponent.div_group_name(groupId2)))
                    .not
                    .toBe(defaultTextColor);
            });

            await test.step('multiple allowed', async () => {
                await expect
                    .soft(materialComponent.div_group_name(groupId3))
                    .not
                    .toHaveClass(/text-danger/);
                await expect
                    .soft(await getTextColor(materialComponent.div_group_name(groupId3)))
                    .toBe(defaultTextColor);
            });
        });
    });

    test('validate MarterialItemRows', async ({ page, materialComponent, staticData: { ids, fk_assosiation } }) => {
        await test.step('validate issued Material sortOrder and displayed data', async () => {
            const materialList = await prisma.material.findMany({
                where: {
                    issuedEntrys: {
                        some: {
                            fk_cadet: ids.cadetIds[1],
                            dateReturned: null,
                        },
                    },
                },
                include: {
                    issuedEntrys: {
                        where: {
                            dateReturned: null,
                            fk_cadet: ids.cadetIds[1],
                        },
                    },
                },
            });
            const groupList = await prisma.materialGroup.findMany({
                where: { fk_assosiation, recdelete: null }
            });

            for (const group of groupList) {
                const typeListLocator = materialComponent
                    .div_group(group.id)
                    .getByTestId('div_typeList')
                    .locator('> div');
                const materiaListByGroup = materialList
                    .filter(mi => mi.fk_materialGroup === group.id)
                    .sort((a, b) => ((a.sortOrder as number) - (b.sortOrder as number)));
                    
                    for (let i = 0; i < materiaListByGroup.length; i++) {
                    await expect
                        .soft(typeListLocator.locator(`nth=${i}`))
                        .toHaveAttribute('data-testid', `div_material_${materiaListByGroup[i].id}`);
                    await expect
                        .soft(typeListLocator.locator(`nth=${i}`).getByTestId('div_name'))
                        .toHaveText(materiaListByGroup[i].typename as string);
                    await expect
                        .soft(typeListLocator.locator(`nth=${i}`).getByTestId('div_issued'))
                        .toHaveText(materiaListByGroup[i].issuedEntrys[0].quantity.toString());
                }
            }
        });
        await test.step('validate returned material', async () => {
            await expect.soft(materialComponent.div_material(ids.materialIds[0])).not.toBeVisible();
            await expect.soft(materialComponent.div_material(ids.materialIds[4])).not.toBeVisible();
        });

        await test.step('validate issued label highlighting', async () => {
            await page.goto(`/de/app/cadet/${ids.cadetIds[0]}`); //Antje Fried

            await test.step('correct amount', async () => { // Typ2-2
                await expect
                    .soft(materialComponent.div_material(ids.materialIds[5]))
                    .toBeVisible();
                await expect
                    .soft(materialComponent.div_material_issued(ids.materialIds[5]))
                    .toHaveText("4");
                await expect
                    .soft(await getTextColor(materialComponent.div_material_issued(ids.materialIds[5])))
                    .toBe(defaultTextColor);
            });
            await test.step('to little', async () => { // Typ2-1
                await expect
                    .soft(materialComponent.div_material(ids.materialIds[4]))
                    .toBeVisible();
                await expect
                    .soft(materialComponent.div_material_issued(ids.materialIds[4]))
                    .toHaveText("2");
                await expect
                    .soft(materialComponent.div_material_issued(ids.materialIds[4]))
                    .toHaveClass(/text-warning/);
                await expect
                    .soft(await getTextColor(materialComponent.div_material_issued(ids.materialIds[4])))
                    .not
                    .toBe(defaultTextColor);
            });
            await test.step('to many', async () => { // Typ2-3
                await expect
                    .soft(materialComponent.div_material(ids.materialIds[6]))
                    .toBeVisible();
                await expect
                    .soft(materialComponent.div_material_issued(ids.materialIds[6]))
                    .toHaveText("7");
                await expect
                    .soft(materialComponent.div_material_issued(ids.materialIds[6]))
                    .toHaveClass(/text-warning/);
                await expect
                    .soft(await getTextColor(materialComponent.div_material_issued(ids.materialIds[6])))
                    .not
                    .toBe(defaultTextColor);
            });
        });
    });
});
