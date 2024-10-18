import { prisma } from "@/lib/db";
import { Locator, expect } from "playwright/test";
import t from "../../../../public/locales/de";
import { numberValidationTests } from "../../../_playwrightConfig/global/testSets";
import { CadetMaterialComponent } from "../../../_playwrightConfig/pages/cadet/cadetMaterial.component";
import { PopupComponent } from "../../../_playwrightConfig/pages/popups/Popup.component";
import { adminTest } from "../../../_playwrightConfig/setup";

type Fixture = {
    materialComponent: CadetMaterialComponent;
    popupComponent: PopupComponent & {
        sel_type: Locator;
        txt_issued: Locator;
        err_issued: Locator;
    }
}
const test = adminTest.extend<Fixture>({
    materialComponent: async ({ page }, use) => use(new CadetMaterialComponent(page)),
    popupComponent: async ({ page }, use) => {
        const comp = new PopupComponent(page);
        use({
            ...comp,
            sel_type: comp.div_popup.locator('select[name="typeId"]'),
            txt_issued: comp.div_popup.locator('input[name="issued"]'),
            err_issued: comp.div_popup.getByTestId('err_issued'),
        });
    }
});

test.afterEach(async ({ staticData: { cleanup } }) => {
    cleanup.materialIssued();
});

