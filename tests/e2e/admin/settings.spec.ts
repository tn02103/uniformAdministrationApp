import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import { SettingsPage } from "../../_playwrightConfig/pages/admin/settings/settings.page";
import { adminTest, managerTest } from "../../_playwrightConfig/setup";

type Fixture = {
    settingsPage: SettingsPage;
};

const test = adminTest.extend<Fixture>({
    settingsPage: async ({ page }, use) => {
        use(new SettingsPage(page));
    },
});

// ─── Role-based access ───────────────────────────────────────────────────────

managerTest('materialManager cannot access admin settings page (403)', async ({ page }) => {
    await page.goto(SettingsPage.url);
    await expect(page.getByTestId('div_403Page')).toBeVisible();
});

// ─── Anonymization Config ────────────────────────────────────────────────────
test.describe('Anonymization Config section', () => {
    test.beforeEach(async ({ settingsPage }) => {
        await settingsPage.goto();
    });

    test.afterEach(async ({ staticData }) => {
        // Reset config to initial state (returnProcessEnabled=false, MANUAL, 30 days)
        await prisma.assosiationConfiguration.update({
            where: { assosiationId: staticData.fk_assosiation },
            data: {
                returnProcessEnabled: true,
                anonymizationMode: 'MANUAL',
                anonymizationDelayDays: 30,
            },
        });
    });

    test('toggle returnProcessEnabled persists after page reload', async ({ page, settingsPage }) => {
        const { anonymizationConfig: ac } = settingsPage;

        await expect(ac.chk_returnProcessEnabled).toBeVisible();
        await expect(ac.chk_returnProcessEnabled).toBeChecked();

        await ac.chk_returnProcessEnabled.click();
        await expect(ac.chk_returnProcessEnabled).not.toBeChecked();

        // Reload and verify persisted
        await page.reload();
        await expect(ac.chk_returnProcessEnabled).not.toBeChecked();
    });

    test('selecting AFTER_DAYS shows days input, other modes hide it', async ({ settingsPage }) => {
        const { anonymizationConfig: ac } = settingsPage;

        // Default is MANUAL – days input should be hidden
        await expect(ac.txt_anonymizationDelayDays).toBeHidden();

        // Select AFTER_DAYS
        await ac.sel_anonymizationMode.click();
        await ac.sel_anonymizationMode.selectOption('AFTER_DAYS');
        await expect(ac.sel_anonymizationMode).toHaveValue('AFTER_DAYS');
        await expect(ac.txt_anonymizationDelayDays).toBeVisible();

        // Select IMMEDIATELY – days input should hide again
        await ac.sel_anonymizationMode.selectOption('IMMEDIATELY');
        await expect(ac.txt_anonymizationDelayDays).toBeHidden();
    });

    test('anonymizationDelayDays value < 1 is rejected with a validation error', async ({ settingsPage }) => {
        const { anonymizationConfig: ac } = settingsPage;

        // Switch to AFTER_DAYS to reveal the field
        await ac.sel_anonymizationMode.click();
        await ac.sel_anonymizationMode.selectOption('AFTER_DAYS');
        await expect(ac.txt_anonymizationDelayDays).toBeVisible();

        // Enter an invalid value
        await ac.txt_anonymizationDelayDays.fill('0');
        await ac.btn_save.click();

        // Validation error should appear, no success toast
        await expect(ac.err_anonymizationDelayDays).toBeVisible();
        await expect(ac.txt_success).toBeHidden();
    });

    test('saving config shows success toast and data persists after reload', async ({ page, settingsPage, staticData }) => {
        const { anonymizationConfig: ac } = settingsPage;

        // Change mode to IMMEDIATELY and save
        await ac.sel_anonymizationMode.click();
        await ac.sel_anonymizationMode.selectOption('IMMEDIATELY');
        await ac.btn_save.click();

        await expect(ac.txt_success).toBeVisible();

        // Reload and verify persistence
        await page.reload();
        await expect(ac.sel_anonymizationMode).toHaveValue('IMMEDIATELY');

        // Verify in DB
        const config = await prisma.assosiationConfiguration.findUnique({
            where: { assosiationId: staticData.fk_assosiation },
        });
        expect(config?.anonymizationMode).toBe('IMMEDIATELY');
    });
});

