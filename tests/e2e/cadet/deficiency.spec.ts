import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import german from "../../../public/locales/de";
import { CadetInspectionComponent } from "../../_playwrightConfig/pages/cadet/cadetInspection.component";
import { ToastTestComponent } from "../../_playwrightConfig/pages/global/Toast.component";
import { adminTest } from "../../_playwrightConfig/setup";

type Fixture = {
    inspectionComponent: CadetInspectionComponent;
    testData: {
        cadetDefId: string;
        uniformDefId: string;
        unresolvedIds: string[];
        cadetTypeId: string;
    };
};

const test = adminTest.extend<Fixture>({
    inspectionComponent: async ({ page }, use) => {
        await use(new CadetInspectionComponent(page));
    },
    testData: async ({ staticData: { ids } }, use) => {
        await use({
            // deficiencyIds[5]: cadet-linked (fk_cadet: cadetIds[2], fk_uniform: null) → description editable
            cadetDefId: ids.deficiencyIds[5],
            // deficiencyIds[1]: uniform-linked (fk_uniform: uniformIds[0][46]) → description read-only
            uniformDefId: ids.deficiencyIds[1],
            unresolvedIds: [
                ids.deficiencyIds[5],
                ids.deficiencyIds[10],
                ids.deficiencyIds[1],
                ids.deficiencyIds[9],
                ids.deficiencyIds[15],
                ids.deficiencyIds[13],
            ],
            cadetTypeId: ids.deficiencyTypeIds[1],
        });
    },
});

