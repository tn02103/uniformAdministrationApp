import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import t from "../../../../public/locales/de";
import { viewports } from "../../../_playwrightConfig/global/helper";
import { CommentValidationTests, newNameValidationTests } from "../../../_playwrightConfig/global/testSets";
import { CadetInspectionComponent } from "../../../_playwrightConfig/pages/cadet/cadetInspection.component";
import { CadetUniformComponent } from "../../../_playwrightConfig/pages/cadet/cadetUniform.component";
import { adminTest } from "../../../_playwrightConfig/setup";
import { startInspection } from "../../../_playwrightConfig/testData/dynamicData";

type Fixture = {
    inspectionComponent: CadetInspectionComponent;
};
const test = adminTest.extend<Fixture>({
    inspectionComponent: async ({ page, staticData }, use) => {
        const inspectionComponent = new CadetInspectionComponent(page);
        await page.goto(`/de/app/cadet/${staticData.ids.cadetIds[2]}`);
        await inspectionComponent.btn_inspect.click();
        await inspectionComponent.btn_step1_continue.click();
        await use(inspectionComponent);
    }
});
test.beforeAll(async ({ staticData: { index } }) => {
    await startInspection(index);
});
test.afterAll(async ({ staticData }) => {
    staticData.cleanup.inspection();
});

test('E2E0271: validate add and remove newDef', async ({ page, inspectionComponent }) => {
    await test.step('add new', async () => {
        await expect(inspectionComponent.div_newDeficiency(0)).toBeHidden();

        await inspectionComponent.btn_step2_newDef.click();
        await expect(inspectionComponent.div_newDeficiency(0)).toBeVisible();
        await expect(inspectionComponent.div_newDeficiency(1)).toBeHidden();

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
        await expect(inspectionComponent.btn_newDef_delete_mobile(0)).toBeHidden();

        await inspectionComponent.btn_newDef_delete(1).click();
        await expect(inspectionComponent.div_newDeficiency(2)).toBeHidden();
        await expect(inspectionComponent.txt_newDef_comment(1)).toHaveValue('2');
    });

    await test.step('validate delete mobile', async () => {
        await page.setViewportSize(viewports.xs);
        await expect(inspectionComponent.btn_newDef_delete(0)).toBeHidden();
        await expect(inspectionComponent.btn_newDef_delete_mobile(0)).toBeVisible();

        await inspectionComponent.btn_newDef_delete_mobile(0).click();
        await expect(inspectionComponent.div_newDeficiency(1)).toBeHidden();
        await expect(inspectionComponent.txt_newDef_comment(0)).toHaveValue('2');
    });
});

test('E2E0274: validate material selects', async ({ inspectionComponent, staticData: { ids, data } }) => {
    await test.step('type with materialRelation', async () => {
        await inspectionComponent.btn_step2_newDef.click();
        await inspectionComponent.sel_newDef_type(0).selectOption(ids.deficiencyTypeIds[3]);
        await expect(inspectionComponent.txt_newDef_description(0)).toBeHidden();
        await expect(inspectionComponent.sel_newDef_material(0)).toBeVisible();
        await expect(inspectionComponent.sel_newDef_materialType(0)).toBeHidden();
        await expect(inspectionComponent.sel_newDef_materialGroup(0)).toBeHidden();
    });
    await test.step('content of sel. MaterialId', async () => {
        const x = await inspectionComponent.sel_newDef_material(0).locator('option:not(:disabled)').all();
        expect(x).toHaveLength(2)
        await expect(x[0]).toHaveText('Gruppe2-Typ2-1');
        await expect(x[1]).toHaveText('Andere Materialien');
    });
    await test.step('other materials', async () => {
        await inspectionComponent.sel_newDef_material(0).selectOption('others');
        await expect(inspectionComponent.sel_newDef_material(0)).toBeVisible();
        await expect(inspectionComponent.sel_newDef_materialType(0)).toBeVisible();
        await expect(inspectionComponent.sel_newDef_materialGroup(0)).toBeVisible();
    });
    await test.step('content matgroup', async () => {
        const options = await inspectionComponent.sel_newDef_materialGroup(0).locator('option:not(:disabled)').all();

        await expect(options[0]).toHaveAttribute("value", ids.materialGroupIds[0]);
        await expect(options[0]).toHaveText('Gruppe1');
        await expect(options[1]).toHaveAttribute("value", ids.materialGroupIds[1]);
        await expect(options[1]).toHaveText('Gruppe2');
        await expect(options[2]).toHaveAttribute("value", ids.materialGroupIds[2]);
        await expect(options[2]).toHaveText('Gruppe3');
    });


    await expect(inspectionComponent.sel_newDef_materialType(0).getByRole('option')).toHaveCount(1);

    const groups = [data.materialGroups[0], data.materialGroups[1]];
    await Promise.all(
        groups.map(async (group) =>
            test.step(`content of materialRows for group: ${group.description}`, async () => {
                const materialTypes = await prisma.material.findMany({
                    where: { fk_materialGroup: group.id, recdelete: null },
                    orderBy: { sortOrder: "asc" }
                });

                await inspectionComponent.sel_newDef_materialGroup(0).selectOption(group.id);

                const options = await inspectionComponent.sel_newDef_materialType(0).locator('option:not(:disabled)').all();
                expect(options).toHaveLength(materialTypes.length);

                await Promise.all(
                    options.map(async (option, index) => {
                        await expect(option).toHaveAttribute("value", materialTypes[index].id);
                        await expect(option).toHaveText(materialTypes[index].typename);
                    })
                );
            })
        )
    );
});