// ─── ReturnProcessTemplate section ──────────────────────────────────────────

test.describe('Return Process Template section', () => {
    test.beforeEach(async ({ settingsPage }) => {
        await settingsPage.goto();
    });

    test.afterEach(async ({ staticData }) => {
        await staticData.cleanup.returnProcessTemplate();
    });

    test('create a new template', async ({ settingsPage, staticData }) => {
        const { returnProcess: rp } = settingsPage;

        await rp.btn_addTemplate.click();

        await expect(rp.form_addTemplate).toBeVisible();
        await expect(rp.txt_newTemplateName).toBeVisible();
        await rp.txt_newTemplateName.fill('Neue Vorlage');
        await rp.btn_createTemplate.click();

        await expect(rp.txt_createSuccess).toBeVisible();
        await expect(settingsPage.page.getByText('Neue Vorlage')).toBeVisible();

        // Verify in DB
        const tpl = await prisma.returnProcessTemplate.findFirst({
            where: { fk_assosiation: staticData.fk_assosiation, name: 'Neue Vorlage' },
        });
        expect(tpl).not.toBeNull();
    });

    test('rename an existing template', async ({ settingsPage, staticData }) => {
        const { returnProcess: rp } = settingsPage;
        const template = staticData.data.returnProcessTemplates[1]; // 'Alternative Rückgabe'
        const templateId = template.id!;

        const card = rp.div_templateCard(templateId);
        await expect(card).toBeVisible();

        await rp.btn_editTemplateName(templateId).click();

        const input = rp.txt_templateNameInput(templateId);
        await expect(input).toBeVisible();
        await input.clear();
        await input.fill('Umbenannte Vorlage');
        await rp.btn_saveTemplateName(templateId).click();

        await expect(input).toBeHidden();
        await expect(settingsPage.page.getByText('Umbenannte Vorlage')).toBeVisible();

        // Verify in DB
        await expect(async () => {
            const tpl = await prisma.returnProcessTemplate.findFirst({
                where: { fk_assosiation: staticData.fk_assosiation, name: 'Umbenannte Vorlage' },
            });
            expect(tpl).not.toBeNull();
        }).toPass();
    });

    test('delete a template that has no active processes', async ({ settingsPage, staticData }) => {
        const { returnProcess: rp } = settingsPage;
        // Template[1] ('Alternative Rückgabe') has no active return processes
        const template = staticData.data.returnProcessTemplates[1];
        const templateId = template.id!;
        const card = rp.div_templateCard(templateId);
        await expect(card).toBeVisible();

        await rp.btn_deleteTemplate(templateId).click();

        // Confirm in warning modal
        const modal = settingsPage.page.getByTestId('div_messageModal_popup');
        await expect(modal).toBeVisible();
        await modal.getByTestId('btn_save').click();

        await expect(card).toBeHidden();

        // Verify deleted from DB
        const tpl = await prisma.returnProcessTemplate.findUnique({
            where: { id: staticData.ids.returnProcessTemplateIds[1] },
        });
        expect(tpl).toBeNull();
    });

    test('add a checklist item to a template', async ({ settingsPage, staticData }) => {
        const { returnProcess: rp } = settingsPage;
        const template = staticData.data.returnProcessTemplates[1]; // 'Alternative Rückgabe'
        const templateId = template.id!;

        // Expand the template card
        await rp.btn_expandTemplate(templateId, template.name).click();

        const input = rp.txt_newChecklistItemLabel(templateId);
        await expect(rp.form_addChecklistItem(templateId)).toBeVisible();
        await expect(input).toBeVisible();
        await input.fill('Stiefel abgeben');
        await rp.form_addChecklistItem(templateId).locator('button[type="submit"]').click();

        // Verify item is visible in the template
        await expect(rp.div_templateCard(templateId).getByText('Stiefel abgeben')).toBeVisible();
        await expect(input).toBeEmpty();

        // Add another item to verify multiple items can be added
        await input.fill('Mütze abgeben');
        await settingsPage.page.keyboard.press('Enter'); // Submit the form with Enter key
        await expect(input).toBeEmpty();
        await expect(rp.div_templateCard(templateId).getByText('Mütze abgeben')).toBeVisible();

        // Verify in DB
        await expect(async () => {
            const item = await prisma.returnChecklistTemplate.findFirst({
                where: { fk_assosiation: staticData.fk_assosiation, label: 'Stiefel abgeben' },
            });
            expect(item).not.toBeNull();
        }).toPass();
    });

    test('rename a checklist item', async ({ settingsPage, staticData }) => {
        const { returnProcess: rp } = settingsPage;
        const template = staticData.data.returnProcessTemplates[0]; // 'Standard Rückgabe'
        const templateId = template.id!;
        const checklistItem = staticData.data.returnChecklistTemplates[0]; // 'Hose abgeben'
        const checklistItemId = checklistItem.id!;

        // Expand
        await rp.btn_expandTemplate(templateId, template.name).click();

        // The edit button is hidden until hover (.hoverColHidden) – use force:true to bypass visibility check
        const itemRow = rp.tr_checklistItem(checklistItemId);
        await expect(itemRow).toBeVisible();
        await itemRow.hover();
        // eslint-disable-next-line playwright/no-force-option
        await rp.btn_editChecklistItem(checklistItemId).click({ force: true });

        const input = rp.txt_checklistItemLabel(checklistItemId);
        await input.clear();
        await input.fill('Hose zurückgeben');
        await rp.btn_saveChecklistItem(checklistItemId).click();

        await expect(input).toBeHidden();
        await expect(rp.btn_saveChecklistItem(checklistItemId)).toBeHidden();
        await expect(rp.div_templateCard(templateId).getByText('Hose zurückgeben')).toBeVisible();
        await expect(rp.div_templateCard(templateId).getByText(checklistItem.label)).toBeHidden();

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

    test('delete a checklist item', async ({ settingsPage, staticData }) => {
        const { returnProcess: rp } = settingsPage;
        const template = staticData.data.returnProcessTemplates[0]; // 'Standard Rückgabe'
        const templateId = template.id!;
        const checklistItem = staticData.data.returnChecklistTemplates[1]; // 'Jacke abgeben'
        const checklistItemId = checklistItem.id!;

        // Expand
        await rp.btn_expandTemplate(templateId, template.name).click();

        // The delete button is hidden until hover (.hoverColHidden) – use force:true to bypass visibility check
        const itemRow = rp.tr_checklistItem(checklistItemId);
        await expect(itemRow).toBeVisible();
        await itemRow.hover();
        // eslint-disable-next-line playwright/no-force-option
        await rp.btn_deleteChecklistItem(checklistItemId).click({ force: true });

        await expect(itemRow).toBeHidden();
        await expect(rp.div_templateCard(templateId).getByText(checklistItem.label)).toBeHidden();

        // Verify deleted from DB
        await expect(async () => {
            const item = await prisma.returnChecklistTemplate.findFirst({
                where: { fk_assosiation: staticData.fk_assosiation, label: checklistItem.label },
            });
            expect(item).toBeNull();
        }).toPass();
    });

    test('drag-and-drop reorder checklist items', async ({ settingsPage, staticData, browserName }) => {
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip(browserName !== 'chromium', 'DnD reorder only tested in Chromium');

        const { returnProcess: rp } = settingsPage;
        const template = staticData.data.returnProcessTemplates[0]; // 'Standard Rückgabe'
        const templateId = template.id!;
        const items = staticData.data.returnChecklistTemplates.filter(
            (i) => i.fk_returnProcessTemplate === staticData.ids.returnProcessTemplateIds[0]
        );
        const card = rp.div_templateCard(templateId);

        // Expand template card
        await rp.btn_expandTemplate(templateId, template.name).click();

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
