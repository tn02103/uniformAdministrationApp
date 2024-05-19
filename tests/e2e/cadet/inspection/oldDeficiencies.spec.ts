import { expect } from "playwright/test";
import t from "../../../../public/locales/de";
import { adminTest } from "../../../setup";
import { CadetInspectionComponent } from "../../../pages/cadet/cadetInspection.component";
import { removeInspection, startInspection } from "../../../testData/dynamicData";
import { StaticData } from "../../../testData/staticDataLoader";

type Fixture = {
    inspectionComponent: CadetInspectionComponent;
    staticData: StaticData & {
        unresolvedIds: string[];
        resolvedIds: string[];
    }
};
const test = adminTest.extend<Fixture>({
    staticData: async ({ staticData }: { staticData: StaticData }, use: (arg0: any) => void) => {
        const { deficiencyIds } = staticData.ids;
        use({
            ...staticData,
            unresolvedIds: [deficiencyIds[5], deficiencyIds[10], deficiencyIds[1], deficiencyIds[9], deficiencyIds[13]],
            resolvedIds: [deficiencyIds[0], deficiencyIds[2], deficiencyIds[6]],
        });
    },
    inspectionComponent: async ({ page, staticData }, use) => {
        const inspectionComponent = new CadetInspectionComponent(page);
        await page.goto(`/de/app/cadet/${staticData.ids.cadetIds[2]}`); // Sven Keller
        await inspectionComponent.div_step0_loading.isHidden();
        await use(inspectionComponent);
    }
});
test.beforeAll(async ({ staticData: { index } }) => {
    await startInspection(index);
});
test.afterAll(async ({ staticData: { index } }) => {
    await removeInspection(index);
});

test('E2E0265: validate step0 defList prev. Inspction', async ({ page, inspectionComponent, staticData: { index, resolvedIds, unresolvedIds } }) => {
    await removeInspection(index);
    await page.reload();
    await expect(inspectionComponent.div_step0_loading).not.toBeVisible();
    await Promise.all([
        test.step('visible with correct sortorder', async () => {
            const div_list = inspectionComponent.div_ci.getByTestId(/div_olddef_/);

            await expect(div_list).toHaveCount(unresolvedIds.length);
            await Promise.all(
                unresolvedIds.map(async (id, index) =>
                    expect.soft(div_list.locator(`nth=${index}`)).toHaveAttribute('data-testid', `div_olddef_${id}`)
                )
            );
        }),
        test.step('not shown', async () => {
            await Promise.all([
                resolvedIds.map(async (id) =>
                    expect.soft(inspectionComponent.div_oldDeficiency(id)).not.toBeVisible()
                )
            ]);
        }),
    ]);
    await startInspection(index);
    await page.reload();
    await expect(inspectionComponent.div_step0_loading).not.toBeVisible();
});

test('E2E0267: validate step1 devList prev. Inspection', async ({inspectionComponent, staticData: { unresolvedIds, resolvedIds } }) => {
    await test.step('setup', async () => {
        await inspectionComponent.btn_inspect.click();
    });

    await test.step('visible with correct sortorder', async () => {
        const div_list = inspectionComponent.div_ci.getByTestId(/div_olddef_/);

        await expect(div_list).toHaveCount(unresolvedIds.length);
        await Promise.all(
            unresolvedIds.map(async (id, index) =>
                expect.soft(div_list.locator(`nth=${index}`)).toHaveAttribute('data-testid', `div_olddef_${id}`)
            )
        );
        await Promise.all(
            unresolvedIds.map(async (id) =>
                expect.soft(inspectionComponent.chk_olddef_resolved(id)).not.toBeChecked()
            )
        );
    });
    await test.step('not shown', async () => {
        await Promise.all(
            resolvedIds.map(async (id) =>
                expect.soft(inspectionComponent.div_oldDeficiency(id)).not.toBeVisible()
            )
        );
    });
});

test('E2E0268: validate step1 chk_resolved', async ({ inspectionComponent, staticData: { ids } }) => {
    const id = ids.deficiencyIds[1];
    await inspectionComponent.btn_inspect.click();
    await expect(inspectionComponent.chk_olddef_resolved(id)).not.toBeChecked();
    await expect(inspectionComponent.lbl_olddef_resolved(id)).toHaveCSS('color', "rgb(220, 53, 69)");
    await expect(inspectionComponent.lbl_olddef_resolved(id)).toHaveText(t.common.deficiency.resolved.false);

    await inspectionComponent.chk_olddef_resolved(id).check();
    await expect(inspectionComponent.lbl_olddef_resolved(id)).toHaveCSS('color', "rgb(25, 135, 84)");
    await expect(inspectionComponent.lbl_olddef_resolved(id)).toHaveText(t.common.deficiency.resolved.true);
});

