import test, { Page, expect } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { CadetInspectionComponent } from "../../../pages/cadet/cadetInspection.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import t from "../../../../public/locales/de";
import { insertSvenKellerFirstInspection, removeInspection, startInspection } from "../../../testData/dynamicData";

test.use({ storageState: adminAuthFile });
test.describe('', () => {
    let page: Page;
    let inspectionComponent: CadetInspectionComponent;

    // SETUPS
    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();
        inspectionComponent = new CadetInspectionComponent(page);

        await cleanupData();
        await startInspection();
    });
    test.afterAll(() => page.close());


    // TESTS
    // E2E0262
    test('navigation with activeDeficiencies', async () => {
        await page.goto(`/cadet/c4d33a71-3c11-11ee-8084-0068eb8ba754`); // Sven Keller
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
    // E2E0263
    test('navigation without activeDeficiencies', async () => {
        await page.goto(`/cadet/0d06427b-3c12-11ee-8084-0068eb8ba754`); // Marie Ackerman
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
    //E2E0276
    test('validate header', async () => {
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
            await insertSvenKellerFirstInspection();
            await page.reload();

            await expect(inspectionComponent.div_header).toHaveText('Uniformkontrolle');
            await expect(inspectionComponent.btn_inspect).toBeVisible();
            await expect(inspectionComponent.btn_inspect).toBeEnabled();
            await expect(inspectionComponent.btn_inspect).toHaveClass(/btn-outline-success/);
            await expect(inspectionComponent.icn_inspected).toHaveClass(/fa-clipboard-check/);
        });
        await test.step('no active inspection', async () => {
            await removeInspection();
            await page.reload();

            await expect(inspectionComponent.div_header).toHaveText('Mängel');
            await expect(inspectionComponent.btn_inspect).not.toBeVisible();
        });
        await startInspection();
    })
});