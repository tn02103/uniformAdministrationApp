import test, { Page, expect } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { CadetInspectionComponent } from "../../../pages/cadet/cadetInspection.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { removeInspection, startInspection, testActiveInspection } from "../../../testData/dynamicData";
import { testDeficiencies, testDeficiencyTypes } from "../../../testData/staticData";
import t from "../../../../public/locales/de";
import { format } from "date-fns";
import { prisma } from "@/lib/db";

test.use({ storageState: adminAuthFile });
test.describe('', async () => {
    let page: Page;
    let inspectionComponent: CadetInspectionComponent;
    const cadetId = 'c4d33a71-3c11-11ee-8084-0068eb8ba754'; // Sven Keller

    const unresolvedDefIds = testDeficiencies
        .filter(def => /Sven Keller Unresolved/.test(def.comment))
        .sort((a, b) => a.dateCreated.getTime() - b.dateCreated.getTime())
        .map(cd => cd.id);

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
    });

    // TESTS
    // E2E0265
    test('validate step0 defList prev. Inspction', async () => {
        await removeInspection();
        await page.reload();
        await Promise.all([
            test.step('visible with correct sortorder', async () => {
                const div_list = inspectionComponent.div_ci.getByTestId(/div_olddef_/);

                await expect((await div_list.all()).length).toBe(unresolvedDefIds.length);
                await Promise.all(
                    unresolvedDefIds.map(async (id, index) =>
                        expect.soft(div_list.locator(`nth=${index}`)).toHaveAttribute('data-testid', `div_olddef_${id}`)
                    )
                );
            }),
            test.step('not shown', async () => {
                const resolvedIds = testDeficiencies
                    .filter(def => /Sven Keller Resolved/.test(def.comment))
                    .map(cd => cd.id);
                await Promise.all([
                    resolvedIds.map(async (id) =>
                        expect.soft(inspectionComponent.div_oldDeficiency(id)).not.toBeVisible()
                    )
                ]);
            }),
        ]);
        await startInspection();
    });
    // E2E0267
    test('validate step1 devList prev. Inspection', async () => {
        await test.step('setup', async () => {
            await inspectionComponent.btn_inspect.click();
        });

        await test.step('visible with correct sortorder', async () => {
            const div_list = inspectionComponent.div_ci.getByTestId(/div_olddef_/);

            await expect((await div_list.all()).length).toBe(unresolvedDefIds.length);
            await Promise.all(
                unresolvedDefIds.map(async (id, index) =>
                    expect.soft(div_list.locator(`nth=${index}`)).toHaveAttribute('data-testid', `div_olddef_${id}`)
                )
            );
            await Promise.all(
                unresolvedDefIds.map(async (id) =>
                    expect.soft(inspectionComponent.chk_olddef_resolved(id)).not.toBeChecked()
                )
            );
        });
        await test.step('not shown', async () => {
            const resolvedIds = testDeficiencies
                .filter(def => /Sven Keller Resolved/.test(def.comment))
                .map(cd => cd.id);
            await Promise.all([
                resolvedIds.map(async (id) =>
                    expect.soft(inspectionComponent.div_oldDeficiency(id)).not.toBeVisible()
                )
            ]);
        });
    });
    // E2E0268
    test('validate step1 chk_resolved', async () => {
        const id = 'ccffb98b-3dcf-11ee-ac41-0068eb8ba754';
        await inspectionComponent.btn_inspect.click();
        await expect(inspectionComponent.chk_olddef_resolved(id)).not.toBeChecked();
        await expect(inspectionComponent.lbl_olddef_resolved(id)).toHaveCSS('color', /bs-danger-rgb/);
        await expect(inspectionComponent.lbl_olddef_resolved(id)).toHaveText(t.common.deficiency.resolved.false);

        await inspectionComponent.chk_olddef_resolved(id).check();
        await expect(inspectionComponent.lbl_olddef_resolved(id)).toHaveCSS('color', /bs-success-rgb/);
        await expect(inspectionComponent.lbl_olddef_resolved(id)).toHaveText(t.common.deficiency.resolved.true);
    });
    // E2E0269
    test('validate oldDeficiencyRow data', async () => {
        const deficiency = testDeficiencies.find(d => d.id === 'ccffb98b-3dcf-11ee-ac41-0068eb8ba754');
        if (!deficiency) throw new Error('Could not find deficiency');
        const type = testDeficiencyTypes.find(t => t.id === deficiency?.fk_deficiencyType);
        if (!type) throw new Error('Could not find deficiencyType');

        await test.step('validate visiblity of components step0', async () => {
            await Promise.all([
                expect.soft(inspectionComponent.chk_olddef_resolved(deficiency.id)).not.toBeVisible(),
                expect.soft(inspectionComponent.div_olddef_description(deficiency.id)).toBeVisible(),
                expect.soft(inspectionComponent.div_olddef_type(deficiency.id)).toBeVisible(),
                expect.soft(inspectionComponent.div_olddef_created(deficiency.id)).toBeVisible(),
                expect.soft(inspectionComponent.div_olddef_comment(deficiency.id)).toBeVisible(),
            ]);
        });
        await test.step('validate content of components', async () => {
            await Promise.all([
                expect.soft(inspectionComponent.div_olddef_description(deficiency.id)).toContainText(deficiency.description),
                expect.soft(inspectionComponent.div_olddef_type(deficiency.id)).toContainText(type.name),
                expect.soft(inspectionComponent.div_olddef_created(deficiency.id)).toContainText(format(deficiency.dateCreated, "dd.MM.yyyy")),
                expect.soft(inspectionComponent.div_olddef_comment(deficiency.id)).toContainText(deficiency.comment),
            ]);
        });
        await test.step('goto step1', async () => {
            await inspectionComponent.btn_inspect.click();
        });
        await test.step('validate visiblity of components step1', async () => {
            await Promise.all([
                expect.soft(inspectionComponent.chk_olddef_resolved(deficiency.id)).toBeVisible(),
                expect.soft(inspectionComponent.div_olddef_description(deficiency.id)).toBeVisible(),
                expect.soft(inspectionComponent.div_olddef_type(deficiency.id)).toBeVisible(),
                expect.soft(inspectionComponent.div_olddef_created(deficiency.id)).toBeVisible(),
                expect.soft(inspectionComponent.div_olddef_comment(deficiency.id)).toBeVisible(),
            ]);
        });
        await test.step('goto step2', async () => {
            await inspectionComponent.btn_step1_continue.click();
        });
        await test.step('validate visiblity of components step2', async () => {
            await Promise.all([
                expect.soft(inspectionComponent.chk_olddef_resolved(deficiency.id)).not.toBeVisible(),
                expect.soft(inspectionComponent.div_olddef_description(deficiency.id)).toBeVisible(),
                expect.soft(inspectionComponent.div_olddef_type(deficiency.id)).toBeVisible(),
                expect.soft(inspectionComponent.div_olddef_created(deficiency.id)).not.toBeVisible(),
                expect.soft(inspectionComponent.div_olddef_comment(deficiency.id)).not.toBeVisible(),
            ]);
        });
    });
    // E2E0270
    test('validate step2 unresolvedDefCountLabel', async () => {
        await test.step('goto step2 none resolve', async () => {
            await inspectionComponent.btn_inspect.click();
            await inspectionComponent.btn_step1_continue.click();
        });
        await test.step('validate label all unresolved', async () => {
            await Promise.all([
                expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toHaveClass(/text-danger/),
                expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toContainText('Unbehoben'),
                expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toContainText(String(unresolvedDefIds.length)),
            ]);
        });
        await test.step('resolve 2 Deficiencies', async () => {
            await inspectionComponent.btn_step2_back.click();
            await inspectionComponent.chk_olddef_resolved(unresolvedDefIds[0]).click();
            await inspectionComponent.chk_olddef_resolved(unresolvedDefIds[1]).click();
            await inspectionComponent.btn_step1_continue.click();
        });
        await test.step('validate label partial resolved', async () => {
            await Promise.all([
                expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toHaveClass(/text-danger/),
                expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toContainText("Unbehoben"),
                expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toContainText(String(unresolvedDefIds.length - 2)),
            ]);
        });
        await test.step('resolve all Deficiencies', async () => {
            await inspectionComponent.btn_step2_back.click();
            for (let i = 2; i < unresolvedDefIds.length; i++) {
                await inspectionComponent.chk_olddef_resolved(unresolvedDefIds[i]).click();
            }
            await inspectionComponent.btn_step1_continue.click();
        });
        await test.step('validate label all resolved', async () => {
            await expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toHaveClass(/text-success/);
            await expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toHaveText('Behoben');
        });
    });
    // E2E0279
    test('validate step2 uniformCompleteLabel', async () => {
        await test.step('validate complete Uniform', async () => {
            await page.goto('/cadet/0d06427b-3c12-11ee-8084-0068eb8ba754');
            await inspectionComponent.btn_inspect.click();

            await expect.soft(inspectionComponent.div_step2_unifComplete).toHaveClass(/text-success/);
            // TODO replace text with translation
            await expect.soft(inspectionComponent.div_step2_unifComplete).toContainText('Uniform vollständig');
        });
        await test.step('validate uncomplete Uniform', async () => {
            await page.goto(`/cadet/${cadetId}`);
            await inspectionComponent.btn_inspect.click();
            await inspectionComponent.btn_step1_continue.click();

            await expect.soft(inspectionComponent.div_step2_unifComplete).toHaveClass(/text-danger/);
            // TODO replace text with translation
            await expect.soft(inspectionComponent.div_step2_unifComplete).toContainText('Uniform unvollständig');
        });
    });
});