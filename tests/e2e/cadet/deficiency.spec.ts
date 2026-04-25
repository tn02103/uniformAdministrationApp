import { expect } from "playwright/test";
import german from "../../../public/locales/de";
import { CadetInspectionComponent } from "../../_playwrightConfig/pages/cadet/cadetInspection.component";
import { ToastTestComponent } from "../../_playwrightConfig/pages/global/Toast.component";
import { adminTest } from "../../_playwrightConfig/setup";

type Fixture = {
    inspectionComponent: CadetInspectionComponent;
    testData: {
        cadetDefId: string;
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
            cadetTypeId: ids.deficiencyTypeIds[1],
        });
    },
});

test.describe('Deficiency management outside active inspection', () => {
    test.afterEach(async ({ staticData }) => {
        await staticData.cleanup.deficiencies();
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

});