test('E2E0272: validate uniformSelect', async ({ inspectionComponent, staticData: { ids } }) => {
    await test.step('dependent uniform', async () => {
        await inspectionComponent.btn_step2_newDef.click();
        await inspectionComponent.sel_newDef_type(0).selectOption(ids.deficiencyTypeIds[0]);

        await expect(inspectionComponent.txt_newDef_description(0)).toBeHidden();
        await expect(inspectionComponent.sel_newDef_uniform(0)).toBeVisible();
    });
    await test.step('uniformDescriptions', async () => {
        const x = await inspectionComponent.sel_newDef_uniform(0).locator('option').all();
        expect(x).toHaveLength(3)
        await expect(x[1]).toHaveText('Typ1-1146');
        await expect(x[2]).toHaveText('Typ1-1148');
    });
    await test.step('relative uniform', async () => {
        await inspectionComponent.sel_newDef_type(0).selectOption(ids.deficiencyTypeIds[2]);
        await expect(inspectionComponent.txt_newDef_description(0)).toBeHidden();
        await expect(inspectionComponent.sel_newDef_uniform(0)).toBeVisible();
    });
    await test.step('required', async () => {
        await inspectionComponent.btn_step2_submit.click();
        await expect(inspectionComponent.err_newDef_uniform(0)).toBeVisible();
        await inspectionComponent.sel_newDef_uniform(0).selectOption(ids.uniformIds[0][48]);
        await expect(inspectionComponent.err_newDef_uniform(0)).toBeHidden();
    });
});

test('E2E0273: validate update of uniformSelect Content', async ({ page, inspectionComponent, staticData: { ids, cleanup } }) => {
    const uniformComponent = new CadetUniformComponent(page);
    const div_popup = page.getByRole("dialog");
    const txt_autocomplete = div_popup.getByRole('textbox', { name: t.cadetDetailPage.issueModal["input.label"] });
    const btn_save = div_popup.getByRole("button", { name: t.cadetDetailPage.issueModal["button.issue"] });

    await test.step('setup', async () => {
        await inspectionComponent.btn_step2_newDef.click();
        await inspectionComponent.sel_newDef_type(0).selectOption(ids.deficiencyTypeIds[0]);
    });
    await test.step('issue', async () => {
        await uniformComponent.btn_utype_issue(ids.uniformTypeIds[0]).click();
        await expect(txt_autocomplete).toBeVisible();
        await txt_autocomplete.click();
        await expect(div_popup.getByRole("option").nth(0)).toBeVisible(); // waiting till options are loaded

        await txt_autocomplete.fill('1111');
        await expect(txt_autocomplete).toHaveValue('1111');
        await expect(btn_save).toBeEnabled();
        await btn_save.click();

        await expect(uniformComponent.div_uitem(ids.uniformIds[0][11])).toBeVisible();
    });
    await test.step('validate change', async () => {
        expect(
            inspectionComponent
                .sel_newDef_uniform(0)
                .locator(`option[value="${ids.uniformIds[0][11]}"]`)
        ).toBeDefined();
    });
    await cleanup.uniformIssued();
});

