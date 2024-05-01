import { expect } from "playwright/test";
import { adminTest } from "../../../auth.setup";
import { CadetInspectionComponent } from "../../../pages/cadet/cadetInspection.component";
import { insertSvenKellerFirstInspection, startInspection, svenKellerFirstInspectionData } from "../../../testData/dynamicData";

type Fixture = {
    inspectionComponent: CadetInspectionComponent;
};
const test = adminTest.extend<Fixture>({
    staticData: async ({ staticData }, use) => {
        await startInspection(staticData.index);
        await insertSvenKellerFirstInspection(staticData.index);
        use(staticData);
    },
    inspectionComponent: async ({ page, staticData }, use) => {
        const inspectionComponent = new CadetInspectionComponent(page)
        await page.goto(`/de/app/cadet/${staticData.ids.cadetIds[2]}`);
        await inspectionComponent.btn_inspect.click();
        await inspectionComponent.btn_step1_continue.click();
        await use(inspectionComponent);
    }
});

test('E2E0278: validate typedisabled', async ({ inspectionComponent, staticData: { index } }) => {
    const i = svenKellerFirstInspectionData(index).newDeficiencyList.length;
    await test.step('setup', async () => {
        await expect(inspectionComponent.div_newDeficiency(0)).toBeVisible();
        await expect(inspectionComponent.div_newDeficiency(i)).not.toBeVisible();
        await inspectionComponent.btn_step2_newDef.click();
        await expect(inspectionComponent.div_newDeficiency(i)).toBeVisible();
    });

    await expect(inspectionComponent.sel_newDef_type(0)).toBeDisabled();
    await expect(inspectionComponent.sel_newDef_type(i)).toBeEnabled()
});

test('E2E0277: validate data for repeated inspection', async ({ inspectionComponent, staticData: { ids, index } }) => {
    const newDefs = svenKellerFirstInspectionData(index).newDeficiencyList;

    expect(inspectionComponent.div_newDeficiency(newDefs.length - 1)).toBeVisible();

    const commentList = new Array(newDefs.length);
    for (let i = 0; i < newDefs.length; i++) {
        const comment = await inspectionComponent.txt_newDef_comment(i).inputValue();
        commentList[i] = comment;
    }

    await Promise.all([
        test.step('validate cadetDef', async () => {
            const i = commentList.findIndex(id => id == newDefs[0].comment);

            expect(i).toBeGreaterThanOrEqual(0);
            await Promise.all([
                expect.soft(inspectionComponent.sel_newDef_type(i)).toHaveValue(newDefs[0].fk_deficiencyType),
                expect.soft(inspectionComponent.txt_newDef_description(i)).toBeVisible(),
                expect.soft(inspectionComponent.txt_newDef_description(i)).toHaveValue(newDefs[0].description),
                expect.soft(inspectionComponent.txt_newDef_comment(i)).toHaveValue(newDefs[0].comment)
            ]);
        }),
        test.step('validate cadetUniformDef', async () => {
            const i = commentList.findIndex(id => id === newDefs[4].comment);

            expect(i).toBeGreaterThanOrEqual(0);
            await Promise.all([
                expect.soft(inspectionComponent.txt_newDef_description(i)).not.toBeVisible(),
                expect.soft(inspectionComponent.sel_newDef_uniform(i)).toBeVisible(),
                expect.soft(inspectionComponent.sel_newDef_uniform(i)).toHaveValue(newDefs[4].DeficiencyCadet!.create.fk_uniform!),
            ]);
        }),
        test.step('validate uniformDef', async () => {
            const i = commentList.findIndex(id => id === newDefs[1].comment);

            expect(i).toBeGreaterThanOrEqual(0);
            await Promise.all([
                expect.soft(inspectionComponent.txt_newDef_description(i)).not.toBeVisible(),
                expect.soft(inspectionComponent.sel_newDef_uniform(i)).toBeVisible(),
                expect.soft(inspectionComponent.sel_newDef_uniform(i)).toHaveValue(newDefs[1].DeficiencyUniform!.create.fk_uniform!),
            ]);
        }),
        test.step('validate cadetMaterialDef not issued', async () => {
            const i = commentList.findIndex(id => id === newDefs[2].comment);

            expect(i).toBeGreaterThanOrEqual(0);
            await Promise.all([
                expect.soft(inspectionComponent.txt_newDef_description(i)).not.toBeVisible(),
                expect.soft(inspectionComponent.sel_newDef_material(i)).toBeVisible(),
                expect.soft(inspectionComponent.sel_newDef_materialGroup(i)).toBeVisible(),
                expect.soft(inspectionComponent.sel_newDef_materialType(i)).toBeVisible(),
                expect.soft(inspectionComponent.sel_newDef_material(i)).toHaveValue('others'),
                expect.soft(inspectionComponent.sel_newDef_materialGroup(i)).toHaveValue(ids.materialGroupIds[2]),
                expect.soft(inspectionComponent.sel_newDef_materialType(i)).toHaveValue(newDefs[2].DeficiencyCadet!.create.fk_material!),
            ]);
        }),
        test.step('validate cadetMaterialDef issued', async () => {
            const i = commentList.findIndex(id => id === newDefs[3].comment);

            expect(i).toBeGreaterThanOrEqual(0);
            await Promise.all([
                expect.soft(inspectionComponent.txt_newDef_description(i)).not.toBeVisible(),
                expect.soft(inspectionComponent.sel_newDef_material(i)).toBeVisible(),
                expect.soft(inspectionComponent.sel_newDef_materialGroup(i)).not.toBeVisible(),
                expect.soft(inspectionComponent.sel_newDef_materialType(i)).not.toBeVisible(),
                expect.soft(inspectionComponent.sel_newDef_material(i)).toHaveValue(newDefs[3].DeficiencyCadet!.create.fk_material!),
            ]);
        }),
    ]);
});