test('E2E0269: validate oldDeficiencyRow data', async ({ inspectionComponent, staticData: { ids } }) => {
    await test.step('validate visiblity of components step0', async () => {
        await Promise.all([
            expect.soft(inspectionComponent.chk_olddef_resolved(ids.deficiencyIds[1])).not.toBeVisible(),
            expect.soft(inspectionComponent.div_olddef_description(ids.deficiencyIds[1])).toBeVisible(),
            expect.soft(inspectionComponent.div_olddef_type(ids.deficiencyIds[1])).toBeVisible(),
            expect.soft(inspectionComponent.div_olddef_created(ids.deficiencyIds[1])).toBeVisible(),
            expect.soft(inspectionComponent.div_olddef_comment(ids.deficiencyIds[1])).toBeVisible(),
        ]);
    });
    await test.step('validate content of components', async () => {
        await Promise.all([
            expect.soft(inspectionComponent.div_olddef_description(ids.deficiencyIds[1])).toContainText('Typ1-1146'),
            expect.soft(inspectionComponent.div_olddef_type(ids.deficiencyIds[1])).toContainText('Uniform'),
            expect.soft(inspectionComponent.div_olddef_created(ids.deficiencyIds[1])).toContainText('17.06.2023'),
            expect.soft(inspectionComponent.div_olddef_comment(ids.deficiencyIds[1])).toContainText('Uniform Deficiency Sven Keller Unresolved'),
        ]);
    });
    await test.step('goto step1', async () => {
        await inspectionComponent.btn_inspect.click();
    });
    await test.step('validate visiblity of components step1', async () => {
        await Promise.all([
            expect.soft(inspectionComponent.chk_olddef_resolved(ids.deficiencyIds[1])).toBeVisible(),
            expect.soft(inspectionComponent.div_olddef_description(ids.deficiencyIds[1])).toBeVisible(),
            expect.soft(inspectionComponent.div_olddef_type(ids.deficiencyIds[1])).toBeVisible(),
            expect.soft(inspectionComponent.div_olddef_created(ids.deficiencyIds[1])).toBeVisible(),
            expect.soft(inspectionComponent.div_olddef_comment(ids.deficiencyIds[1])).toBeVisible(),
        ]);
    });
    await test.step('goto step2', async () => {
        await inspectionComponent.btn_step1_continue.click();
    });
    await test.step('validate visiblity of components step2', async () => {
        await Promise.all([
            expect.soft(inspectionComponent.chk_olddef_resolved(ids.deficiencyIds[1])).not.toBeVisible(),
            expect.soft(inspectionComponent.div_olddef_description(ids.deficiencyIds[1])).toBeVisible(),
            expect.soft(inspectionComponent.div_olddef_type(ids.deficiencyIds[1])).toBeVisible(),
            expect.soft(inspectionComponent.div_olddef_created(ids.deficiencyIds[1])).not.toBeVisible(),
            expect.soft(inspectionComponent.div_olddef_comment(ids.deficiencyIds[1])).not.toBeVisible(),
        ]);
    });
});

test('E2E0270: validate step2 unresolvedDefCountLabel', async ({ inspectionComponent, staticData: { unresolvedIds } }) => {
    await test.step('goto step2 none resolve', async () => {
        await inspectionComponent.btn_inspect.click();
        await inspectionComponent.btn_step1_continue.click();
    });
    await test.step('validate label all unresolved', async () => {
        await Promise.all([
            expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toHaveClass(/text-danger/),
            expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toContainText(/unbehoben/),
            expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toContainText(String(unresolvedIds.length)),
        ]);
    });
    await test.step('resolve 2 Deficiencies', async () => {
        await inspectionComponent.btn_step2_back.click();
        await inspectionComponent.chk_olddef_resolved(unresolvedIds[0]).click();
        await inspectionComponent.chk_olddef_resolved(unresolvedIds[1]).click();
        await inspectionComponent.btn_step1_continue.click();
    });
    await test.step('validate label partial resolved', async () => {
        await Promise.all([
            expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toHaveClass(/text-danger/),
            expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toContainText(/unbehoben/),
            expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toContainText(String(unresolvedIds.length - 2)),
        ]);
    });
    await test.step('resolve all Deficiencies', async () => {
        await inspectionComponent.btn_step2_back.click();
        for (let i = 2; i < unresolvedIds.length; i++) {
            await inspectionComponent.chk_olddef_resolved(unresolvedIds[i]).click();
        }
        await inspectionComponent.btn_step1_continue.click();
    });
    await test.step('validate label all resolved', async () => {
        await expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toHaveClass(/text-success/);
        await expect.soft(inspectionComponent.div_step2_unresolvedDefHeader).toHaveText(/behoben/);
    });
});

test('E2E0279: validate step2 uniformCompleteLabel', async ({ page, inspectionComponent, staticData: { ids } }) => {
    await test.step('validate complete Uniform', async () => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`); // Marie Becker
        await inspectionComponent.btn_inspect.click();

        await expect.soft(inspectionComponent.div_step2_unifComplete).toHaveClass(/text-success/);
        // TODO replace text with translation
        await expect.soft(inspectionComponent.div_step2_unifComplete).toContainText('Uniform vollständig');
    });
    await test.step('validate uncomplete Uniform', async () => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[2]}`); // Sven Keller
        await inspectionComponent.btn_inspect.click();
        await inspectionComponent.btn_step1_continue.click();

        await expect.soft(inspectionComponent.div_step2_unifComplete).toHaveClass(/text-danger/);
        // TODO replace text with translation
        await expect.soft(inspectionComponent.div_step2_unifComplete).toContainText('Uniform unvollständig');
    });
});
