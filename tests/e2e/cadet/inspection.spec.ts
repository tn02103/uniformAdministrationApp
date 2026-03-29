
import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import german from "../../../public/locales/de";
import { CadetInspectionComponent } from "../../_playwrightConfig/pages/cadet/cadetInspection.component";
import { ToastTestComponent } from "../../_playwrightConfig/pages/global/Toast.component";
import { adminTest } from "../../_playwrightConfig/setup";
import { StaticDataIdType } from "../../_playwrightConfig/testData/staticDataGenerator";


type Fixture = {
    inspectionComponent: CadetInspectionComponent;
    testData: {
        inspectionId: string;
        unresolvedIds: string[];
        newDefs: {
            [key in "cadet" | "cadetMaterialOther" | "uniform"]: {
                type: string;
                description: string;
                comment: string;
                uniform?: string;
                material?: string;
                materialType?: string;
                materialGroup?: string;
            }
        }
    }
};
const test = adminTest.extend<Fixture>({
    inspectionComponent: async ({ page }, use) => {
        const inspectionComponent = new CadetInspectionComponent(page);
        await use(inspectionComponent);
    },
    testData: async ({ staticData: { ids } }, use) => {
        const deficiencyIds = ids.deficiencyIds;
        use({
            inspectionId: ids.inspectionIds[4],
            unresolvedIds: [deficiencyIds[5], deficiencyIds[10], deficiencyIds[1], deficiencyIds[9], deficiencyIds[15], deficiencyIds[13]],
            newDefs: {
                cadet: {
                    type: ids.deficiencyTypeIds[1],
                    description: "New Deficiency",
                    comment: "Comment: CadetDeficiency",
                },
                cadetMaterialOther: {
                    type: ids.deficiencyTypeIds[3],
                    materialType: ids.materialIds[7],
                    materialGroup: ids.materialGroupIds[2],
                    description: "Gruppe3-Typ3-1",
                    comment: "Comment: CadetMaterial not issued"
                },
                uniform: {
                    type: ids.deficiencyTypeIds[0],
                    uniform: ids.uniformIds[0][46],
                    description: "Typ1-1146",
                    comment: "Comment: Uniform",
                }
            }
        })
    }
});

