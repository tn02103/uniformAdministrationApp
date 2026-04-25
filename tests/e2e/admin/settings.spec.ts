import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import german from "../../../public/locales/de";
import { adminTest as test, managerTest } from "../../_playwrightConfig/setup";

const t = german.admin.settings;
const tCommon = german.common.actions;

// ─── helpers ────────────────────────────────────────────────────────────────

const settingsUrl = "/de/app/admin/settings";

// ─── Role-based access ───────────────────────────────────────────────────────

managerTest('materialManager cannot access admin settings page (403)', async ({ page }) => {
    await page.goto(settingsUrl);
    await expect(page.getByTestId('div_403Page')).toBeVisible();
});

// ─── Anonymization Config ────────────────────────────────────────────────────
test.describe('Anonymization Config section', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(settingsUrl);
    });

    test.afterEach(async ({ staticData }) => {
        // Reset config to initial state (returnProcessEnabled=false, MANUAL, 30 days)
        await prisma.assosiationConfiguration.update({
            where: { assosiationId: staticData.fk_assosiation },
            data: {
                returnProcessEnabled: false,
                anonymizationMode: 'MANUAL',
                anonymizationDelayDays: 30,
            },
        });
    });

    test('toggle returnProcessEnabled persists after page reload', async ({ page }) => {
        const toggle = page.getByRole('switch', { name: t.anonymization.returnProcessEnabled });
        await expect(toggle).toBeVisible();
        await expect(toggle).toBeChecked();

        await toggle.click();
        await expect(toggle).not.toBeChecked();

        // Reload and verify persisted
        await page.reload();
        await expect(page.getByRole('switch', { name: t.anonymization.returnProcessEnabled })).not.toBeChecked();
    });

    test('selecting AFTER_DAYS shows days input, other modes hide it', async ({ page }) => {
        const modeSelect = page.getByRole('combobox', { name: t.anonymization.anonymizationMode });
        const daysInput = page.getByRole('spinbutton', { name: t.anonymization.anonymizationDelayDays });

        // Default is MANUAL – days input should be hidden
        await expect(daysInput).toBeHidden();

        // Select AFTER_DAYS
        await modeSelect.click();
        await modeSelect.selectOption(t.anonymization.modes.AFTER_DAYS);
        await expect(modeSelect).toHaveValue("AFTER_DAYS");
        await expect(daysInput).toBeVisible();

        // Select IMMEDIATELY – days input should hide again
        await modeSelect.selectOption(t.anonymization.modes.IMMEDIATELY);
        await expect(daysInput).toBeHidden();
    });

    test('anonymizationDelayDays value < 1 is rejected with a validation error', async ({ page }) => {
        const modeSelect = page.getByRole('combobox', { name: t.anonymization.anonymizationMode });
        const daysInput = page.getByRole('spinbutton', { name: t.anonymization.anonymizationDelayDays });

        // Switch to AFTER_DAYS to reveal the field
        await modeSelect.click();
        await modeSelect.selectOption(t.anonymization.modes.AFTER_DAYS);
        await expect(daysInput).toBeVisible();

        // Enter an invalid value
        await daysInput.fill('0');

        await page.getByRole('form', { name: t.anonymization.header }).getByRole('button', { name: tCommon.save }).click();

        // Validation error should appear, no success toast
        await expect(page.getByTestId('err_anonymizationDelayDays')).toBeVisible();
        await expect(page.getByText(t.anonymization.success)).toBeHidden();
    });

    test('saving config shows success toast and data persists after reload', async ({ page, staticData }) => {
        const modeSelect = page.getByRole('combobox', { name: t.anonymization.anonymizationMode });

        // Change mode to IMMEDIATELY and save
        await modeSelect.click();
        await modeSelect.selectOption(t.anonymization.modes.IMMEDIATELY);
        await page.getByRole('form', { name: t.anonymization.header }).getByRole('button', { name: tCommon.save }).click();

        await expect(page.getByText(t.anonymization.success)).toBeVisible();

        // Reload and verify persistence
        await page.reload();
        await expect(page.getByRole('combobox', { name: t.anonymization.anonymizationMode })).toHaveValue('IMMEDIATELY');

        // Verify in DB
        const config = await prisma.assosiationConfiguration.findUnique({
            where: { assosiationId: staticData.fk_assosiation },
        });
        expect(config?.anonymizationMode).toBe('IMMEDIATELY');
    });
});