test.describe('Deficiency management outside active inspection', () => {
    test.afterEach(async ({ staticData }) => {
        await staticData.cleanup.inspection();
    });

    test('step 0, no active inspection: New Deficiency button and Edit/Resolve buttons are visible per row', async ({
        page,
        staticData: { ids },
        inspectionComponent,
        testData,
    }) => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[2]}`);

        await expect(inspectionComponent.div_oldDeficiency_list).toHaveCount(6);
        await expect(inspectionComponent.div_ci.getByTestId('btn_new_deficiency')).toBeVisible();

        for (const defId of testData.unresolvedIds) {
            await expect(inspectionComponent.div_ci.getByTestId(`btn_edit_${defId}`)).toBeVisible();
            await expect(inspectionComponent.div_ci.getByTestId(`btn_resolve_${defId}`)).toBeVisible();
        }
    });

    test('edit form: uniform-linked deficiency has read-only description; cadet-linked has editable description', async ({
        page,
        staticData: { ids },
        inspectionComponent,
        testData,
    }) => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[2]}`);

        // Cadet-linked: description input is editable
        await inspectionComponent.div_ci.getByTestId(`btn_edit_${testData.cadetDefId}`).click();
        const cadetRow = inspectionComponent.div_oldDeficiency(testData.cadetDefId);
        await expect(cadetRow.locator('input[name="description"]')).toBeVisible();
        await expect(cadetRow.locator('textarea[name="comment"]')).toBeVisible();

        // Uniform-linked: no description input; comment still editable
        await inspectionComponent.div_ci.getByTestId(`btn_edit_${testData.uniformDefId}`).click();
        const uniformRow = inspectionComponent.div_oldDeficiency(testData.uniformDefId);
        await expect(uniformRow.locator('input[name="description"]')).toBeHidden();
        await expect(uniformRow.locator('textarea[name="comment"]')).toBeVisible();
    });

    test('save edit: updates description and comment; shows success toast; deficiency row refreshes', async ({
        page,
        staticData: { ids },
        inspectionComponent,
        testData,
    }) => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[2]}`);

        await inspectionComponent.div_ci.getByTestId(`btn_edit_${testData.cadetDefId}`).click();
        const cadetRow = inspectionComponent.div_oldDeficiency(testData.cadetDefId);
        await cadetRow.locator('input[name="description"]').fill('Updated Description');
        await cadetRow.locator('textarea[name="comment"]').fill('Updated Comment');
        await inspectionComponent.div_ci.getByTestId(`btn_save_edit_${testData.cadetDefId}`).click();

        const toast = new ToastTestComponent(page);
        await expect(toast.toast_success).toBeVisible();
        await expect(toast.toast_success).toContainText(
            german.cadetDetailPage.inspection['message.deficiencyUpdated'],
        );

        // Row refreshes with updated values
        await expect(cadetRow.getByTestId('div_description')).toContainText('Updated Description');
        await expect(cadetRow.getByTestId('div_comment')).toContainText('Updated Comment');
    });

    test('resolve from step 0: deficiency is removed from list; shows success toast', async ({
        page,
        staticData: { ids },
        inspectionComponent,
        testData,
    }) => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[2]}`);
        await expect(inspectionComponent.div_oldDeficiency_list).toHaveCount(6);

        await inspectionComponent.div_ci.getByTestId(`btn_resolve_${testData.cadetDefId}`).click();

        const toast = new ToastTestComponent(page);
        await expect(toast.toast_success).toBeVisible();
        await expect(toast.toast_success).toContainText(
            german.cadetDetailPage.inspection['message.deficiencyResolved'],
        );

        await expect(inspectionComponent.div_oldDeficiency(testData.cadetDefId)).toBeHidden();
        await expect(inspectionComponent.div_oldDeficiency_list).toHaveCount(5);
    });

    test('create new deficiency: fills form, submits, shows success toast, deficiency appears in list', async ({
        page,
        staticData: { ids },
        inspectionComponent,
        testData,
    }) => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[2]}`);
        await expect(inspectionComponent.div_oldDeficiency_list).toHaveCount(6);

        await inspectionComponent.div_ci.getByTestId('btn_new_deficiency').click();

        // The create card is revealed; scope selectors to div_ci to avoid collision with edit forms
        await inspectionComponent.div_ci.locator('select[name="typeId"]').selectOption(testData.cadetTypeId);
        await inspectionComponent.div_ci.locator('input[name="description"]').fill('E2E New Deficiency');
        await inspectionComponent.div_ci.locator('textarea[name="comment"]').fill('E2E New Comment');
        await inspectionComponent.div_ci.getByTestId('btn_save_new_deficiency').click();

        const toast = new ToastTestComponent(page);
        await expect(toast.toast_success).toBeVisible();
        await expect(toast.toast_success).toContainText(
            german.cadetDetailPage.inspection['message.deficiencyCreated'],
        );

        // List now has 7 rows and the new comment is visible
        await expect(inspectionComponent.div_oldDeficiency_list).toHaveCount(7);
        await expect(inspectionComponent.div_ci.getByText('E2E New Comment')).toBeVisible();
    });

    test('active inspection (step 1): Edit, Resolve, and New Deficiency buttons are not visible', async ({
        page,
        staticData: { ids },
        inspectionComponent,
        testData,
    }) => {
        // Activate today's inspection
        await prisma.inspection.update({
            where: { id: ids.inspectionIds[4] },
            data: { timeStart: '02:00' },
        });

        await page.goto(`/de/app/cadet/${ids.cadetIds[2]}`);

        // Wait for inspection active state to be reflected (may need a reload)
        await expect(async () => {
            await page.reload();
            await expect(inspectionComponent.div_header).toContainText(
                german.cadetDetailPage.inspection['header.inspection'],
            );
        }).toPass();

        // Step 0 with active inspection: standalone buttons must not exist
        await expect(inspectionComponent.div_ci.getByTestId('btn_new_deficiency')).toBeHidden();
        for (const defId of testData.unresolvedIds) {
            await expect(inspectionComponent.div_ci.getByTestId(`btn_edit_${defId}`)).toBeHidden();
            await expect(inspectionComponent.div_ci.getByTestId(`btn_resolve_${defId}`)).toBeHidden();
        }

        // Advance to inspection step 1; buttons must remain absent
        await inspectionComponent.btn_inspect.click();
        await expect(inspectionComponent.btn_inspect).toBeDisabled();

        await expect(inspectionComponent.div_ci.getByTestId('btn_new_deficiency')).toBeHidden();
        for (const defId of testData.unresolvedIds) {
            await expect(inspectionComponent.div_ci.getByTestId(`btn_edit_${defId}`)).toBeHidden();
            await expect(inspectionComponent.div_ci.getByTestId(`btn_resolve_${defId}`)).toBeHidden();
        }
    });
});
