import test, { Page, expect } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { CadetInspectionComponent } from "../../../pages/cadet/cadetInspection.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { insertSvenKellerFirstInspection, startInspection, svenKellerFirstInspectionData } from "../../../testData/dynamicData";
import { Pragati_Narrow } from "next/font/google";
import { testAssosiation, testMaterialGroups } from "../../../testData/staticData";

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
            await insertSvenKellerFirstInspection();
        }
        await Promise.all([createPage(), cleanUp()]);
        await page.goto(`/de/app/cadet/${cadetId}`);
    });
    test.afterAll(() => page.close());
    test.beforeEach(async () => {
        await page.reload();
        await inspectionComponent.btn_inspect.click();
        await inspectionComponent.btn_step1_continue.click();
    });

    // E2E0278
    test.skip('validate typedisabled', async () => {
        const i = svenKellerFirstInspectionData.newDeficiencyList.length;
        await test.step('setup', async () => {
            await expect(inspectionComponent.div_newDeficiency(0)).toBeVisible();
            await expect(inspectionComponent.div_newDeficiency(i)).not.toBeVisible();
            await inspectionComponent.btn_step2_newDef.click();
            await expect(inspectionComponent.div_newDeficiency(i)).toBeVisible();
        });

        await expect(inspectionComponent.sel_newDef_type(0)).toBeDisabled();
        await expect(inspectionComponent.sel_newDef_type(i)).toBeEnabled()
    });
    // E2E0277
    test.skip('validate data for repeated inspection', async () => {
        const newDefs = svenKellerFirstInspectionData.newDeficiencyList;

        expect(inspectionComponent.div_newDeficiency(newDefs.length - 1)).toBeVisible();

        const typeIdList = new Array(newDefs.length);
        for (let i = 0; i < newDefs.length; i++) {
            const typeId = await inspectionComponent.sel_newDef_type(i).inputValue();
            typeIdList.push(typeId);
        }

        await Promise.all([
            test.step('validate cadetDef', async () => {
                const i = typeIdList.findIndex(id => id == newDefs[0].fk_deficiencyType);

                expect(i).toBeGreaterThanOrEqual(0);
                await Promise.all([
                    expect.soft(inspectionComponent.sel_newDef_type(i)).toHaveValue(newDefs[0].fk_deficiencyType),
                    expect.soft(inspectionComponent.txt_newDef_description(i)).toBeVisible(),
                    expect.soft(inspectionComponent.txt_newDef_description(i)).toHaveValue(newDefs[0].description),
                    expect.soft(inspectionComponent.txt_newDef_comment(i)).toHaveValue(newDefs[0].comment)
                ]);
            }),
            test.step('validate cadetUniformDef', async () => {
                const i = typeIdList.findIndex(id => id === newDefs[4].fk_deficiencyType);

                expect(i).toBeGreaterThanOrEqual(0);
                await Promise.all([
                    expect.soft(inspectionComponent.txt_newDef_description(i)).not.toBeVisible(),
                    expect.soft(inspectionComponent.sel_newDef_uniform(i)).toBeVisible(),
                    expect.soft(inspectionComponent.sel_newDef_uniform(i)).toHaveValue(newDefs[4].DeficiencyCadet!.create.fk_uniform!),
                ]);
            }),
            test.step('validate uniformDef', async () => {
                const i = typeIdList.findIndex(id => id === newDefs[1].fk_deficiencyType);

                expect(i).toBeGreaterThanOrEqual(0);
                await Promise.all([
                    expect.soft(inspectionComponent.txt_newDef_description(i)).not.toBeVisible(),
                    expect.soft(inspectionComponent.sel_newDef_uniform(i)).toBeVisible(),
                    expect.soft(inspectionComponent.sel_newDef_uniform(i)).toHaveValue(newDefs[1].DeficiencyUniform!.create.fk_uniform!),
                ]);
            }),
            test.step('validate cadetMaterialDef not issued', async () => {
                const i = typeIdList.findIndex(id => id === newDefs[2].fk_deficiencyType);
                const groupId = testMaterialGroups.find(g => g.fk_assosiation === testAssosiation.id && g.description === "Gruppe1")!.id;

                expect(i).toBeGreaterThanOrEqual(0);
                await Promise.all([
                    expect.soft(inspectionComponent.txt_newDef_description(i)).not.toBeVisible(),
                    expect.soft(inspectionComponent.sel_newDef_material(i)).toBeVisible(),
                    expect.soft(inspectionComponent.sel_newDef_materialGroup(i)).toBeVisible(),
                    expect.soft(inspectionComponent.sel_newDef_materialType(i)).toBeVisible(),
                    expect.soft(inspectionComponent.sel_newDef_material(i)).toHaveValue('others'),
                    expect.soft(inspectionComponent.sel_newDef_materialGroup(i)).toHaveValue(groupId),
                    expect.soft(inspectionComponent.sel_newDef_materialType(i)).toHaveValue(newDefs[2].DeficiencyCadet!.create.fk_material!),
                ]);
            }),
            test.step('validate cadetMaterialDef issued', async () => {
                const i = typeIdList.findIndex(id => id === newDefs[3].fk_deficiencyType);

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
});