// ─── ReturnProcessTemplate section ──────────────────────────────────────────

test.describe('Return Process Template section', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(settingsUrl);
    });

    test.afterEach(async ({ staticData }) => {
        await staticData.cleanup.returnProcessTemplate();
    });

    test('create a new template', async ({ page, staticData }) => {
        const inputRegex = new RegExp(t.returnProcess.templateName, "i");
        await page.getByRole('button', { name: t.returnProcess.addTemplate }).click();

        const form = page.getByRole('form', { name: t.returnProcess.addTemplate });
        await expect(form).toBeVisible();
        await expect(page.getByRole('textbox', { name: inputRegex })).toBeVisible();
        await form.getByRole('textbox', { name: inputRegex }).fill('Neue Vorlage');
        await form.getByRole('button', { name: tCommon.create }).click();

        await expect(page.getByText(t.returnProcess.create.success)).toBeVisible();
        await expect(page.getByText('Neue Vorlage')).toBeVisible();

        // Verify in DB
        const tpl = await prisma.returnProcessTemplate.findFirst({
            where: { fk_assosiation: staticData.fk_assosiation, name: 'Neue Vorlage' },
        });
        expect(tpl).not.toBeNull();
    });

    test('rename an existing template', async ({ page, staticData }) => {
        const inputRegex = new RegExp(t.returnProcess.templateName, "i");
        const template = staticData.data.returnProcessTemplates[1]; // 'Alternative Rückgabe'

        // Find the template card and click the edit button
        const card = page.getByTestId(`div_returnprocess_${template.id}`);
        await expect(card).toBeVisible();

        // Click the edit (pencil) button to enter inline edit mode
        await card.getByRole('button', { name: 'edit' }).first().click();

        const input = card.getByRole('textbox', { name: inputRegex });
        await expect(input).toBeVisible();
        await input.clear();
        await input.fill('Umbenannte Vorlage');
        await card.getByRole('button', { name: 'save changes' }).click();

        await expect(input).toBeHidden();
        await expect(page.getByText('Umbenannte Vorlage')).toBeVisible();

        // Verify in DB
        await expect(async () => {
            const tpl = await prisma.returnProcessTemplate.findFirst({
                where: { fk_assosiation: staticData.fk_assosiation, name: 'Umbenannte Vorlage' },
            });
            expect(tpl).not.toBeNull();
        }).toPass();
    });

    test('delete a template that has no active processes', async ({ page, staticData }) => {
        // Template[1] ('Alternative Rückgabe') has no active return processes
        const template = staticData.data.returnProcessTemplates[1];
        const card = page.getByTestId(`div_returnprocess_${template.id}`);
        await expect(card).toBeVisible();

        await card.getByRole('button', { name: tCommon.delete }).click();

        // Confirm in warning modal
        const modal = page.getByTestId('div_messageModal_popup');
        await expect(modal).toBeVisible();
        await modal.getByTestId('btn_save').click();

        await expect(card).toBeHidden();

        // Verify deleted from DB
        const tpl = await prisma.returnProcessTemplate.findUnique({
            where: { id: staticData.ids.returnProcessTemplateIds[1] },
        });
        expect(tpl).toBeNull();
    });

    test('add a checklist item to a template', async ({ page, staticData }) => {
        const inputRegex = new RegExp(t.returnProcess.addItemLabel, "i");
        const template = staticData.data.returnProcessTemplates[1]; // 'Alternative Rückgabe'
        const card = page.getByTestId(`div_returnprocess_${template.id}`);

        // Expand the template card
        await card.getByRole('button', { name: template.name }).click();

        // Add a new checklist item
        const addForm = card.getByRole('form', { name: t.returnProcess.addChecklistItem });
        const input = addForm.getByRole('textbox', { name: inputRegex });
        await expect(addForm).toBeVisible();
        await expect(input).toBeVisible();
        await input.fill('Stiefel abgeben');
        await addForm.locator('button[type="submit"]').click();

        // Verify item is visible in the template
        await expect(card.getByText('Stiefel abgeben')).toBeVisible();
        await expect(input).toBeEmpty();

        // Add another item to verify multiple items can be added
        await input.fill('Mütze abgeben');
        await page.keyboard.press('Enter'); // Submit the form with Enter key
        await expect(input).toBeEmpty();
        await expect(card.getByText('Mütze abgeben')).toBeVisible();

        // Verify in DB
        await expect(async () => {
            const item = await prisma.returnChecklistTemplate.findFirst({
                where: { fk_assosiation: staticData.fk_assosiation, label: 'Stiefel abgeben' },
            });
            expect(item).not.toBeNull();
        }).toPass();
    });

    test('rename a checklist item', async ({ page, staticData }) => {
        const template = staticData.data.returnProcessTemplates[0]; // 'Standard Rückgabe'
        const cheklistItem = staticData.data.returnChecklistTemplates[0];  // 'Hose abgeben'
        const card = page.getByTestId(`div_returnprocess_${template.id}`);

        // Expand
        await card.getByRole('button', { name: template.name }).click();

        // Find the item row and click edit
        // The edit button is hidden until hover (.hoverColHidden) – use force:true to bypass visibility check
        const itemRow = card.getByTestId(`tr_checklistItem_${cheklistItem.id}`);
        const button = itemRow.getByRole('button', { name: 'edit' });
        await expect(itemRow).toBeVisible();
        await itemRow.hover();
        await button.click({ force: true });

        const input = itemRow.getByRole('textbox', { name: t.returnProcess.checklistItemLabel });
        await input.clear();
        await input.fill('Hose zurückgeben');
        const saveButton = itemRow.getByRole('button', { name: 'save' });
        await saveButton.click();

        expect(input).toBeHidden();
        expect(saveButton).toBeHidden();

        await expect(card.getByText('Hose zurückgeben')).toBeVisible();
        await expect(card.getByText(cheklistItem.label)).toBeHidden();

        // Verify in DB
        await expect(async () => {
            const item = await prisma.returnChecklistTemplate.findFirst({
                where: {
                    fk_assosiation: staticData.fk_assosiation,
                    label: 'Hose zurückgeben',
                },
            });
            expect(item).not.toBeNull();
        }).toPass();
    });

    test('delete a checklist item', async ({ page, staticData }) => {
        const template = staticData.data.returnProcessTemplates[0]; // 'Standard Rückgabe'
        const checklistItem = staticData.data.returnChecklistTemplates[1];  // 'Jacke abgeben'
        const card = page.getByTestId(`div_returnprocess_${template.id}`);

        // Expand
        await card.getByRole('button', { name: template.name }).click();

        // Find and delete the item
        // The delete button is hidden until hover (.hoverColHidden) – use force:true to bypass visibility check
        const itemRow = card.getByTestId(`tr_checklistItem_${checklistItem.id}`);
        await expect(itemRow).toBeVisible();
        await itemRow.hover();
        await itemRow.getByRole('button', { name: "delete" }).click({ force: true });

        await expect(itemRow).toBeHidden();
        await expect(card.getByText(checklistItem.label)).toBeHidden();

        // Verify deleted from DB
        await expect(async () => {
            const item = await prisma.returnChecklistTemplate.findFirst({
                where: { fk_assosiation: staticData.fk_assosiation, label: checklistItem.label },
            });
            expect(item).toBeNull();
        }).toPass();
    });

    test('drag-and-drop reorder checklist items', async ({ page, staticData, browserName }) => {
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip(browserName !== 'chromium', 'DnD reorder only tested in Chromium');

        const template = staticData.data.returnProcessTemplates[0]; // 'Standard Rückgabe'
        const items = staticData.data.returnChecklistTemplates.filter(
            (i) => i.fk_returnProcessTemplate === staticData.ids.returnProcessTemplateIds[0]
        );
        const card = page.getByTestId(`div_returnprocess_${template.id}`);

        // Expand template card
        await card.getByRole('button', { name: template.name }).click();

        const rows = card.locator('tbody').nth(0).locator('tr');
        await expect(rows).toHaveCount(items.length);
        await expect(rows.nth(0)).toContainText(items[0].label);
        await expect(rows.nth(1)).toContainText(items[1].label);

        const firstRowHandle = card.locator('tr').filter({ hasText: items[0].label })
            .locator('span[aria-label]').first();
        const secondRowHandle = card.locator('tr').filter({ hasText: items[1].label })
            .locator('span[aria-label]').first();

        await expect(firstRowHandle).toBeVisible();
        await expect(secondRowHandle).toBeVisible();

        await firstRowHandle.dragTo(secondRowHandle, {
            targetPosition: { x: 10, y: 5 },
            steps: 50,
        });

        // Items should have swapped positions in the DOM
        await expect(rows.nth(0)).toContainText(items[1].label);
        await expect(rows.nth(1)).toContainText(items[0].label);
    });
});