test.describe(async () => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    test.beforeEach(async ({ page, staticData }) => {
        await page.goto(`/de/app/cadet/${staticData.ids.cadetIds[1]}`);
    });
    const dbIssuedCheck = async (fk_material: string, fk_cadet: string, quantity: number) => {
        const issued = await prisma.materialIssued.findMany({
            where: { fk_material, fk_cadet }
        });

        expect(issued).toHaveLength(1);
        expect(issued[0].dateIssued.getTime() / 1000000).toBeCloseTo(new Date().getTime() / 1000000, 1);
        expect(issued[0].dateReturned).toBeNull();
        expect(issued[0].quantity).toBe(quantity);
    }
    const dbReturnedCheck = async (fk_material: string, fk_cadet: string, quantity: number) => {
        const issued = await prisma.materialIssued.findMany({
            where: { fk_material, fk_cadet }
        });

        expect(issued).toHaveLength(1);
        expect(issued[0].dateReturned).not.toBeNull();
        expect(issued[0].dateReturned!.getTime() / 1000000).toBeCloseTo(new Date().getTime() / 1000000, 1);
        expect(issued[0].dateIssued).toStrictEqual(new Date('2023-08-16T10:06:37.000Z'));
        expect(issued[0].quantity).toBe(quantity);
    }

    test('Validate form validation', async ({ page, materialComponent, popupComponent, staticData: { ids } }) => {
        const testSets = numberValidationTests({ max: 255, min: 1, strict: false, testEmpty: true });

        for (const set of testSets) {
            await test.step(`Issued: ${set.testValue}`, async () => {
                await test.step('open Modal', async () => {
                    await page.reload();
                    await materialComponent.btn_group_issue(ids.materialGroupIds[1]).click();
                    await expect(popupComponent.div_popup).toBeVisible();
                });

                await test.step('fill Data', async () => {
                    await popupComponent.txt_issued.fill(String(set.testValue));
                    await popupComponent.btn_save.click();
                });

                await test.step('check validation', async () => {
                    if (set.valid) {
                        await expect.soft(popupComponent.div_popup).toBeVisible();
                        await expect.soft(popupComponent.txt_issued).not.toHaveClass(/is-invalid/);
                        await expect.soft(popupComponent.err_issued).not.toBeVisible();
                    } else {
                        await expect.soft(popupComponent.div_popup).toBeVisible();
                        await expect.soft(popupComponent.txt_issued).toHaveClass(/is-invalid/);
                        await expect.soft(popupComponent.err_issued).toBeVisible();
                    }
                });
            });
        }

        await test.step('TypeId: not Selected', async () => {
            await test.step('open Modal', async () => {
                await page.reload();
                await materialComponent.btn_group_issue(ids.materialGroupIds[0]).click();
                await expect(popupComponent.div_popup).toBeVisible();
            });

            await test.step('fill Data', async () => {
                await popupComponent.txt_issued.fill('4');
                await popupComponent.btn_save.click();
            });

            await test.step('check validation', async () => {
                await expect.soft(popupComponent.div_popup).toBeVisible();
                await expect.soft(popupComponent.sel_type).toHaveClass(/is-invalid/);
            });
        });
    });


    test('validate popup', async ({ materialComponent, popupComponent, staticData: { ids } }) => {
        await test.step('open Modal', async () => {
            await materialComponent.btn_group_issue(ids.materialGroupIds[0]).click();
            await expect(popupComponent.div_popup).toBeVisible();
        });
        await test.step('validate popup', async () => {
            await expect.soft(popupComponent.div_header).toHaveText(t.cadetDetailPage.issueMaterial.header.replace('{group}', 'Gruppe1'));
            await expect.soft(popupComponent.txt_issued).toBeVisible();
            await expect.soft(popupComponent.sel_type).toBeVisible();
        });

        await test.step('validate sel_type options', async () => {
            await expect.soft(popupComponent.sel_type.getByText('Typ1-1')).toBeEnabled();
            await expect.soft(popupComponent.sel_type.getByText('Typ1-2')).toBeEnabled();
            await expect.soft(popupComponent.sel_type.getByText('Typ1-3')).toBeDisabled();
            await expect.soft(popupComponent.sel_type.getByText('Typ1-4')).toBeEnabled();
        });
    });
    test('validate issue', async ({ materialComponent, popupComponent, staticData: { ids } }) => {
        await test.step('open Modal', async () => {
            await materialComponent.btn_group_issue(ids.materialGroupIds[0]).click();
            await expect(popupComponent.div_popup).toBeVisible();
        });
        await test.step('select and save', async () => {
            await popupComponent.sel_type.selectOption(ids.materialIds[1]);
            await popupComponent.txt_issued.fill('3');
            await popupComponent.btn_save.click();
        });
        await test.step('validate ui', async () => {
            await expect.soft(popupComponent.div_popup).not.toBeVisible();
            await expect.soft(materialComponent.div_material(ids.materialIds[1])).toBeVisible();
        });
        await test.step('validate db', async () => {
            await dbIssuedCheck(ids.materialIds[1], ids.cadetIds[1], 3);
        });
    });

    test('validate switch function replace', async ({ materialComponent, popupComponent, staticData: { ids } }) => {
        const newMaterial = ids.materialIds[1]; //Typ1-2
        const oldMaterial = ids.materialIds[2]; //Typ1-3

        await test.step('open Modal', async () => {
            await materialComponent.btn_material_switch(oldMaterial).click();
            await expect(popupComponent.div_popup).toBeVisible();
        });

        await test.step('validate initial data', async () => {
            await expect.soft(popupComponent.sel_type).toHaveValue(oldMaterial);
            await expect.soft(popupComponent.txt_issued).toHaveValue('1');
        });

        await test.step('select new values', async () => {
            await popupComponent.sel_type.selectOption(newMaterial);
            await popupComponent.txt_issued.fill('2');
            await popupComponent.btn_save.click();
        });

        await test.step('validate ui', async () => {
            await expect.soft(materialComponent.div_material(oldMaterial)).not.toBeVisible();
            await expect.soft(materialComponent.div_material(newMaterial)).toBeVisible();
            await expect.soft(materialComponent.div_material_issued(newMaterial)).toHaveText('2');
            await expect.soft(materialComponent.div_material_name(newMaterial)).toHaveText('Typ1-2');
        });
        await test.step('validate db', async () => {
            await dbIssuedCheck(newMaterial, ids.cadetIds[1], 2);
            await dbReturnedCheck(oldMaterial, ids.cadetIds[1], 1);
        });
    });

    test('validate switch function change issued', async ({ materialComponent, popupComponent, staticData: { ids } }) => {
        await test.step('open Modal', async () => {
            await materialComponent.btn_material_switch(ids.materialIds[2]).click();
            await expect(popupComponent.div_popup).toBeVisible();
        });

        await test.step('validate initial data', async () => {
            await expect.soft(popupComponent.sel_type).toHaveValue(ids.materialIds[2]);
            await expect.soft(popupComponent.txt_issued).toHaveValue('1');
        });

        await test.step('select new values', async () => {
            await popupComponent.txt_issued.fill('4');
            await popupComponent.btn_save.click();
        });

        await test.step('validate ui', async () => {
            await expect.soft(materialComponent.div_material(ids.materialIds[2])).toHaveCount(1);
            await expect.soft(materialComponent.div_material_issued(ids.materialIds[2])).toHaveText('4');
            await expect.soft(materialComponent.div_material_name(ids.materialIds[2])).toHaveText('Typ1-3');
        });
        await test.step('validate db', async () => {
            const dbIssued = await prisma.materialIssued.findMany({
                where: {
                    fk_cadet: ids.cadetIds[1],
                    fk_material: ids.materialIds[2],
                },
                orderBy: { dateIssued: "asc" }
            });

            expect(dbIssued).toHaveLength(2);

            expect(dbIssued[0].dateReturned).not.toBeNull();
            expect(dbIssued[0].dateReturned!.getTime() / 1000000).toBeCloseTo(new Date().getTime() / 1000000, 1);
            expect(dbIssued[0].dateIssued).toStrictEqual(new Date('2023-08-16T10:06:37.000Z'));
            expect(dbIssued[0].quantity).toBe(1);

            expect(dbIssued[1].dateIssued.getTime() / 1000000).toBeCloseTo(new Date().getTime() / 1000000, 1);
            expect(dbIssued[1].dateReturned).toBeNull();
            expect(dbIssued[1].quantity).toBe(4);
        });
    });

    test('validate return function', async ({ materialComponent, staticData: { ids } }) => {
        await test.step('return and validate ui', async () => {
            await expect.soft(materialComponent.div_material(ids.materialIds[2])).toBeVisible();
            await materialComponent.btn_material_return(ids.materialIds[2]).click();
            await expect.soft(materialComponent.div_material(ids.materialIds[2])).not.toBeVisible();
        });
        await test.step('validate db', async () => {
            await dbReturnedCheck(ids.materialIds[2], ids.cadetIds[1], 1);
        });
    });
});