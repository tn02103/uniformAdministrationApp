import test, { Page, expect } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { CadetInspectionComponent } from "../../../pages/cadet/cadetInspection.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { insertSvenKellerFirstInspection, startInspection, svenKellerFirstInspectionData } from "../../../testData/dynamicData";
import { testDeficiencies } from "../../../testData/staticData";

test.use({ storageState: adminAuthFile });
test.describe('', async () => {
    let page: Page;
    let inspectionComponent: CadetInspectionComponent;
    const cadetId = 'c4d33a71-3c11-11ee-8084-0068eb8ba754'; // Sven Keller

    // SETUPS
    test.beforeAll(async ({ browser }) => {
        const getPage = async () => {
            page = await (await browser.newContext()).newPage();
            inspectionComponent = new CadetInspectionComponent(page);
        }
        const dataCleanup = async () => {
            await cleanupData();
            await startInspection();
            await insertSvenKellerFirstInspection();
        }

        await Promise.all([getPage(), dataCleanup()]);
        await page.goto(`de/app/cadet/c4d33a71-3c11-11ee-8084-0068eb8ba754`); // Sven Keller
    });
    test.afterAll(() => page.close());
    test.beforeEach(async () => {
        await page.reload();
        await expect(inspectionComponent.div_step0_loading).not.toBeVisible();
    });

    // TESTS
    // E2E0264
    test('validate step0 defList after Inspction', async () => {
        await test.step('resolved not shown', async () => {
            await expect.soft(
                inspectionComponent.div_oldDeficiency(
                    svenKellerFirstInspectionData.oldDefIdsToResolve[0]
                )
            ).not.toBeVisible();
            await expect.soft(
                inspectionComponent.div_oldDeficiency(
                    svenKellerFirstInspectionData.oldDefIdsToResolve[1]
                )
            ).not.toBeVisible();
        });

        await test.step('new are shown', async () =>
            Promise.all(
                svenKellerFirstInspectionData.newDeficiencyList.map(async (i) =>
                    expect.soft(inspectionComponent.div_oldDeficiency(i.id)).toBeVisible()
                )
            )
        );
    });
    // E2E0266
    test.skip('validate step1 devList after Inspection', async () => {
        await test.step('setup', async () => {
            await inspectionComponent.btn_inspect.click();
        });
        const activeIds = testDeficiencies
            .filter(def => /Sven Keller Unresolved/.test(def.comment))
            .sort((a, b) => a.dateCreated.getTime() - b.dateCreated.getTime())
            .map(cd => cd.id);
        const div_list = inspectionComponent.div_ci.getByTestId(/div_olddef_/);


        await test.step('visible with correct sortorder', async () => {
            await expect((await div_list.all()).length).toBe(activeIds.length);
            await Promise.all(
                activeIds.map(async (id, index) =>
                    expect.soft(div_list.locator(`nth=${index}`)).toHaveAttribute('data-testid', `div_olddef_${id}`)
                )
            );
            await Promise.all(
                svenKellerFirstInspectionData.oldDefIdsToResolve.map(async (id) =>
                    expect.soft(inspectionComponent.chk_olddef_resolved(id)).toBeChecked()
                )
            );

        });
        await test.step('correct are checked as resolved', async () => {
            await Promise.all(
                svenKellerFirstInspectionData.oldDefIdsToResolve.map(async (id) =>
                    expect.soft(inspectionComponent.chk_olddef_resolved(id)).toBeChecked()
                )
            );
            await Promise.all(
                activeIds
                    .filter(id => !svenKellerFirstInspectionData.oldDefIdsToResolve.find(i => i === id))
                    .map(async (id) =>
                        expect.soft(inspectionComponent.chk_olddef_resolved(id)).not.toBeChecked()
                    )
            );
        });

        await test.step('not shown', async () => {
            const resolvedIds = testDeficiencies
                .filter(def => /Sven Keller Resolved/.test(def.comment))
                .map(cd => cd.id);

            await Promise.all([
                ...resolvedIds.map(async (id) =>
                    expect.soft(inspectionComponent.div_oldDeficiency(id)).not.toBeVisible()
                ),
                ...svenKellerFirstInspectionData.newDeficiencyList.map(async (insp) =>
                    expect.soft(inspectionComponent.div_oldDeficiency(insp.id)).not.toBeVisible()
                ),
            ]);
        });
    });
});
