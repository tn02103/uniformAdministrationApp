import { expect } from "playwright/test";
import t from "../../../../public/locales/de";
import { adminTest, inspectorTest, userTest } from "../../../setup";
import { CadetInspectionComponent } from "../../../pages/cadet/cadetInspection.component";
import { insertSvenKellerFirstInspection, removeInspection, startInspection } from "../../../testData/dynamicData";
import { StaticData } from "../../../testData/staticDataLoader";

type Fixture = {
    inspectionComponent: CadetInspectionComponent;
    staticData: StaticData;
};
const test = adminTest.extend<Fixture>({
    inspectionComponent: async ({ page }, use) => use(new CadetInspectionComponent(page)),
    staticData: async ({ staticData }: {staticData: StaticData}, use: (r: StaticData) => Promise<void>) => {
        await startInspection(staticData.index);
        await use(staticData);
        await removeInspection(staticData.index);
    },
});

userTest('Authroles: user', async ({ page, staticData: { ids } }) => {
    const comp = new CadetInspectionComponent(page);
    await page.goto(`de/app/cadet/${ids.cadetIds[2]}`); // Sven Keller
    await expect(comp.div_ci).not.toBeVisible();
});
inspectorTest('Authroles: inspector', async ({ page, staticData: { ids } }) => {
    const comp = new CadetInspectionComponent(page);
    await page.goto(`de/app/cadet/${ids.cadetIds[2]}`); // Sven Keller
    await expect(comp.div_ci).toBeVisible();
});

test('E2E0262: navigation with activeDeficiencies', async ({ page, inspectionComponent, staticData: { ids } }) => {
    await page.goto(`de/app/cadet/${ids.cadetIds[2]}`); // Sven Keller
    await expect(inspectionComponent.div_step0_loading).not.toBeVisible();

    await test.step('step0 visibility', async () => {
        await Promise.all([
            expect.soft(inspectionComponent.btn_inspect).toBeVisible(),
            expect.soft(inspectionComponent.btn_step1_back).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step1_continue).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_back).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_submit).not.toBeVisible(),
        ]);
    });
    await test.step('step0 -> step1', async () => {
        await inspectionComponent.btn_inspect.click();

        await Promise.all([
            expect.soft(inspectionComponent.btn_inspect).toBeDisabled(),
            expect.soft(inspectionComponent.btn_step1_back).toBeVisible(),
            expect.soft(inspectionComponent.btn_step1_continue).toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_back).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_submit).not.toBeVisible(),
        ]);
    });
    await test.step('step1 -> step2', async () => {
        await inspectionComponent.btn_step1_continue.click();

        await Promise.all([
            expect.soft(inspectionComponent.btn_inspect).toBeDisabled(),
            expect.soft(inspectionComponent.btn_step1_back).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step1_continue).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_back).toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_submit).toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_back).toHaveText(t.common.actions.prevStep)
        ]);
    });
    await test.step('step2 -> step1', async () => {
        await inspectionComponent.btn_step2_back.click();

        await Promise.all([
            expect.soft(inspectionComponent.btn_inspect).toBeDisabled(),
            expect.soft(inspectionComponent.btn_step1_back).toBeVisible(),
            expect.soft(inspectionComponent.btn_step1_continue).toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_back).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_submit).not.toBeVisible(),
        ]);
    });
    await test.step('step1 -> step0', async () => {
        await inspectionComponent.btn_step1_back.click();

        await Promise.all([
            expect.soft(inspectionComponent.btn_inspect).toBeVisible(),
            expect.soft(inspectionComponent.btn_step1_back).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step1_continue).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_back).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_submit).not.toBeVisible(),
        ]);
    });
});

test('E2E0263: navigation without activeDeficiencies', async ({ page, inspectionComponent, staticData: { ids } }) => {
    await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`); // Marie Becker
    await expect(inspectionComponent.div_step0_loading).not.toBeVisible();

    await test.step('step0 visibility', async () => {
        await Promise.all([
            expect.soft(inspectionComponent.btn_inspect).toBeVisible(),
            expect.soft(inspectionComponent.btn_step1_back).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step1_continue).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_back).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_submit).not.toBeVisible(),
        ]);
    });
    await test.step('step0 -> step2', async () => {
        await inspectionComponent.btn_inspect.click();

        await Promise.all([
            expect.soft(inspectionComponent.btn_inspect).toBeDisabled(),
            expect.soft(inspectionComponent.btn_step1_back).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step1_continue).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_back).toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_submit).toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_back).toHaveText(t.common.actions.cancel),
        ]);
    });
    await test.step('step2 -> step0', async () => {
        await inspectionComponent.btn_step2_back.click();

        await Promise.all([
            expect.soft(inspectionComponent.btn_inspect).toBeVisible(),
            expect.soft(inspectionComponent.btn_step1_back).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step1_continue).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_back).not.toBeVisible(),
            expect.soft(inspectionComponent.btn_step2_submit).not.toBeVisible(),
        ]);
    });
});

test('E2E0276: validate header', async ({ page, inspectionComponent, staticData: { ids, index } }) => {
    await page.goto(`de/app/cadet/${ids.cadetIds[2]}`); // Sven Keller
    await expect(inspectionComponent.div_step0_loading).not.toBeVisible();

    await test.step('active Inspection not inspected', async () => {
        await expect(inspectionComponent.div_header).toHaveText('Uniformkontrolle');
        await expect(inspectionComponent.btn_inspect).toBeVisible();
        await expect(inspectionComponent.btn_inspect).toBeEnabled();
        await expect(inspectionComponent.btn_inspect).toHaveClass(/btn-outline-warning/);
        await expect(inspectionComponent.icn_inspected).toHaveClass(/fa-clipboard-question/);
    });
    await test.step('inspecting cadet', async () => {
        await inspectionComponent.btn_inspect.click();
        await expect(inspectionComponent.div_header).toHaveText('VK kontrollieren');
        await expect(inspectionComponent.btn_inspect).toBeVisible();
        await expect(inspectionComponent.btn_inspect).toBeDisabled();
    });
    await test.step('cadet inspected', async () => {
        await insertSvenKellerFirstInspection(index);
        await page.reload();
        await expect(inspectionComponent.div_step0_loading).not.toBeVisible();

        await expect(inspectionComponent.div_header).toHaveText('Uniformkontrolle');
        await expect(inspectionComponent.btn_inspect).toBeVisible();
        await expect(inspectionComponent.btn_inspect).toBeEnabled();
        await expect(inspectionComponent.btn_inspect).toHaveClass(/btn-outline-success/);
        await expect(inspectionComponent.icn_inspected).toHaveClass(/fa-clipboard-check/);
    });
    await test.step('no active inspection', async () => {
        await removeInspection(index);
        await page.reload();
        await inspectionComponent.div_step0_loading.isHidden();

        await expect(inspectionComponent.div_header).toHaveText('Mängel');
        await expect(inspectionComponent.btn_inspect).not.toBeVisible();
    });
});
