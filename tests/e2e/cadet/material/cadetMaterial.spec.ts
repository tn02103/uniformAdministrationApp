import { Page, expect, test } from "playwright/test";
import { adminAuthFile, inspectorAuthFile, userAuthFile } from "../../../auth.setup";
import { defaultTextColor, getTextColor } from "../../../global/helper";
import { CadetMaterialComponent } from "../../../pages/cadet/cadetMaterial.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { testAssosiation, testMaterialGroups, testMaterialIssued, testMaterials } from "../../../testData/staticData";

test.use({ storageState: adminAuthFile });
test.describe('', () => {
    const cadetId = '0d06427b-3c12-11ee-8084-0068eb8ba754'; // Marie Ackerman
    let page: Page;
    let materialComponent: CadetMaterialComponent;

    test.beforeAll(async ({ browser }) => {
        await cleanupData();
        page = await (await browser.newContext()).newPage();
        materialComponent = new CadetMaterialComponent(page);

        await page.goto(`/de/app/cadet/${cadetId}`);
    });
    test.afterAll(() => page.close());
    test.beforeEach(async () => {
        if (page.url().endsWith(cadetId)) {
            await page.reload();
        } else {
            await page.goto(`/de/app/cadet/${cadetId}`);
        }
    })

    test.describe('validate different AuthRoles', async () => {
        const groupId = '4b8b8b36-3c03-11ee-8084-0068eb8ba754'; // Gruppe 1
        const typeId = 'acda1cc8-3c03-11ee-8084-0068eb8ba754'; // Type 1-3

        test.describe('Inspector', async () => {
            test.use({ storageState: inspectorAuthFile });
            test('', async ({ page }) => {
                const cadetMaterialComponent = new CadetMaterialComponent(page);
                await page.goto(`/de/app/cadet/${cadetId}`);

                await test.step('test', async () => {
                    await Promise.all([
                        // div
                        expect.soft(cadetMaterialComponent.div_group(groupId)).toBeVisible(),
                        expect.soft(cadetMaterialComponent.div_group_name(groupId)).toBeVisible(),
                        expect.soft(cadetMaterialComponent.div_material(typeId)).toBeVisible(),
                        expect.soft(cadetMaterialComponent.div_material_name(typeId)).toBeVisible(),
                        expect.soft(cadetMaterialComponent.div_material_issued(typeId)).toBeVisible(),
                        // btn
                        expect.soft(cadetMaterialComponent.btn_group_issue(groupId)).toBeVisible(),
                        expect.soft(cadetMaterialComponent.btn_material_return(typeId)).toBeVisible(),
                        expect.soft(cadetMaterialComponent.btn_material_switch(typeId)).toBeVisible(),
                    ]);
                });
            });
        });
        test.describe('User', async () => {
            test.use({ storageState: userAuthFile });
            test('', async ({ page }) => {
                const cadetMaterialComponent = new CadetMaterialComponent(page);
                await page.goto(`/de/app/cadet/${cadetId}`);

                await test.step('test', async () => {
                    await Promise.all([
                        // div
                        expect.soft(cadetMaterialComponent.div_group(groupId)).toBeVisible(),
                        expect.soft(cadetMaterialComponent.div_group_name(groupId)).toBeVisible(),
                        expect.soft(cadetMaterialComponent.div_material(typeId)).toBeVisible(),
                        expect.soft(cadetMaterialComponent.div_material_name(typeId)).toBeVisible(),
                        expect.soft(cadetMaterialComponent.div_material_issued(typeId)).toBeVisible(),
                        // btn
                        expect.soft(cadetMaterialComponent.btn_group_issue(groupId)).not.toBeVisible(),
                        expect.soft(cadetMaterialComponent.btn_material_return(typeId)).not.toBeVisible(),
                        expect.soft(cadetMaterialComponent.btn_material_switch(typeId)).not.toBeVisible(),
                    ]);
                });
            });
        });
    });


    test.describe('validate MarterialGroupRows', async () => {
        test('validate sortOrder', async () => {
            const groupList = testMaterialGroups
                .filter(g => (!g.recdelete && (g.fk_assosiation === testAssosiation.id)))
                .sort((a, b) => a.sortOrder - b.sortOrder);

            for (let i = 0; i < groupList.length; i++) {
                await expect
                    .soft(materialComponent
                        .div_groupList
                        .locator('> div')
                        .locator(`nth=${i}`))
                    .toHaveAttribute('data-testid', `div_matGroup_${groupList[i].id}`);
                await expect
                    .soft(materialComponent
                        .div_groupList
                        .locator('> div')
                        .locator(`nth=${i}`)
                        .getByTestId('div_groupName'))
                    .toHaveText(groupList[i].description);
            }
        });
        test('validate deleted Groups', async () => {
            const groupList = testMaterialGroups
                .filter(g => g.recdelete)
                .sort((a, b) => a.sortOrder - b.sortOrder);

            await Promise.all(
                groupList.map(
                    (group) => expect.soft(materialComponent.div_group(group.id)).not.toBeVisible()
                )
            );
        });

        test('validate btn_issued dissabled', async () => {
            await expect
                .soft(materialComponent.btn_group_issue('d87d81f3-3c03-11ee-8084-0068eb8ba754'))
                .toBeDisabled();
        });

        test('validate div_groupName highlighting', async () => {
            const groupId2 = 'b9a6c18d-3c03-11ee-8084-0068eb8ba754';
            const groupId3 = 'd87d81f3-3c03-11ee-8084-0068eb8ba754';

            await test.step('one item', async () => {
                await page.goto('/de/app/cadet/0d06427b-3c12-11ee-8084-0068eb8ba754'); //Marie Ackerman
                await expect
                    .soft(materialComponent.div_group_name(groupId2))
                    .not
                    .toHaveClass(/text-danger/);
                await expect
                    .soft(await getTextColor(materialComponent.div_group_name(groupId2)))
                    .toBe(defaultTextColor);
            });

            await test.step('no items', async () => {
                await page.goto('/de/app/cadet/c4d33a71-3c11-11ee-8084-0068eb8ba754'); //Sven Keller
                await expect
                    .soft(materialComponent.div_group_name(groupId2))
                    .not
                    .toHaveClass(/text-danger/);
                await expect
                    .soft(await getTextColor(materialComponent.div_group_name(groupId2)))
                    .toBe(defaultTextColor);
            });

            await test.step('multiple not allowed', async () => {
                await page.goto('/de/app/cadet/0692ae33-3c12-11ee-8084-0068eb8ba754'); //Antje Fried
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

    test.describe('validate MarterialItemRows', () => {

        test('validate issued Material sortOrder and displayed data', async () => {
            const issuedMaterials = testMaterialIssued
                .filter(mi => mi.fk_cadet === cadetId && !mi.dateReturned)
                .map(mi => {
                    return {
                        quantity: mi.quantity,
                        ...testMaterials.find(m => m.id === mi.fk_material)
                    }
                });

            for (const group of testMaterialGroups) {
                const typeListLocator = materialComponent
                    .div_group(group.id)
                    .getByTestId('div_typeList')
                    .locator('> div');
                const materiaList = issuedMaterials
                    .filter(mi => mi.fk_materialGroup === group.id)
                    .sort((a, b) => ((a.sortOrder as number) - (b.sortOrder as number)));

                for (let i = 0; i < materiaList.length; i++) {
                    await expect
                        .soft(typeListLocator.locator(`nth=${i}`))
                        .toHaveAttribute('data-testid', `div_material_${materiaList[i].id}`);
                    await expect
                        .soft(typeListLocator.locator(`nth=${i}`).getByTestId('div_name'))
                        .toHaveText(materiaList[i].typename as string);
                    await expect
                        .soft(typeListLocator.locator(`nth=${i}`).getByTestId('div_issued'))
                        .toHaveText(materiaList[i].quantity.toString());
                }
            }
        });
        test('validate returned material', async () => {
            const returnedMaterial = testMaterialIssued.filter(mi => mi.fk_cadet === cadetId && mi.dateReturned);

            await Promise.all(
                returnedMaterial.map(
                    (material) => expect.soft(materialComponent.div_material(material.id)).not.toBeVisible()
                )
            );
        });

        test('validate issued label highlighting', async () => {
            await page.goto('/de/app/cadet/0692ae33-3c12-11ee-8084-0068eb8ba754'); //Antje Fried

            await test.step('correct amount', async () => {
                const materialId = 'd08d5c61-3c03-11ee-8084-0068eb8ba754'; // Typ2-2
                await expect
                    .soft(materialComponent.div_material(materialId))
                    .toBeVisible();
                await expect
                    .soft(materialComponent.div_material_issued(materialId))
                    .toHaveText("4");
                await expect
                    .soft(await getTextColor(materialComponent.div_material_issued(materialId)))
                    .toBe(defaultTextColor);
            });
            await test.step('to little', async () => {
                const materialId = 'cadbd92f-3c03-11ee-8084-0068eb8ba754'; // Typ2-1
                await expect
                    .soft(materialComponent.div_material(materialId))
                    .toBeVisible();
                await expect
                    .soft(materialComponent.div_material_issued(materialId))
                    .toHaveText("2");
                await expect
                    .soft(materialComponent.div_material_issued(materialId))
                    .toHaveClass(/text-warning/);
                await expect
                    .soft(await getTextColor(materialComponent.div_material_issued(materialId)))
                    .not
                    .toBe(defaultTextColor);
            });
            await test.step('to many', async () => {
                const materialId = 'd652732e-3c03-11ee-8084-0068eb8ba754'; // Typ2-3
                await expect
                    .soft(materialComponent.div_material(materialId))
                    .toBeVisible();
                await expect
                    .soft(materialComponent.div_material_issued(materialId))
                    .toHaveText("7");
                await expect
                    .soft(materialComponent.div_material_issued(materialId))
                    .toHaveClass(/text-warning/);
                await expect
                    .soft(await getTextColor(materialComponent.div_material_issued(materialId)))
                    .not
                    .toBe(defaultTextColor);
            });
        });
    });
});
