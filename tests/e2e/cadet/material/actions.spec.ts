import { Locator, Page, expect, test } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { CadetMaterialComponent } from "../../../pages/cadet/cadetMaterial.component";
import { PopupComponent } from "../../../pages/popups/Popup.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import t from "../../../../public/locales/de";

test.use({ storageState: adminAuthFile });
test.describe('', () => {
    const groupId = '4b8b8b36-3c03-11ee-8084-0068eb8ba754';
    let page: Page;
    let materialComponent: CadetMaterialComponent;
    let popupComponent: PopupComponent;
    let sel_type: Locator;
    let txt_issued: Locator;
    let err_issued: Locator;

    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();

        materialComponent = new CadetMaterialComponent(page);
        popupComponent = new PopupComponent(page);
        sel_type = popupComponent.div_popup.locator('select[name="typeId"]');
        txt_issued = popupComponent.div_popup.locator('input[name="issued"]');
        err_issued = popupComponent.div_popup.getByTestId('err_issued');

        await page.goto(`/de/app/cadet/0d06427b-3c12-11ee-8084-0068eb8ba754`); // Marie Ackerman
    });
    test.afterAll(() => page.close());

    test.beforeEach(async () => {
        await cleanupData();
        await page.reload();
    });

    test('Validate form validation', async () => {
        await test.step('Issued: null Value', async () => {
            await testIssueField('');
        });
        await test.step('Issued: 0', async () => {
            await testIssueField('0');
        });
        await test.step('Issued: negative Value', async () => {
            await testIssueField('-10');
        });
        await test.step('Issued: greater than 255', async () => {
            await testIssueField('300');
        });
        await test.step('Issued: string', async () => {
            await testIssueField('teststring');
        });
        await test.step('Issued: float', async () => {
            await testIssueField('1.34');
        });
        await test.step('TypeId: not Selected', async () => {
            await test.step('open Modal', async () => {
                await page.reload();
                await materialComponent.btn_group_issue(groupId).click();
                await expect(popupComponent.div_popup).toBeVisible();
            });

            await test.step('fill Data', async () => {
                await txt_issued.fill('4');
                await popupComponent.btn_save.click();
            });

            await test.step('check validation', async () => {
                await expect.soft(popupComponent.div_popup).toBeVisible();
                await expect.soft(sel_type).toHaveClass(/is-invalid/);
            });
        });

        async function testIssueField(value: string) {
            await test.step('open Modal', async () => {
                await page.reload();
                await materialComponent.btn_group_issue(groupId).click();
                await expect(popupComponent.div_popup).toBeVisible();
            });

            await test.step('fill Data', async () => {
                await sel_type.selectOption('a5630e5c-3c03-11ee-8084-0068eb8ba754');
                await txt_issued.fill(value);
                await popupComponent.btn_save.click();
            });

            await test.step('check validation', async () => {
                await expect.soft(popupComponent.div_popup).toBeVisible();
                await expect.soft(txt_issued).toHaveClass(/is-invalid/);
                await expect.soft(err_issued).toBeVisible();
            });
        }
    });

    test('validate that issued types are disabled', async () => {
        await test.step('open Modal', async () => {
            await materialComponent.btn_group_issue(groupId).click();
            await expect(popupComponent.div_popup).toBeVisible();
        });

        await test.step('validate', async () => {
            await expect.soft(sel_type.getByText('Typ1-1')).toBeEnabled();
            await expect.soft(sel_type.getByText('Typ1-2')).toBeEnabled();
            await expect.soft(sel_type.getByText('Typ1-3')).toBeDisabled();
            await expect.soft(sel_type.getByText('Typ1-4')).toBeEnabled();
        });
    });

    test('validate popup', async () => {
        await test.step('open Modal', async () => {
            await materialComponent.btn_group_issue(groupId).click();
            await expect(popupComponent.div_popup).toBeVisible();
        });
        await test.step('validate', async () => {
            await expect.soft(popupComponent.div_header).toHaveText(t.cadetDetailPage.issueMaterial.header.replace('{group}', 'Gruppe1'));
            await expect.soft(txt_issued).toBeVisible();
            await expect.soft(sel_type).toBeVisible();
        });
    });

    test('validate cancelFunction', async () => {
        const material = '9d09592c-3c03-11ee-8084-0068eb8ba754'; //Typ1-1

        await test.step('open Modal', async () => {
            await materialComponent.btn_group_issue(groupId).click();
            await expect(popupComponent.div_popup).toBeVisible();
        });
        await test.step('select and cancel', async () => {
            await sel_type.selectOption(material);
            await txt_issued.fill('3');
            await popupComponent.btn_cancel.click();
        });
        await test.step('validate post action', async () => {
            await expect.soft(popupComponent.div_popup).not.toBeVisible();
            await expect.soft(materialComponent.div_material(material)).not.toBeVisible();
        });
    });

    test('validate saveFunction', async () => {
        const material = '9d09592c-3c03-11ee-8084-0068eb8ba754'; //Typ1-1

        await test.step('open Modal', async () => {
            await materialComponent.btn_group_issue(groupId).click();
            await expect(popupComponent.div_popup).toBeVisible();
        });
        await test.step('select and save', async () => {
            await sel_type.selectOption(material);
            await txt_issued.fill('3');
            await popupComponent.btn_save.click();
        });
        await test.step('validate post action', async () => {
            await expect.soft(popupComponent.div_popup).not.toBeVisible();
            await expect.soft(materialComponent.div_material(material)).toBeVisible();
        });
    });

    test('validate switch function replace', async () => {
        const newMaterial = '9d09592c-3c03-11ee-8084-0068eb8ba754'; //Typ1-1
        const oldMaterial = 'acda1cc8-3c03-11ee-8084-0068eb8ba754'; //Typ1-3

        await test.step('open Modal', async () => {
            await materialComponent.btn_material_switch(oldMaterial).click();
            await expect(popupComponent.div_popup).toBeVisible();
        });

        await test.step('validate initial data', async () => {
            await expect.soft(sel_type).toHaveValue(oldMaterial);
            await expect.soft(txt_issued).toHaveValue('1');
        });

        await test.step('select new values', async () => {
            await sel_type.selectOption(newMaterial);
            await txt_issued.fill('2');
            await popupComponent.btn_save.click();
        });

        await test.step('validate new data', async () => {
            await expect.soft(materialComponent.div_material(oldMaterial)).not.toBeVisible();
            await expect.soft(materialComponent.div_material(newMaterial)).toBeVisible();
            await expect.soft(materialComponent.div_material_issued(newMaterial)).toHaveText('2');
            await expect.soft(materialComponent.div_material_name(newMaterial)).toHaveText('Typ1-1');
        });
    });

    test('validate switch function change issued', async () => {
        const material = 'acda1cc8-3c03-11ee-8084-0068eb8ba754'; //Typ1-3

        await test.step('open Modal', async () => {
            await materialComponent.btn_material_switch(material).click();
            await expect(popupComponent.div_popup).toBeVisible();
        });

        await test.step('validate initial data', async () => {
            await expect.soft(sel_type).toHaveValue(material);
            await expect.soft(txt_issued).toHaveValue('1');
        });

        await test.step('select new values', async () => {
            await txt_issued.fill('4');
            await popupComponent.btn_save.click();
        });

        await test.step('validate new data', async () => {
            await expect.soft(materialComponent.div_material(material)).toHaveCount(1);
            await expect.soft(materialComponent.div_material_issued(material)).toHaveText('4');
            await expect.soft(materialComponent.div_material_name(material)).toHaveText('Typ1-3');
        });
    });

    test('validate return function', async () => {
        const material = 'acda1cc8-3c03-11ee-8084-0068eb8ba754'; //Typ1-3

        await expect.soft(materialComponent.div_material(material)).toBeVisible();
        await materialComponent.btn_material_return(material).click();
        await expect.soft(materialComponent.div_material(material)).not.toBeVisible();
    });
});