test.describe('E2E0280: validate formValidations', () => {
    test('sel_type validation', async ({ inspectionComponent }) => {
        await inspectionComponent.btn_step2_newDef.click();
        await expect(inspectionComponent.err_newDef_type(0)).toBeHidden();
        await expect(inspectionComponent.sel_newDef_type(0)).toBeVisible();

        await inspectionComponent.btn_step2_submit.click();
        await expect(inspectionComponent.err_newDef_type(0)).toBeVisible();
    });
    test('description', async ({ inspectionComponent, staticData: { ids } }) => {
        await inspectionComponent.btn_step2_newDef.click();
        await inspectionComponent.sel_newDef_type(0).selectOption(ids.deficiencyTypeIds[1]); // CadetDef
        await expect(inspectionComponent.txt_newDef_description(0)).toBeVisible();

        const testSets = newNameValidationTests({ maxLength: 30, minLength: 1 });
        await inspectionComponent.btn_step2_submit.click();

        for (const set of testSets) {
            await test.step(String(set.testValue), async () => {
                await inspectionComponent.txt_newDef_description(0).fill(String(set.testValue));
                if (set.valid) {
                    await expect(inspectionComponent.err_newDef_description(0)).toBeHidden();
                } else {
                    await expect(inspectionComponent.err_newDef_description(0)).toBeVisible();
                }
            });
        }
    });

    test('sel_uniform', async ({ inspectionComponent, staticData: { ids } }) => {
        await inspectionComponent.btn_step2_newDef.click();
        await inspectionComponent.sel_newDef_type(0).selectOption(ids.deficiencyTypeIds[2]); // CadetUniform
        await expect(inspectionComponent.sel_newDef_uniform(0)).toBeVisible();
        await expect(inspectionComponent.err_newDef_uniform(0)).toBeHidden();

        await inspectionComponent.btn_step2_submit.click();
        await expect(inspectionComponent.err_newDef_uniform(0)).toBeVisible();

        await inspectionComponent.sel_newDef_uniform(0).selectOption(ids.uniformIds[0][46]);
        await expect(inspectionComponent.err_newDef_uniform(0)).toBeHidden();
    });
    test('sel_material', async ({ inspectionComponent, staticData: { ids } }) => {
        await inspectionComponent.btn_step2_newDef.click();
        await inspectionComponent.sel_newDef_type(0).selectOption(ids.deficiencyTypeIds[3]); // CadetMaterial
        await expect(inspectionComponent.sel_newDef_material(0)).toBeVisible();
        await expect(inspectionComponent.err_newDef_material(0)).toBeHidden();

        await inspectionComponent.btn_step2_submit.click();
        await expect(inspectionComponent.err_newDef_material(0)).toBeVisible();

        await inspectionComponent.sel_newDef_material(0).selectOption(ids.materialIds[4]);
        await expect(inspectionComponent.err_newDef_material(0)).toBeHidden();

        await inspectionComponent.sel_newDef_material(0).selectOption('others');
        await expect(inspectionComponent.err_newDef_material(0)).toBeHidden();
    });
    test('sel_matGroup/ sel_matType', async ({ inspectionComponent, staticData: { ids } }) => {
        await inspectionComponent.btn_step2_newDef.click();
        await inspectionComponent.sel_newDef_type(0).selectOption(ids.deficiencyTypeIds[3]); // CadetMaterial
        await inspectionComponent.sel_newDef_material(0).selectOption('others');

        await expect(inspectionComponent.sel_newDef_materialGroup(0)).toBeVisible();
        await expect(inspectionComponent.sel_newDef_materialType(0)).toBeVisible();

        await expect(inspectionComponent.err_newDef_materialGroup(0)).toBeHidden();
        await expect(inspectionComponent.err_newDef_materialType(0)).toBeHidden();

        await inspectionComponent.btn_step2_submit.click();
        await expect(inspectionComponent.err_newDef_materialGroup(0)).toBeVisible();
        await expect(inspectionComponent.err_newDef_materialType(0)).toBeVisible();

        await inspectionComponent.sel_newDef_materialGroup(0).selectOption(ids.materialGroupIds[0]);
        await expect(inspectionComponent.err_newDef_materialGroup(0)).toBeHidden();

        await inspectionComponent.sel_newDef_materialType(0).selectOption(ids.materialIds[0]);
        await expect(inspectionComponent.err_newDef_materialType(0)).toBeHidden();
    });
    test('txt_comment', async ({ inspectionComponent }) => {
        await inspectionComponent.btn_step2_newDef.click();
        await inspectionComponent.btn_step2_submit.click();
        
        const testSets = CommentValidationTests({ maxLength: 300 });
        for (const set of testSets) {
            await test.step(String(set.testValue), async () => {
                await inspectionComponent.txt_newDef_comment(0).fill(String(set.testValue));
                if (set.valid) {
                    await expect(inspectionComponent.err_newDef_comment(0)).toBeHidden();
                } else {
                    await expect(inspectionComponent.err_newDef_comment(0)).toBeVisible();
                }
            });
        }
    });
});
