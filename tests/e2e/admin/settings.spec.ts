import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import german from "../../../public/locales/de";
import { adminTest, inspectorTest, managerTest } from "../../_playwrightConfig/setup";

const t = german.admin.settings;
const tCommon = german.common.actions;

// ─── helpers ────────────────────────────────────────────────────────────────

const settingsUrl =  "/de/app/admin/settings";

// ─── Role-based access ───────────────────────────────────────────────────────

managerTest('materialManager cannot access admin settings page (403)', async ({ page, staticData }) => {
    const acronym = staticData.data.assosiation.acronym;
    await page.goto(settingsUrl);
    await expect(page.getByTestId('div_403Page')).toBeVisible();
});


// ─── Anonymization Config ────────────────────────────────────────────────────
adminTest.describe('Anonymization Config section', () => {
    adminTest.beforeEach(async ({ page }) => {
        await page.goto(settingsUrl);
        await page.waitForLoadState('networkidle');
    });

    adminTest.afterEach(async ({ staticData }) => {
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

    adminTest('toggle returnProcessEnabled persists after page reload', async ({ page }) => {
        const toggle = page.getByRole('switch', { name: t.anonymization.returnProcessEnabled });
        await expect(toggle).not.toBeChecked();

        await toggle.click();
        await expect(toggle).toBeChecked();

        // Save
        await page.getByRole('form', { name: t.anonymization.header }).getByRole('button', { name: tCommon.save }).click();
        await expect(page.getByText(t.anonymization.success)).toBeVisible();

        // Reload and verify persisted
        await page.reload();
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('switch', { name: t.anonymization.returnProcessEnabled })).toBeChecked();
    });

    adminTest('selecting AFTER_DAYS shows days input, other modes hide it', async ({ page }) => {
        const modeSelect = page.getByRole('combobox', { name: t.anonymization.anonymizationMode });
        const daysInput = page.getByRole('spinbutton', { name: t.anonymization.anonymizationDelayDays });

        // Default is MANUAL – days input should be hidden
        await expect(daysInput).not.toBeVisible();

        // Select AFTER_DAYS
        await modeSelect.selectOption(t.anonymization.modes.AFTER_DAYS);
        await expect(daysInput).toBeVisible();

        // Select IMMEDIATELY – days input should hide again
        await modeSelect.selectOption(t.anonymization.modes.IMMEDIATELY);
        await expect(daysInput).not.toBeVisible();
    });

    adminTest('anonymizationDelayDays value < 1 is rejected with a validation error', async ({ page }) => {
        const modeSelect = page.getByRole('combobox', { name: t.anonymization.anonymizationMode });
        const daysInput = page.getByRole('spinbutton', { name: t.anonymization.anonymizationDelayDays });

        // Switch to AFTER_DAYS to reveal the field
        await modeSelect.selectOption(t.anonymization.modes.AFTER_DAYS);
        await expect(daysInput).toBeVisible();

        // Enter an invalid value
        await daysInput.fill('0');

        await page.getByRole('form', { name: t.anonymization.header }).getByRole('button', { name: tCommon.save }).click();

        // Validation error should appear, no success toast
        await expect(page.getByTestId('err_anonymizationDelayDays')).toBeVisible();
        await expect(page.getByText(t.anonymization.success)).not.toBeVisible();
    }); 

    adminTest('saving config shows success toast and data persists after reload', async ({ page, staticData }) => {
        const modeSelect = page.getByRole('combobox', { name: t.anonymization.anonymizationMode });

        // Change mode to IMMEDIATELY and save
        await modeSelect.selectOption(t.anonymization.modes.IMMEDIATELY);
        await page.getByRole('form', { name: t.anonymization.header }).getByRole('button', { name: tCommon.save }).click();

        await expect(page.getByText(t.anonymization.success)).toBeVisible();

        // Reload and verify persistence
        await page.reload();
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('combobox', { name: t.anonymization.anonymizationMode })).toHaveValue('IMMEDIATELY');

        // Verify in DB
        const config = await prisma.assosiationConfiguration.findUnique({
            where: { assosiationId: staticData.fk_assosiation },
        });
        expect(config?.anonymizationMode).toBe('IMMEDIATELY');
    });
});

// ─── ReturnProcessTemplate section ──────────────────────────────────────────

const templateTest = adminTest.extend<{ acronym: string }>({
    acronym: async ({ staticData }, use) => {
        use(staticData.data.assosiation.acronym);
    },
});

