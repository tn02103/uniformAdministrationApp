import test, { Page, expect } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { CadetInspectionComponent } from "../../../pages/cadet/cadetInspection.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { startInspection } from "../../../testData/dynamicData";
import { viewports } from "../../../global/helper";
import { testDeficiencyTypes, testMaterialGroups, testAssosiation, testMaterials } from "../../../testData/staticData";
import { CadetUniformComponent } from "../../../pages/cadet/cadetUniform.component";
import { SimpleFormPopupComponent } from "../../../pages/popups/SimpleFormPopup.component";

test.use({ storageState: adminAuthFile });
test.describe('', async () => {
    let page: Page;
    let inspectionComponent: CadetInspectionComponent;
    const cadetId = 'c4d33a71-3c11-11ee-8084-0068eb8ba754'; // Sven Keller

    // SETUPS
    test.beforeAll(async ({ browser }) => {
        const createPage = async () => {
            page = await (await browser.newContext()).newPage();
            inspectionComponent = new CadetInspectionComponent(page);
        }
        const cleanUp = async () => {
            await cleanupData();
            await startInspection();
        }
        await Promise.all([createPage(), cleanUp()]);
        await page.goto(`/de/app/cadet/${cadetId}`)
    });
    test.afterAll(() => page.close());
    test.beforeEach(async () => {
        await page.reload();
        await inspectionComponent.btn_inspect.click();
        await inspectionComponent.btn_step1_continue.click();
    });

    test('E2E0271: validate add and remove newDef', async () => {
        await test.step('add new', async () => {
            await expect(inspectionComponent.div_newDeficiency(0)).not.toBeVisible();

            await inspectionComponent.btn_step2_newDef.click();
            await expect(inspectionComponent.div_newDeficiency(0)).toBeVisible();
            await expect(inspectionComponent.div_newDeficiency(1)).not.toBeVisible();

            await inspectionComponent.btn_step2_newDef.click();
            await expect(inspectionComponent.div_newDeficiency(0)).toBeVisible();
            await expect(inspectionComponent.div_newDeficiency(1)).toBeVisible();
        });

        await test.step('prepare data for next Step', async () => {
            await inspectionComponent.btn_step2_newDef.click();
            await inspectionComponent.txt_newDef_comment(0).fill('0');
            await inspectionComponent.txt_newDef_comment(1).fill('1');
            await inspectionComponent.txt_newDef_comment(2).fill('2');
        });

        await test.step('validate delete desctop', async () => {
            await expect(inspectionComponent.btn_newDef_delete(0)).toBeVisible();
            await expect(inspectionComponent.btn_newDef_delete_mobile(0)).not.toBeVisible();

            await inspectionComponent.btn_newDef_delete(1).click();
            await expect(inspectionComponent.div_newDeficiency(2)).not.toBeVisible();
            await expect(inspectionComponent.txt_newDef_comment(1)).toHaveValue('2');
        });

        await test.step('validate delete mobile', async () => {
            await page.setViewportSize(viewports.xs);
            await expect(inspectionComponent.btn_newDef_delete(0)).not.toBeVisible();
            await expect(inspectionComponent.btn_newDef_delete_mobile(0)).toBeVisible();

            await inspectionComponent.btn_newDef_delete_mobile(0).click();
            await expect(inspectionComponent.div_newDeficiency(1)).not.toBeVisible();
            await expect(inspectionComponent.txt_newDef_comment(0)).toHaveValue('2');
        });
    });

    test('E2E0274: validate material selects', async () => {
        const type = testDeficiencyTypes.find(t => t.relation === "material");

        await test.step('type with materialRelation', async () => {
            await inspectionComponent.btn_step2_newDef.click();
            await inspectionComponent.sel_newDef_type(0).selectOption(type!.id);
            await expect(inspectionComponent.txt_newDef_description(0)).not.toBeVisible();
            await expect(inspectionComponent.sel_newDef_material(0)).toBeVisible();
            await expect(inspectionComponent.sel_newDef_materialType(0)).not.toBeVisible();
            await expect(inspectionComponent.sel_newDef_materialGroup(0)).not.toBeVisible();
        });
        await test.step('content of sel. MaterialId', async () => {
            const x = await inspectionComponent.sel_newDef_material(0).locator('option:not(:disabled)').all();
            expect(x.length).toBe(2)
            expect(x[0]).toHaveText('Gruppe2-Typ2-1');
            expect(x[1]).toHaveText('Andere Materialien');
        });
        await test.step('other materials', async () => {
            await inspectionComponent.sel_newDef_material(0).selectOption('others');
            await expect(inspectionComponent.sel_newDef_material(0)).toBeVisible();
            await expect(inspectionComponent.sel_newDef_materialType(0)).toBeVisible();
            await expect(inspectionComponent.sel_newDef_materialGroup(0)).toBeVisible();
        });
        await test.step('content matgroup', async () => {
            const mGroups = testMaterialGroups
                .filter(g => g.fk_assosiation === testAssosiation.id && g.recdelete === null)
                .sort((a, b) => a.sortOrder - b.sortOrder);

            const options = await inspectionComponent.sel_newDef_materialGroup(0).locator('option:not(:disabled)').all();

            expect(options.length).toBe(mGroups.length);
            await Promise.all(
                options.map(async (option, index) => {
                    await expect(option).toHaveAttribute("value", mGroups[index].id);
                    await expect(option).toHaveText(mGroups[index].description);
                })
            )
        });
        await test.step('content matType', async () => {
            const validateGroup = async (groupId: string, groupName: string) => test.step(`group: ${groupName}`, async () => {
                await inspectionComponent.sel_newDef_materialGroup(0).selectOption(groupId);
                const types = testMaterials
                    .filter(m => m.fk_materialGroup === groupId && m.recdelete === null)
                    .sort((a, b) => a.sortOrder - b.sortOrder);

                const options = await inspectionComponent.sel_newDef_materialType(0).locator('option:not(:disabled)').all();
                await expect(options.length).toBe(types.length);
                await await Promise.all([
                    options.map(async (option, index) => {
                        await expect(option).toHaveAttribute("value", types[index].id);
                        await expect(option).toHaveText(types[index].typename);
                    })
                ]);
            });
            expect((await inspectionComponent.sel_newDef_materialType(0).getByRole('option').all()).length).toBe(1);

            await validateGroup('4b8b8b36-3c03-11ee-8084-0068eb8ba754', 'Gruppe1');
            await validateGroup('b9a6c18d-3c03-11ee-8084-0068eb8ba754', 'Gruppe2');
        });
    });

    test('E2E0272: validate uniformSelect', async () => {
        await test.step('dependend uniform', async () => {
            const type = testDeficiencyTypes.find(t => t.dependend === "uniform"
                && t.fk_assosiation === testAssosiation.id
                && t.recdelete === null);

            await inspectionComponent.btn_step2_newDef.click();
            await inspectionComponent.sel_newDef_type(0).selectOption(type!.id);

            await expect(inspectionComponent.txt_newDef_description(0)).not.toBeVisible();
            await expect(inspectionComponent.sel_newDef_uniform(0)).toBeVisible();
        });
        await test.step('uniformDescriptions', async () => {
            const x = await inspectionComponent.sel_newDef_uniform(0).locator('option').all();
            expect(x.length).toBe(3)
            expect(x[1]).toHaveText('Typ1-1146');
            expect(x[2]).toHaveText('Typ1-1148');
        });
        await test.step('relative uniform', async () => {
            const type = testDeficiencyTypes.find(t => t.relation === "uniform"
                && t.fk_assosiation === testAssosiation.id
                && t.recdelete == null);

            await inspectionComponent.sel_newDef_type(0).selectOption(type!.id);
            await expect(inspectionComponent.txt_newDef_description(0)).not.toBeVisible();
            await expect(inspectionComponent.sel_newDef_uniform(0)).toBeVisible();
        });
        await test.step('required', async () => {
            await inspectionComponent.btn_step2_submit.click();
            await expect(inspectionComponent.err_newDef_uniform(0)).toBeVisible();
            await inspectionComponent.sel_newDef_uniform(0).selectOption('45f3337e-3c0d-11ee-8084-0068eb8ba754');
            await expect(inspectionComponent.err_newDef_uniform(0)).not.toBeVisible();
        });
    });

    test('E2E0273: validate update of uniformSelect Content', async () => {
        const uniformComponent = new CadetUniformComponent(page);
        const formComponent = new SimpleFormPopupComponent(page);
        const type = testDeficiencyTypes.find(t => t.dependend === "uniform"
            && t.fk_assosiation === testAssosiation.id
            && t.recdelete === null);
        await test.step('setup', async () => {
            await inspectionComponent.btn_step2_newDef.click();
            await inspectionComponent.sel_newDef_type(0).selectOption(type!.id);
        });
        await test.step('issue', async () => {
            await uniformComponent.btn_utype_issue('036ff236-3b83-11ee-ab4b-0068eb8ba754').click();
            await formComponent.txt_input.fill('1111');
            await formComponent.btn_save.click();
            await expect(uniformComponent.div_uitem('45f31751-3c0d-11ee-8084-0068eb8ba754')).toBeVisible();
        });
        await test.step('validate change', async () => {
            await expect(
                inspectionComponent
                    .sel_newDef_uniform(0)
                    .locator(`option[value="45f31751-3c0d-11ee-8084-0068eb8ba754"]`)
            ).toBeDefined();
        });
    });

    test.skip('E2E0280: validate formValidations', async () => {
        // TODO create test 
    });
});


