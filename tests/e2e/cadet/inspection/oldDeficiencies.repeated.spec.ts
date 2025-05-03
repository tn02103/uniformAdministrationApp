import { expect } from "playwright/test";
import { CadetInspectionComponent } from "../../../_playwrightConfig/pages/cadet/cadetInspection.component";
import { adminTest } from "../../../_playwrightConfig/setup";
import { insertSvenKellerFirstInspection, startInspection, svenKellerFirstInspectionData } from "../../../_playwrightConfig/testData/dynamicData";

type Fixture = {
    inspectionComponent: CadetInspectionComponent;
};
const test = adminTest.extend<Fixture>({
    inspectionComponent: async ({ page, staticData }, use) => {
        const inspectionComponent = new CadetInspectionComponent(page);
        await page.goto(`/de/app/cadet/${staticData.ids.cadetIds[2]}`);
        await inspectionComponent.div_step0_loading.isHidden();
        await use(inspectionComponent);
    }
});
test.beforeAll(async ({ staticData: { index } }) => {
    await startInspection(index);
    await insertSvenKellerFirstInspection(index);
});
test.afterAll(async ({ staticData: { cleanup } }) => {
    await cleanup.inspection();
});


test('E2E0264: validate step0 defList after Inspction', async ({ inspectionComponent, staticData: { index } }) => {
    await test.step('resolved not shown', async () => {
        await expect.soft(
            inspectionComponent.div_oldDeficiency(
                svenKellerFirstInspectionData(index).oldDefIdsToResolve[0]
            )
        ).not.toBeVisible();
        await expect.soft(
            inspectionComponent.div_oldDeficiency(
                svenKellerFirstInspectionData(index).oldDefIdsToResolve[1]
            )
        ).not.toBeVisible();
    });

    await test.step('new are shown', async () =>
        Promise.all(
            svenKellerFirstInspectionData(index).newDeficiencyList.map(async (i) =>
                expect.soft(inspectionComponent.div_oldDeficiency(i.id)).toBeVisible()
            )
        )
    );
});

test('E2E0266: validate step1 devList after Inspection', async ({ inspectionComponent, staticData: { index, ids } }) => {
    await test.step('setup', async () => {
        await inspectionComponent.btn_inspect.click();
    });
    const activeIds = [ids.deficiencyIds[5], ids.deficiencyIds[10], ids.deficiencyIds[1], ids.deficiencyIds[9], ids.deficiencyIds[15], ids.deficiencyIds[13]];
    const div_list = inspectionComponent.div_ci.getByTestId(/div_olddef_/);

    await test.step('visible with correct sortorder', async () => {
        await expect(div_list).toHaveCount(activeIds.length);
        await Promise.all(
            activeIds.map(async (id, index) =>
                expect.soft(div_list.locator(`nth=${index}`)).toHaveAttribute('data-testid', `div_olddef_${id}`)
            )
        );
    });
    await test.step('correct are checked as resolved', async () => {
        await Promise.all(
            svenKellerFirstInspectionData(index).oldDefIdsToResolve.map(async (id) =>
                expect.soft(inspectionComponent.chk_olddef_resolved(id)).toBeChecked()
            )
        );
        await Promise.all(
            activeIds
                .filter(id => !svenKellerFirstInspectionData(index).oldDefIdsToResolve.find(i => i === id))
                .map(async (id) =>
                    expect.soft(inspectionComponent.chk_olddef_resolved(id)).not.toBeChecked()
                )
        );
    });

    await test.step('not shown', async () => {
        const resolvedIds = [ids.deficiencyIds[0], ids.deficiencyIds[2], ids.deficiencyIds[6]];

        await Promise.all([
            ...resolvedIds.map(async (id) =>
                expect.soft(inspectionComponent.div_oldDeficiency(id)).not.toBeVisible()
            ),
            ...svenKellerFirstInspectionData(index).newDeficiencyList.map(async (insp) =>
                expect.soft(inspectionComponent.div_oldDeficiency(insp.id)).not.toBeVisible()
            ),
        ]);
    });
});