templateTest.describe('Return Process Template section', () => {
    templateTest.beforeEach(async ({ page }) => {
        await page.goto(settingsUrl);
        await page.waitForLoadState('networkidle');
    });

    templateTest.afterEach(async ({ staticData }) => {
        await staticData.cleanup.returnProcessTemplate();
    });

    templateTest('create a new template', async ({ page, staticData }) => {
        await page.getByRole('button', { name: t.returnProcess.addTemplate }).click();

        const form = page.getByRole('form', { name: t.returnProcess.addTemplate });
        await form.getByRole('textbox', { name: t.returnProcess.templateName }).fill('Neue Vorlage');
        await form.getByRole('button', { name: tCommon.create }).click();

        await expect(page.getByText(t.returnProcess.create.success)).toBeVisible();
        await expect(page.getByText('Neue Vorlage')).toBeVisible();

        // Verify in DB
        const tpl = await prisma.returnProcessTemplate.findFirst({
            where: { fk_assosiation: staticData.fk_assosiation, name: 'Neue Vorlage' },
        });
        expect(tpl).not.toBeNull();
    });

    templateTest('rename an existing template', async ({ page, staticData }) => {
        const templateName = staticData.data.returnProcessTemplates[1].name; // 'Alternative Rückgabe'

        // Find the template card and click the edit button
        const card = page.locator('.card').filter({ hasText: templateName });
        await expect(card).toBeVisible();

        // Click the edit (pencil) button to enter inline edit mode
        await card.getByRole('button', { name: 'edit' }).first().click();

        const input = card.getByRole('textbox', { name: t.returnProcess.templateName });
        await input.clear();
        await input.fill('Umbenannte Vorlage');
        await card.getByRole('button', { name: 'save changes' }).click();

        await expect(card).not.toBeVisible(); // old card gone
        await expect(page.getByText('Umbenannte Vorlage')).toBeVisible();

        // Verify in DB
        const tpl = await prisma.returnProcessTemplate.findFirst({
            where: { fk_assosiation: staticData.fk_assosiation, name: 'Umbenannte Vorlage' },
        });
        expect(tpl).not.toBeNull();
    });

    templateTest('delete a template that has no active processes', async ({ page, staticData }) => {
        // Template[1] ('Alternative Rückgabe') has no active return processes
        const templateName = staticData.data.returnProcessTemplates[1].name;
        const card = page.locator('.card').filter({ hasText: templateName });
        await expect(card).toBeVisible();

        await card.getByRole('button', { name: tCommon.delete }).click();

        // Confirm in warning modal
        const modal = page.getByTestId('div_messageModal_popup');
        await expect(modal).toBeVisible();
        await modal.getByTestId('btn_save').click();

        await expect(card).not.toBeVisible();

        // Verify deleted from DB
        const tpl = await prisma.returnProcessTemplate.findUnique({
            where: { id: staticData.ids.returnProcessTemplateIds[1] },
        });
        expect(tpl).toBeNull();
    });

    templateTest('add a checklist item to a template', async ({ page, staticData }) => {
        const templateName = staticData.data.returnProcessTemplates[1].name; // 'Alternative Rückgabe'
        const card = page.locator('.card').filter({ hasText: templateName });

        // Expand the template card
        await card.getByRole('button', { name: templateName }).click();

        // Add a new checklist item
        const addForm = card.getByRole('form', { name: t.returnProcess.addChecklistItem });
        await addForm.getByRole('textbox', { name: t.returnProcess.checklistItemLabel }).fill('Stiefel abgeben');
        await addForm.locator('button[type="submit"]').click();

        await expect(page.getByText(t.returnProcess.checklist.create.success)).toBeVisible();

        // Verify item is visible in the template
        await expect(card.getByText('Stiefel abgeben')).toBeVisible();

        // Verify in DB
        const item = await prisma.returnChecklistTemplate.findFirst({
            where: { fk_assosiation: staticData.fk_assosiation, label: 'Stiefel abgeben' },
        });
        expect(item).not.toBeNull();
    });

    templateTest('rename a checklist item', async ({ page, staticData }) => {
        const templateName = staticData.data.returnProcessTemplates[0].name; // 'Standard Rückgabe'
        const itemLabel = staticData.data.returnChecklistTemplates[0].label;  // 'Hose abgeben'
        const card = page.locator('.card').filter({ hasText: templateName });

        // Expand
        await card.getByRole('button', { name: templateName }).click();

        // Find the item row and click edit
        const itemRow = card.locator('tr').filter({ hasText: itemLabel });
        await itemRow.getByRole('button', { name: 'edit' }).click();

        const input = itemRow.getByRole('textbox', { name: t.returnProcess.checklistItemLabel });
        await input.clear();
        await input.fill('Hose zurückgeben');
        await itemRow.getByRole('button', { name: 'save changes' }).click();

        await expect(card.getByText('Hose zurückgeben')).toBeVisible();
        await expect(card.getByText(itemLabel)).not.toBeVisible();

        // Verify in DB
        const item = await prisma.returnChecklistTemplate.findFirst({
            where: {
                fk_assosiation: staticData.fk_assosiation,
                label: 'Hose zurückgeben',
            },
        });
        expect(item).not.toBeNull();
    });

    templateTest('delete a checklist item', async ({ page, staticData }) => {
        const templateName = staticData.data.returnProcessTemplates[0].name; // 'Standard Rückgabe'
        const itemLabel = staticData.data.returnChecklistTemplates[1].label;  // 'Jacke abgeben'
        const card = page.locator('.card').filter({ hasText: templateName });

        // Expand
        await card.getByRole('button', { name: templateName }).click();

        // Find and delete the item
        const itemRow = card.locator('tr').filter({ hasText: itemLabel });
        await itemRow.getByRole('button', { name: tCommon.delete }).click();

        await expect(card.getByText(itemLabel)).not.toBeVisible();

        // Verify deleted from DB
        const item = await prisma.returnChecklistTemplate.findFirst({
            where: { fk_assosiation: staticData.fk_assosiation, label: itemLabel },
        });
        expect(item).toBeNull();
    });

    templateTest('drag-and-drop reorder checklist items', async ({ page, staticData, browserName }) => {
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip(browserName !== 'chromium', 'DnD reorder only tested in Chromium');

        const templateName = staticData.data.returnProcessTemplates[0].name; // 'Standard Rückgabe'
        const items = staticData.data.returnChecklistTemplates.filter(
            (i) => i.fk_returnProcessTemplate === staticData.ids.returnProcessTemplateIds[0]
        );
        const card = page.locator('.card').filter({ hasText: templateName });

        // Expand template card
        await card.getByRole('button', { name: templateName }).click();

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
        const rows = card.locator('tbody').nth(0).locator('tr');
        await expect(rows.first()).toContainText(items[1].label);
    });
});

// re-export so the test runner file is recognised correctly
const test = adminTest;
export { test };
