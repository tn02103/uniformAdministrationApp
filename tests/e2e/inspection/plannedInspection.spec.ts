import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import { PlannedInspectionTestComponent } from "../../_playwrightConfig/pages/inspection/plannedInspection.component";
import { adminTest } from "../../_playwrightConfig/setup";

import dayjs from "@/lib/dayjs";

type Fixture = {
    plannedComponent: PlannedInspectionTestComponent;
}
const test = adminTest.extend<Fixture>({
    plannedComponent: ({ page }, use) => use(new PlannedInspectionTestComponent(page)),
});
test.beforeEach(({ page }) => page.goto('/de/app/inspection'));
test.afterEach(async ({ staticData: { cleanup } }) => {
    await cleanup.inspection();
});

test.describe('Planned Inspection Overview', () => {
    test('sortOrder', async ({ plannedComponent, staticData: { ids } }) => {
        await expect(plannedComponent.div_row_list).toHaveCount(3);
        await expect(plannedComponent.div_row_list.nth(0)).toHaveAttribute('data-testid', `div_inspection_${ids.inspectionIds[2]}`);
        await expect(plannedComponent.div_row_list.nth(1)).toHaveAttribute('data-testid', `div_inspection_${ids.inspectionIds[4]}`);
        await expect(plannedComponent.div_row_list.nth(2)).toHaveAttribute('data-testid', `div_inspection_${ids.inspectionIds[3]}`);
    });

    test('create Inspection', async ({ page, staticData: { fk_assosiation } }) => {
        const testDate = dayjs.utc().add(30, "day").locale('de');
        await test.step('create Inspection', async () => {
            const row = page.getByRole('row', { name: /newInspection/i });
            const dateField = row.getByRole('textbox', { name: /datum/i });
            const nameField = row.getByRole('textbox', { name: /name/i });

            await page.getByRole('button', { name: /create/i }).click();
            await expect(row).toBeVisible();
            await expect(row.getByTestId('lbl_badge')).toHaveText('Neu');

            await dateField.fill(testDate.format("DD.MM.YYYY"));
            await nameField.fill("Test Inspection");

            await page.getByRole('button', { name: /save/i }).click();
            await expect(row).toBeHidden();
        });
        await test.step('check ui', async () => {
            const rows = page.getByRole('row');
            await expect(rows).toHaveCount(5);

            const row = rows.filter({ hasText: 'Test Inspection' }).nth(0);
            await expect(row).toBeVisible();
            await expect(row.getByTestId('lbl_badge')).toHaveText('Geplant');
            await expect(row.getByLabel(/datum/i)).toHaveText(testDate.format("dd DD.MM.YYYY"));
            await expect(row.getByLabel(/name/i)).toHaveText("Test Inspection");
            await expect(row.getByRole('button', { name: /edit/i })).toBeVisible();
            await expect(row.getByRole('button', { name: /delete/i })).toBeVisible();
        });
        await test.step('check db', async () => {
            const inspection = await prisma.inspection.findFirst({
                where: {
                    name: "Test Inspection",
                },
            });
            expect(inspection).toBeDefined();
            expect(inspection).toStrictEqual({
                fk_assosiation,
                id: expect.any(String),
                name: "Test Inspection",
                date: testDate.startOf('day').toDate(),
                timeStart: null,
                timeEnd: null,
            });
        });
    });

    test('edit Inspection', async ({ page, staticData: { ids, fk_assosiation } }) => {
        const testDate = dayjs.utc().add(30, "day").locale('de');
        await test.step('edit Inspection', async () => {
            const row = page.getByRole('row').nth(1);
            const dateField = row.getByRole('textbox', { name: /datum/i });
            const nameField = row.getByRole('textbox', { name: /name/i });

            await row.getByRole('button', { name: /edit/i }).click();
            await expect(row).toBeVisible();
            await expect(row.getByTestId('lbl_badge')).toHaveText('Abgelaufen');

            await dateField.fill(testDate.format("DD.MM.YYYY"));
            await nameField.fill("Test Inspection 2");

            await page.getByRole('button', { name: /save/i }).click();
            await expect(dateField).toBeHidden();
        });

        await test.step('check ui', async () => {
            const rows = page.getByRole('row');
            await expect(rows).toHaveCount(4);

            const row = rows.filter({ hasText: 'Test Inspection 2' }).nth(0);
            await expect(row).toBeVisible();
            await expect(row.getByTestId('lbl_badge')).toHaveText('Geplant');
            await expect(row.getByLabel(/datum/i)).toHaveText(testDate.format("dd DD.MM.YYYY"));
            await expect(row.getByLabel(/name/i)).toHaveText("Test Inspection 2");
            await expect(row.getByRole('button', { name: /edit/i })).toBeVisible();
            await expect(row.getByRole('button', { name: /delete/i })).toBeVisible();
        });

        await test.step('check db', async () => {
            const inspection = await prisma.inspection.findFirst({
                where: {
                    id: ids.inspectionIds[2],
                },
            });
            expect(inspection).toBeDefined();
            expect(inspection).toStrictEqual({
                fk_assosiation,
                id: ids.inspectionIds[2],
                name: "Test Inspection 2",
                date: testDate.startOf('day').toDate(),
                timeStart: null,
                timeEnd: null,
            });
        });
    });

    test('delete Inspection', async ({ page, staticData: { ids, data } }) => {
        const row = page.getByRole('row').filter({ hasText: data.inspections[2].name }).nth(0);
        await test.step('delete Inspection', async () => {
            await row.getByRole('button', { name: /delete/i }).click();
            await expect(row).toBeVisible();

            const dialog = page.getByRole('dialog');
            await expect(dialog).toBeVisible();
            await dialog.getByRole('button', { name: /Löschen/i }).click();
            await expect(row).toBeHidden();
        });
        await test.step('check db', async () => {
            const inspection = await prisma.inspection.findFirst({
                where: {
                    id: ids.inspectionIds[2],
                },
            });
            expect(inspection).toBeNull();
        });
    });

    test('start Inpsection', async ({ page, staticData: { ids } }) => {
        const row = page.getByRole('row').filter({ hasText: "today" }).nth(0);
        await test.step('start Inspection', async () => {
            await row.getByRole('button', { name: /start/i }).click();
            await expect(row).toBeVisible();
            await expect(row.getByTestId('lbl_badge')).toHaveText(/Aktiv/i);
            await expect(row.getByRole('button', { name: /finish inspection/i })).toBeVisible();
        });
        await test.step('check db', async () => {
            const inspection = await prisma.inspection.findFirst({
                where: {
                    id: ids.inspectionIds[4],
                },
            });
            expect(inspection).toBeDefined();
            expect(inspection).toStrictEqual({
                fk_assosiation: expect.any(String),
                id: ids.inspectionIds[4],
                name: "today",
                date: expect.any(Date),
                timeStart: expect.stringMatching(/^\d\d:\d\d$/),
                timeEnd: null,
            });
        });
    });

    test('finish active Inspection', async ({ page, staticData: { ids } }) => {
        await test.step('prepare data', async () => {
            await prisma.inspection.update({
                where: {
                    id: ids.inspectionIds[4],
                },
                data: {
                    timeStart: '10:00',
                    timeEnd: null,
                },
            });
        });

        await test.step('finish active Inspection', async () => {
            const row = page.getByRole('row').filter({ hasText: "today" }).nth(0);
            await expect(row).toBeVisible();
            await row.getByRole('button', { name: /finish inspection/i }).click();

            const dialog = page.getByRole('dialog');
            const textbox = dialog.getByRole('textbox');
            await expect(dialog).toBeVisible();
            await expect(textbox).toBeVisible();
            await expect(textbox).not.toBeEmpty();

            await textbox.fill('09:00');
            await expect(textbox).toHaveClass(/is-invalid/);
            await expect(dialog.getByTestId('err_input')).toBeVisible();
            await expect(dialog.getByTestId('err_input')).toHaveText(/10:00/i);

            await textbox.fill('12:00');
            await expect(textbox).not.toHaveClass(/is-invalid/);
            await expect(dialog.getByTestId('err_input')).toBeHidden();

            await dialog.getByRole('button', { name: /Speichern/i }).click();
            await expect(row).toBeVisible();
            await expect(row.getByTestId('lbl_badge')).toHaveText(/Abgeschlossen/i);
            await expect(row.getByRole('button', { name: /restart inspection/i })).toBeVisible();
        });

        await test.step('check db', async () => {
            const inspection = await prisma.inspection.findFirst({
                where: {
                    id: ids.inspectionIds[4],
                },
            });
            expect(inspection).toBeDefined();
            expect(inspection).toStrictEqual({
                fk_assosiation: expect.any(String),
                id: ids.inspectionIds[4],
                name: "today",
                date: expect.any(Date),
                timeStart: '10:00',
                timeEnd: '12:00',
            });
        });
    });

    test('finish expired Inspection', async ({ page, staticData: { ids } }) => {
        await test.step('prepare data', async () => {
            await prisma.inspection.update({
                where: {
                    id: ids.inspectionIds[2],
                },
                data: {
                    timeStart: '10:00',
                    timeEnd: null,
                },
            });
        });
        await test.step('finish expired Inspection', async () => {
            const row = page.getByRole('row').filter({ hasText: "expired" }).nth(0);
            await expect(row).toBeVisible();
            await row.getByRole('button', { name: /finish inspection/i }).click();

            const dialog = page.getByRole('dialog');
            const textbox = dialog.getByRole('textbox');
            await expect(dialog).toBeVisible();
            await expect(textbox).toBeVisible();
            await expect(textbox).toBeEmpty();

            await textbox.fill('09:00');
            await expect(textbox).toHaveClass(/is-invalid/);
            await expect(dialog.getByTestId('err_input')).toBeVisible();
            await expect(dialog.getByTestId('err_input')).toHaveText(/10:00/i);

            await textbox.fill('12:00');
            await expect(textbox).not.toHaveClass(/is-invalid/);
            await expect(dialog.getByTestId('err_input')).toBeHidden();

            await dialog.getByRole('button', { name: /Speichern/i }).click();
            await expect(row).toBeHidden();
        });

        await test.step('check db', async () => {
            const inspection = await prisma.inspection.findFirst({
                where: {
                    id: ids.inspectionIds[2],
                },
            });
            expect(inspection).toBeDefined();
            expect(inspection).toStrictEqual({
                fk_assosiation: expect.any(String),
                id: ids.inspectionIds[2],
                name: "expired",
                date: expect.any(Date),
                timeStart: '10:00',
                timeEnd: '12:00',
            });
        });
    });

    test('restart todays Inspection', async ({ page, staticData: { ids } }) => {
        await test.step('prepare data', async () => {
            await prisma.inspection.update({
                where: {
                    id: ids.inspectionIds[4],
                },
                data: {
                    timeStart: '10:00',
                    timeEnd: '12:00',
                },
            });
        });
        await test.step('restart todays Inspection', async () => {
            const row = page.getByRole('row').filter({ hasText: "today" }).nth(0);
            await expect(row).toBeVisible();

            await row.getByRole('button', { name: /restart inspection/i }).click();
            await expect(row).toBeVisible();
            await expect(row.getByTestId('lbl_badge')).toHaveText(/Aktiv/i);
            await expect(row.getByRole('button', { name: /finish inspection/i })).toBeVisible();
        });

        await test.step('check db', async () => {
            const inspection = await prisma.inspection.findFirst({
                where: {
                    id: ids.inspectionIds[4],
                },
            });
            expect(inspection).toBeDefined();
            expect(inspection).toStrictEqual({
                fk_assosiation: expect.any(String),
                id: ids.inspectionIds[4],
                name: "today",
                date: expect.any(Date),
                timeStart: "10:00",
                timeEnd: null,
            });
        });
    });
});
test.describe('Planned Inspection deregistrations', () => {

    test('opends Offcanvas with correct data', async ({ page, staticData: { data } }) => {
        const row = page.getByRole('row').filter({ hasText: data.inspections[4].name }).nth(0);
        const offcanvas = page.getByRole('dialog', { name: /Abmeldungen für /i });
        await test.step('open Ovcanvas', async () => {
            await row.getByRole('button', { name: /open deregistration list/i }).click();
            await expect(row).toBeVisible();
            await expect(offcanvas).toBeVisible();
        });
        await test.step('check Ovcanvas', async () => {
            const tableBody = offcanvas.getByTestId('deregistration-table-body');
            const rows = tableBody.locator('tr');
            await expect(rows).toHaveCount(3);
            await expect(rows.nth(0)).toContainText(data.cadets[9].firstname);
            await expect(rows.nth(0)).toContainText(data.cadets[9].lastname);
            await expect(rows.nth(1)).toContainText(data.cadets[7].firstname);
            await expect(rows.nth(1)).toContainText(data.cadets[7].lastname);
            await expect(rows.nth(2)).toContainText(data.cadets[6].firstname);
            await expect(rows.nth(2)).toContainText(data.cadets[6].lastname);
        });
        await test.step('close Ovcanvas', async () => {
            await offcanvas.getByRole('button', { name: /close/i }).click();
            await expect(offcanvas).toBeHidden();
        });
    });

    test('remove deregistration', async ({ page, staticData: { ids, data } }) => {
        const row = page.getByRole('row').filter({ hasText: data.inspections[4].name }).nth(0);
        const offcanvas = page.getByRole('dialog', { name: /Abmeldungen für /i });
        await test.step('open Ovcanvas', async () => {
            await row.getByRole('button', { name: /open deregistration list/i }).click();
            await expect(row).toBeVisible();
            await expect(offcanvas).toBeVisible();
        });
        await test.step('remove deregistration', async () => {
            const tableBody = offcanvas.getByTestId('deregistration-table-body');
            const row = tableBody.locator('tr').filter({ hasText: data.cadets[9].firstname }).nth(0);
            const buttonRemove = row.getByRole('button', { name: /entfernen/i });

            await expect(row).toBeVisible();
            await expect(buttonRemove).toBeHidden();
            await row.hover();
            await expect(buttonRemove).toBeVisible();
            await buttonRemove.click();

            await expect(row).toBeHidden();
            await expect(tableBody.locator('tr')).toHaveCount(2);
        });
        await test.step('check db', async () => {
            const [deregList, cadetDereg] = await prisma.$transaction([
                prisma.deregistration.findMany({
                    where: {
                        fk_inspection: ids.inspectionIds[4],
                    },
                }),
                prisma.deregistration.findFirst({
                    where: {
                        fk_inspection: ids.inspectionIds[4],
                        fk_cadet: ids.cadetIds[9],
                    },
                }),
            ]);
            expect(cadetDereg).toBeNull();
            expect(deregList).toHaveLength(3);
        });
    });

    test('add deregistration', async ({ page, staticData: { ids, data } }) => {
        const row = page.getByRole('row').filter({ hasText: data.inspections[4].name }).nth(0);
        const offcanvas = page.getByRole('dialog', { name: /Abmeldungen für /i });
        const tableBody = offcanvas.getByTestId('deregistration-table-body');
        const rows = tableBody.locator('tr');
        await test.step('open Ovcanvas', async () => {
            await row.getByRole('button', { name: /open deregistration list/i }).click();
            await expect(row).toBeVisible();
            await expect(offcanvas).toBeVisible();
            await expect(rows).toHaveCount(3);
        });

        await test.step('add deregistration', async () => {
            const autocompleteGroup = offcanvas.getByTestId('autocomplete-field-group');
            const input = autocompleteGroup.getByRole('textbox');
            const optionList = autocompleteGroup.getByRole('option');

            await expect(autocompleteGroup).toBeVisible();
            await expect(input).toBeVisible();
            await expect(autocompleteGroup.getByRole('listbox')).toBeHidden();


            await input.fill("a");
            await expect(autocompleteGroup.getByRole('listbox')).toBeVisible();
            await expect(optionList).toHaveCount(4);

            await input.fill("an");
            await expect(optionList).toHaveCount(1);
            await expect(optionList).toContainText(data.cadets[0].firstname);
            await expect(optionList).toContainText(data.cadets[0].lastname);

            await optionList.click();
            await expect(autocompleteGroup.getByRole('listbox')).toBeHidden();
            await expect(rows).toHaveCount(4);
        });
        await test.step('check db', async () => {
            const [deregList, cadetDereg] = await prisma.$transaction([
                prisma.deregistration.findMany({
                    where: {
                        fk_inspection: ids.inspectionIds[4],
                    },
                }),
                prisma.deregistration.findFirst({
                    where: {
                        fk_inspection: ids.inspectionIds[4],
                        fk_cadet: ids.cadetIds[0],
                    },
                }),
            ]);
            expect(cadetDereg).toBeDefined();
            expect(deregList).toHaveLength(5);
        });
    });
});