test.describe("<CadetInspectionCard />", () => {
    test.afterEach(async ({ staticData }) => {
        await staticData.cleanup.inspection();
    });

    const startInspection = async (ids: StaticDataIdType) => {
        await prisma.inspection.update({
            where: { id: ids.inspectionIds[4] },
            data: {
                timeStart: '02:00'
            }
        });
    }

    test('inactive inspection state', async ({ page, staticData: { ids }, inspectionComponent, testData }) => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[2]}`);

        await expect(inspectionComponent.div_header).toContainText(german.cadetDetailPage.inspection["header.noInspection"]);
        await expect(inspectionComponent.btn_inspect).toBeHidden();
        await expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[0])).toBeVisible();
        await expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[1])).toBeVisible();
        await expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[2])).toBeVisible();
        await expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[3])).toBeVisible();
        await expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[4])).toBeVisible();
        await expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[5])).toBeVisible();

        await expect(inspectionComponent.div_oldDeficiency_list).toHaveCount(6);
    });

    test('active inspection state, not inspected', async ({ page, staticData: { ids }, inspectionComponent, testData }) => {
        await startInspection(ids);
        await page.goto(`/de/app/cadet/${ids.cadetIds[2]}`);
        
        await expect(async () => {
            await page.reload();
            await expect(inspectionComponent.div_header).toContainText(german.cadetDetailPage.inspection["header.inspection"]);
        }).toPass();

        await test.step('inspection step 0', async () => Promise.all([
            expect(inspectionComponent.div_oldDeficiency_list).toHaveCount(6),
            expect(inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[0])).toBeHidden(),

            expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[0])).toBeVisible(),
            expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[1])).toBeVisible(),
            expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[2])).toBeVisible(),
            expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[3])).toBeVisible(),
            expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[4])).toBeVisible(),
            expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[5])).toBeVisible(),
        ]));

        await expect(inspectionComponent.btn_inspect).toBeVisible();
        await inspectionComponent.btn_inspect.click();
        await expect(inspectionComponent.btn_inspect).toBeDisabled();
        await expect(inspectionComponent.div_header).toContainText(german.cadetDetailPage.inspection["header.inspecting"]);

        await test.step('inspection step 1', async () => {
            await Promise.all([
                expect(inspectionComponent.div_oldDeficiency_list).toHaveCount(6),
                expect(inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[0])).toBeVisible(),
                expect(inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[1])).toBeVisible(),
                expect(inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[2])).toBeVisible(),
                expect(inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[3])).toBeVisible(),
                expect(inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[4])).toBeVisible(),
                expect(inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[5])).toBeVisible(),
            ]);

            await inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[2]).check();
            await inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[3]).check();
            await inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[4]).check();
        });

        await expect(inspectionComponent.btn_step1_continue).toBeVisible();
        await inspectionComponent.btn_step1_continue.click();
        await expect(inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[0])).toBeHidden();

        await test.step('inspection step 2', async () => {

            await Promise.all([
                expect(inspectionComponent.div_oldDeficiency_list).toHaveCount(3),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[0])).toBeVisible(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[1])).toBeVisible(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[2])).toBeHidden(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[3])).toBeHidden(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[4])).toBeHidden(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[5])).toBeVisible(),
            ]);

            await expect(inspectionComponent.div_step2_unresolvedDefHeader).toContainText("3");
            await expect(inspectionComponent.div_step2_unifComplete).toContainText(german.common.cadet.uniformComplete.false);

        });

        await test.step('add new deficiencies', async () => {
            await expect(inspectionComponent.div_newDeficiency_list).toHaveCount(0);

            await inspectionComponent.btn_step2_newDef.click();
            await expect(inspectionComponent.div_newDeficiency_list).toHaveCount(1);
            await expect(inspectionComponent.div_newDeficiency(0)).toBeVisible();

            await inspectionComponent.sel_newDef_type(0).selectOption(testData.newDefs.cadet.type);
            await inspectionComponent.txt_newDef_description(0).fill(testData.newDefs.cadet.description);
            await inspectionComponent.txt_newDef_comment(0).fill(testData.newDefs.cadet.comment);

            await inspectionComponent.btn_step2_newDef.click();
            await expect(inspectionComponent.div_newDeficiency(1)).toBeVisible();
            await inspectionComponent.sel_newDef_type(1).selectOption(testData.newDefs.cadetMaterialOther.type);
            await inspectionComponent.sel_newDef_material(1).selectOption("other");
            await expect(inspectionComponent.sel_newDef_materialGroup(1)).toBeVisible();
            await inspectionComponent.sel_newDef_materialGroup(1).selectOption(testData.newDefs.cadetMaterialOther.materialGroup!);
            await inspectionComponent.sel_newDef_materialType(1).selectOption(testData.newDefs.cadetMaterialOther.materialType!);
            await inspectionComponent.txt_newDef_comment(1).fill(testData.newDefs.cadetMaterialOther.comment!);

            await inspectionComponent.btn_step2_newDef.click();
            await expect(inspectionComponent.div_newDeficiency(2)).toBeVisible();
            await inspectionComponent.sel_newDef_type(2).selectOption(testData.newDefs.uniform.type);
            await inspectionComponent.sel_newDef_uniform(2).selectOption(testData.newDefs.uniform.uniform!);
            await inspectionComponent.txt_newDef_comment(2).fill(testData.newDefs.uniform.comment);
        });

        await test.step('submit', async () => {
            await inspectionComponent.btn_step2_submit.click();
            const toast = new ToastTestComponent(page);
            await expect(toast.toast_success).toBeVisible();
            await expect(toast.toast_success).toContainText(german.cadetDetailPage.inspection["message.saved"]);

            await expect(inspectionComponent.div_newDeficiency_list).toHaveCount(0);
            await expect(inspectionComponent.div_oldDeficiency_list).toHaveCount(6);

            await await Promise.all([
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[0])).toBeVisible(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[1])).toBeVisible(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[2])).toBeHidden(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[3])).toBeHidden(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[4])).toBeHidden(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[5])).toBeVisible(),

                expect(inspectionComponent.div_ci.getByText(testData.newDefs.cadet.comment)).toBeVisible(),
                expect(inspectionComponent.div_ci.getByText(testData.newDefs.cadetMaterialOther.comment)).toBeVisible(),
                expect(inspectionComponent.div_ci.getByText(testData.newDefs.uniform.comment)).toBeVisible(),
            ]);
        });
    });

    test('active inspection state, previously inspected', async ({ page, staticData: { ids }, inspectionComponent, testData }) => {
        await test.step('setup - create previous inspection state', async () => {
            // Start the inspection
            await startInspection(ids);

            // Create cadet inspection record
            await prisma.cadetInspection.create({
                data: {
                    id: ids.dynamic.firstInspection.id,
                    fk_inspection: testData.inspectionId,
                    fk_cadet: ids.cadetIds[2],
                    uniformComplete: false,
                    inspector: 'test4'
                }
            });

            // Mark specific deficiencies as resolved (unresolvedIds[2], [3], [4])
            await prisma.deficiency.updateMany({
                where: {
                    id: {
                        in: [testData.unresolvedIds[2], testData.unresolvedIds[3], testData.unresolvedIds[4]]
                    }
                },
                data: {
                    dateResolved: new Date(),
                    userResolved: 'test4',
                    fk_inspection_resolved: testData.inspectionId
                }
            });

            // Create the 3 new deficiencies from first inspection
            await prisma.deficiency.createMany({
                data: [
                    {
                        id: ids.dynamic.firstInspection.newDefIds[0],
                        fk_deficiencyType: testData.newDefs.cadet.type,
                        description: testData.newDefs.cadet.description,
                        comment: testData.newDefs.cadet.comment,
                        userCreated: 'test4',
                        userUpdated: 'test4',
                        fk_inspection_created: testData.inspectionId
                    },
                    {
                        id: ids.dynamic.firstInspection.newDefIds[1],
                        fk_deficiencyType: testData.newDefs.cadetMaterialOther.type,
                        description: testData.newDefs.cadetMaterialOther.description,
                        comment: testData.newDefs.cadetMaterialOther.comment,
                        userCreated: 'test4',
                        userUpdated: 'test4',
                        fk_inspection_created: testData.inspectionId
                    },
                    {
                        id: ids.dynamic.firstInspection.newDefIds[2],
                        fk_deficiencyType: testData.newDefs.uniform.type,
                        description: testData.newDefs.uniform.description,
                        comment: testData.newDefs.uniform.comment,
                        userCreated: 'test4',
                        userUpdated: 'test4',
                        fk_inspection_created: testData.inspectionId
                    }
                ]
            });

            // Create cadet deficiency records for the new deficiencies
            await prisma.cadetDeficiency.createMany({
                data: [
                    {
                        deficiencyId: ids.dynamic.firstInspection.newDefIds[0],
                        fk_cadet: ids.cadetIds[2]
                    },
                    {
                        deficiencyId: ids.dynamic.firstInspection.newDefIds[1],
                        fk_cadet: ids.cadetIds[2],
                        fk_material: ids.materialIds[7]
                    },
                ]
            });

            // Create uniform deficiency records for the new uniform deficiency
            await prisma.uniformDeficiency.create({
                data: {
                    deficiencyId: ids.dynamic.firstInspection.newDefIds[2],
                    fk_uniform: ids.uniformIds[0][46]
                }
            })

        });

        await page.goto(`/de/app/cadet/${ids.cadetIds[2]}`);

        await test.step('inspection step 0: verify unresolved deficiencies and new deficiencies are shown', async () => {
            await expect(inspectionComponent.div_header).toContainText(german.cadetDetailPage.inspection["header.inspection"]);

            // Should show 6 deficiencies: 3 unresolved old + 3 new from previous inspection
            await expect(inspectionComponent.div_oldDeficiency_list).toHaveCount(6);

            // Check unresolved old deficiencies are visible
            await Promise.all([
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[0])).toBeVisible(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[1])).toBeVisible(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[5])).toBeVisible(),
            ]);

            // Check resolved old deficiencies are hidden
            await Promise.all([
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[2])).toBeHidden(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[3])).toBeHidden(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[4])).toBeHidden(),
            ]);

            // Check new deficiencies from previous inspection are visible
            await Promise.all([
                expect(inspectionComponent.div_ci.getByText(testData.newDefs.cadet.comment)).toBeVisible(),
                expect(inspectionComponent.div_ci.getByText(testData.newDefs.cadetMaterialOther.comment)).toBeVisible(),
                expect(inspectionComponent.div_ci.getByText(testData.newDefs.uniform.comment)).toBeVisible(),
            ]);
        });

        await expect(inspectionComponent.btn_inspect).toBeVisible();
        await inspectionComponent.btn_inspect.click();
        await expect(inspectionComponent.btn_inspect).toBeDisabled();
        await expect(inspectionComponent.div_header).toContainText(german.cadetDetailPage.inspection["header.inspecting"]);

        await test.step('inspection step 1: verify previously resolved deficiencies are checked, resolve all remaining', async () => {
            // Should show all 9 deficiencies: 6 original
            await expect(inspectionComponent.div_oldDeficiency_list).toHaveCount(6);

            // Previously resolved deficiencies should already be checked
            await Promise.all([
                expect(inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[2])).toBeChecked(),
                expect(inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[3])).toBeChecked(),
                expect(inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[4])).toBeChecked(),
            ]);

            // Unresolved original deficiencies should not be checked yet
            await Promise.all([
                expect(inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[0])).not.toBeChecked(),
                expect(inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[1])).not.toBeChecked(),
                expect(inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[5])).not.toBeChecked(),
            ]);

            // New deficiencies from previous inspection should not be visible
            await Promise.all([
                expect(inspectionComponent.div_oldDeficiency(ids.dynamic.firstInspection.newDefIds[0])).toBeHidden(),
                expect(inspectionComponent.div_oldDeficiency(ids.dynamic.firstInspection.newDefIds[1])).toBeHidden(),
                expect(inspectionComponent.div_oldDeficiency(ids.dynamic.firstInspection.newDefIds[2])).toBeHidden(),
            ]);

            // Resolve all remaining deficiencies (original + new)
            await inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[0]).check();
            await inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[1]).check();
            await inspectionComponent.chk_olddef_resolved(testData.unresolvedIds[5]).check();
        });

        await expect(inspectionComponent.btn_step1_continue).toBeVisible();
        await inspectionComponent.btn_step1_continue.click();

        await test.step('inspection step 2: verify all old deficiencies resolved, modify existing new deficiencies', async () => {
            // All old deficiencies should be resolved (count 0)
            await expect(inspectionComponent.div_oldDeficiency_list).toHaveCount(0);
            await expect(inspectionComponent.div_step2_unresolvedDefHeader).toContainText(german.cadetDetailPage.inspection["label.amountUnresolved#zero"]);
            await expect(inspectionComponent.div_step2_unifComplete).toContainText(german.common.cadet.uniformComplete.false);

            // Should show 3 new deficiencies from previous inspection
            await expect(inspectionComponent.div_newDeficiency_list).toHaveCount(3);
            await expect(inspectionComponent.div_newDeficiency(0)).toBeVisible();
            await expect(inspectionComponent.div_newDeficiency(1)).toBeVisible();
            await expect(inspectionComponent.div_newDeficiency(2)).toBeVisible();

            // Verify type select boxes are disabled for existing deficiencies
            await Promise.all([
                expect(inspectionComponent.sel_newDef_type(0)).toBeDisabled(),
                expect(inspectionComponent.sel_newDef_type(1)).toBeDisabled(),
                expect(inspectionComponent.sel_newDef_type(2)).toBeDisabled(),
            ]);

            // Delete the uniform deficiency (index 2)
            await inspectionComponent.btn_newDef_delete(2).click();
            await expect(inspectionComponent.div_newDeficiency_list).toHaveCount(2);

            // Add a new deficiency
            await inspectionComponent.btn_step2_newDef.click();
            await expect(inspectionComponent.div_newDeficiency_list).toHaveCount(3);

            // Configure the new deficiency
            await inspectionComponent.sel_newDef_type(2).selectOption(ids.deficiencyTypeIds[2]);
            await inspectionComponent.sel_newDef_uniform(2).selectOption(ids.uniformIds[0][48]);
            await inspectionComponent.txt_newDef_comment(2).fill("Comment: CadetUniform is the wrong size");

            // Verify the new deficiency type selector is enabled
            await expect(inspectionComponent.sel_newDef_type(2)).toBeEnabled();
        });

        await test.step('save second inspection', async () => {
            await inspectionComponent.btn_step2_submit.click();
            const toast = new ToastTestComponent(page);
            await expect(toast.toast_success).toBeVisible();
            await expect(toast.toast_success).toContainText(german.cadetDetailPage.inspection["message.saved"]);

            // Should show 0 new deficiency form rows
            await expect(inspectionComponent.div_newDeficiency_list).toHaveCount(0);

            // Should show 3 total deficiencies (2 existing + 1 new)
            await expect(inspectionComponent.div_oldDeficiency_list).toHaveCount(3);

            // Verify the remaining deficiencies are visible
            await Promise.all([
                expect(inspectionComponent.div_ci.getByText(testData.newDefs.cadet.comment)).toBeVisible(),
                expect(inspectionComponent.div_ci.getByText(testData.newDefs.cadetMaterialOther.comment)).toBeVisible(),
                expect(inspectionComponent.div_ci.getByText("Comment: CadetUniform is the wrong size")).toBeVisible(),
            ]);

            // Verify the deleted uniform deficiency is no longer visible
            await expect(inspectionComponent.div_ci.getByText(testData.newDefs.uniform.comment)).toBeHidden();

            // Verify all original deficiencies are hidden (all resolved)
            await Promise.all([
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[0])).toBeHidden(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[1])).toBeHidden(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[2])).toBeHidden(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[3])).toBeHidden(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[4])).toBeHidden(),
                expect(inspectionComponent.div_oldDeficiency(testData.unresolvedIds[5])).toBeHidden(),
            ]);
        });
    });

});
