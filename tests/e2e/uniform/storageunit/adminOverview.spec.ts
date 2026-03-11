
import { expect } from "playwright/test";
import { adminTest as test } from "../../../_playwrightConfig/setup";
import { prisma } from "@/lib/db";

test.describe("Storage Unit Admin Overview", () => {

    test.beforeEach(async ({ page }) => {
        await page.goto("/de/app/uniform/storage");
        await expect(page.locator('tbody tr').nth(0)).toBeVisible();
    });

    test.afterEach(async ({ staticData: {cleanup} }) => {
        await cleanup.storageUnits();
    });

    test('shows storage unit list', async ({ page, staticData: { data } }) => {
        const storageUnitRows = await page.locator('tbody tr').all();
        expect(storageUnitRows).toHaveLength(data.storageUnits.length);

        await Promise.all(
            data.storageUnits.sort((a, b) => a.name.localeCompare(b.name)).map(async (unit, index) => {
                const row = storageUnitRows[index];
                const cols = row.getByRole('cell')
                const uniformCount = data.uniformList.filter(u => u.storageUnitId === unit.id).length;

                await Promise.all([
                    expect(cols.nth(0)).toHaveText(unit.name),
                    expect(cols.nth(1)).toHaveText(unit.description!),
                    expect(cols.nth(2)).toHaveText(unit.capacity?.toString() ?? "--"),
                    expect(cols.nth(3)).toHaveText(unit.isReserve ? 'Ja' : 'Nein'),
                    expect(cols.nth(4)).toHaveText(uniformCount.toString()),
                ]);
            })
        )
    });

    test.describe('storageunit details', () => {
        test('edit storageunit name', async ({ page, staticData: { data } }) => {
            const rows = page.locator(`tbody tr`);
            const header = page.getByRole('heading', { name: data.storageUnits[0].name });
            const input = page.getByRole('textbox', { name: /Lagereinheit umbenennen/i })

            await test.step('open offcanvas', async () => {
                await rows.nth(0).getByRole('button', { name: /open/ }).click();

                await expect(page.getByRole('dialog')).toBeVisible();
            });

            await test.step('edit name', async () => {
                await expect(header).toBeVisible();
                await expect(header.getByRole('button', { name: /edit/i })).toBeVisible();
                await header.getByRole('button', { name: /edit/i }).click();
                await expect(input).toBeVisible();

                await input.fill('XX Storage Unit');
                await input.press('Enter');
            });

            await test.step('check updated ui', async () => {
                await expect(page.getByRole('heading', { name: 'XX Storage Unit' })).toBeVisible();

                await expect(input).toBeHidden();
                await expect(header).toBeHidden();

                await expect(rows.nth(4).getByRole('cell').nth(0)).toHaveText('XX Storage Unit');
            });

            await test.step('check db update', async () => {
                const unit = await prisma.storageUnit.findFirst({
                    where: { id: data.storageUnits[0].id },
                });

                expect(unit).toBeDefined();
                expect(unit).toStrictEqual({
                    ...data.storageUnits[0],
                    name: 'XX Storage Unit',
                });
            });
        });

        test('edit storageunit', async ({ page, staticData: { data } }) => {
            const rows = page.locator(`tbody tr`);
            const body = page.getByRole('dialog').locator('[class="offcanvas-body"]');

            const editButton = body.getByRole('button', { name: /Bearbeiten/i });
            const descriptionInput = body.getByRole('textbox', { name: /Beschreibung/i });
            const capacityInput = body.getByRole('spinbutton', { name: /Kapazität/i });
            const reserveCheckbox = body.getByRole('switch', { name: /Für Reserven/i });
            const saveButton = body.getByRole('button', { name: /speichern/i });

            await test.step('open offcanvas', async () => {
                await rows.nth(0).getByRole('button', { name: /open/ }).click();

                await expect(page.getByRole('dialog')).toBeVisible();
            });

            await test.step('edit storage unit', async () => {

                await expect(descriptionInput).toBeDisabled();
                await expect(capacityInput).toBeDisabled();
                await expect(reserveCheckbox).toHaveAttribute("aria-disabled", "true");

                await editButton.click();
                await expect(descriptionInput).toBeEnabled();
                await expect(capacityInput).toBeEnabled();
                await expect(reserveCheckbox).toBeEnabled();

                await descriptionInput.fill('Updated Description');
                await capacityInput.fill('100');
                await reserveCheckbox.check();
                await saveButton.click();
            });

            await test.step('check updated ui', async () => {
                await expect(page.getByRole('heading', { name: data.storageUnits[0].name })).toBeVisible();
                await expect(descriptionInput).toHaveValue('Updated Description');
                await expect(capacityInput).toHaveValue('100');
                await expect(reserveCheckbox).toBeChecked();

                const rows = page.locator(`tbody tr`);
                const cells = rows.nth(0).getByRole('cell');
                await expect(cells.nth(1)).toHaveText('Updated Description');
                await expect(cells.nth(2)).toHaveText('100');
                await expect(cells.nth(3)).toHaveText('Ja');
            });

            await test.step('check db update', async () => {
                const unit = await prisma.storageUnit.findFirst({
                    where: { id: data.storageUnits[0].id },
                });

                expect(unit).toBeDefined();
                expect(unit).toStrictEqual({
                    ...data.storageUnits[0],
                    description: 'Updated Description',
                    capacity: 100,
                    isReserve: true,
                });
            });
        });

        test('delete storageunit', async ({ page, staticData: { data } }) => {
            const rows = page.locator(`tbody tr`);
            const offcanvas = page.getByRole('dialog');
            const deleteButton = offcanvas.getByRole('button', { name: /Löschen/i });

            await test.step('open offcanvas', async () => {
                await rows.nth(0).getByRole('button', { name: /open/ }).click();

                await expect(offcanvas).toBeVisible();
            });

            await test.step('delete storage unit', async () => {
                await deleteButton.click();
                const dangerDialog = page.getByRole('dialog', { name: /Gefahrenmeldung/i });
                await expect(dangerDialog).toBeVisible();
                await expect(dangerDialog.getByRole('button', { name: /löschen/i })).toBeVisible();
                await dangerDialog.getByRole('button', { name: /löschen/i }).click();
                await expect(dangerDialog).toBeHidden();
                await expect(offcanvas).toBeHidden();
            });

            await test.step('check updated ui', async () => {
                const storageUnitRows = page.locator('tbody tr')
                await expect(storageUnitRows).toHaveCount(data.storageUnits.length - 1);
                await expect(page.getByText(data.storageUnits[0].name)).toBeHidden();
            });

            await test.step('check db update', async () => {
                const unit = await prisma.storageUnit.findUnique({
                    where: { id: data.storageUnits[0].id },
                });

                expect(unit).toBeNull();
            });
        });

        test('create storageunit', async ({ page, staticData: { data, organisationId } }) => {
            const rows = page.locator(`tbody tr`);
            const offcanvas = page.getByRole('dialog');
            const createButton = page.getByRole('button', { name: /create/i });
            const nameInput = offcanvas.getByRole('textbox', { name: /Name/i });
            const descriptionInput = offcanvas.getByRole('textbox', { name: /Beschreibung/i });
            const capacityInput = offcanvas.getByRole('spinbutton', { name: /Kapazität/i });
            const reserveCheckbox = offcanvas.getByRole('switch', { name: /Für Reserven/i });
            const saveButton = offcanvas.getByRole('button', { name: /speichern/i });

            await test.step('open create offcanvas', async () => {
                await createButton.click();
                await expect(offcanvas).toBeVisible();
            });

            await test.step('fill in storage unit details', async () => {
                await expect(offcanvas.getByRole('heading', { name: /Lagereinheit anlegen/i })).toBeVisible();


                await nameInput.fill('XX Storage Unit');
                await descriptionInput.fill('This is a new storage unit.');
                await capacityInput.fill('50');
                await reserveCheckbox.check();
                await saveButton.click();
            });

            await test.step('check updated ui', async () => {
                await expect(rows).toHaveCount(data.storageUnits.length + 1);

                const newRow = rows.nth(data.storageUnits.length);
                const cells = newRow.getByRole('cell');

                await Promise.all([
                    expect(cells.nth(0)).toHaveText('XX Storage Unit'),
                    expect(cells.nth(1)).toHaveText('This is a new storage unit.'),
                    expect(cells.nth(2)).toHaveText('50'),
                    expect(cells.nth(3)).toHaveText('Ja'),
                    expect(cells.nth(4)).toHaveText('0'),

                    expect(offcanvas.getByRole('heading', { name: 'XX Storage Unit' })).toBeVisible(),
                    expect(nameInput).toBeHidden(),
                    expect(descriptionInput).toBeVisible(),
                    expect(capacityInput).toBeVisible(),
                    expect(reserveCheckbox).toBeVisible(),

                    expect(descriptionInput).toHaveValue('This is a new storage unit.'),
                    expect(capacityInput).toHaveValue('50'),
                    expect(reserveCheckbox).toBeChecked(),
                ]);
            });

            await test.step('check db update', async () => {
                const unit = await prisma.storageUnit.findFirst({
                    where: { name: 'XX Storage Unit' },
                });

                expect(unit).toBeDefined();
                expect(unit).toStrictEqual(
                    expect.objectContaining({
                        name: 'XX Storage Unit',
                        description: 'This is a new storage unit.',
                        capacity: 50,
                        isReserve: true,
                        organisationId: organisationId,
                        id: expect.any(String), // ID is auto-generated, so we check it exists
                    })
                );
            });
        });

        test('cancel create storageunit', async ({ page }) => {
            const offcanvas = page.getByRole('dialog');
            const createButton = page.getByRole('button', { name: /create/i });
            const cancelButton = offcanvas.getByRole('button', { name: /abbrechen/i });

            await test.step('open create offcanvas', async () => {
                await createButton.click();
                await expect(offcanvas).toBeVisible();
            });

            await test.step('cancel creation', async () => {
                await cancelButton.click();
                await expect(offcanvas).toBeHidden();
            });
        });
    });

    test.describe('uniform list', () => {
        test('remove uniformItem from Storageunit', async ({ page, staticData: { ids } }) => {
            const rows = page.locator(`tbody tr`);
            const offcanvas = page.getByRole('dialog');

            await test.step('open offcanvas', async () => {
                await rows.nth(0).getByRole('button', { name: /open/ }).click();

                await expect(offcanvas).toBeVisible();
            });

            await test.step('remove uniformitem', async () => {
                const uniformRows = offcanvas.getByRole('table', { name: /uniformlist/i }).locator('tbody tr');
                await expect(uniformRows).toHaveCount(2);
                await expect(uniformRows.getByText(/1108/i)).toBeVisible();
                await expect(uniformRows.getByText(/1109/i)).toBeVisible();

                const removeButton = uniformRows.nth(0).getByRole('button', { name: /entfernen/i });
                await uniformRows.nth(0).hover();
                await removeButton.click();
                await expect(uniformRows).toHaveCount(1);
                await expect(uniformRows.getByText(/1108/i)).toBeHidden();
                await expect(uniformRows.getByText(/1109/i)).toBeVisible();
                await expect(rows.nth(0).getByRole('cell').nth(4)).toHaveText('1');
            });

            await test.step('check db update', async () => {
                const uniform = await prisma.uniform.findFirst({
                    where: { id: ids.uniformIds[0][8] },
                });

                expect(uniform).toBeDefined();
                expect(uniform?.number).toBe(1108);
                expect(uniform?.storageUnitId).toBeNull();
            });
        });

        test('add uniformItem to Storageunit', async ({ page, staticData: { data, ids } }) => {
            const rows = page.locator(`tbody tr`);
            const offcanvas = page.getByRole('dialog');
            const addUniformInput = offcanvas.getByRole('textbox', { name: /hinzufügen/i });
            const uniformRows = offcanvas.getByRole('table', { name: /uniformlist/i }).locator('tbody tr');

            await test.step('open offcanvas', async () => {
                await rows.nth(0).getByRole('button', { name: /open/ }).click();
                await expect(offcanvas).toBeVisible();
            });

            await test.step('add uniformitem', async () => {
                await expect(uniformRows).toHaveCount(2);
                await expect(uniformRows.getByText(/1110/i)).toBeHidden();

                await expect(addUniformInput).toBeVisible();
                await addUniformInput.fill("1110");
                await offcanvas.getByRole('option', { name: /1110/i }).click();
            });

            await test.step('validate ui', async () => {
                await expect(uniformRows).toHaveCount(3);
                await expect(uniformRows.getByText(/1108/i)).toBeVisible();
                await expect(uniformRows.getByText(/1109/i)).toBeVisible();
                await expect(uniformRows.getByText(/1110/i)).toBeVisible();
                await expect(rows.nth(0).getByRole('cell').nth(4)).toHaveText('3');
            });

            await test.step('check db update', async () => {
                const uniform = await prisma.uniform.findFirst({
                    where: { id: ids.uniformIds[0][10] },
                });

                expect(uniform).toBeDefined();
                expect(uniform?.number).toBe(1110);
                expect(uniform?.storageUnitId).toBe(data.storageUnits[0].id);
            });
        });

        test('add uniformItem to full storageunit', async ({ page, staticData: { ids, data } }) => {
            const rows = page.locator(`tbody tr`);
            const offcanvas = page.getByRole('dialog');
            const addUniformInput = offcanvas.getByRole('textbox', { name: /hinzufügen/i });
            const uniformRows = offcanvas.getByRole('table', { name: /uniformlist/i }).locator('tbody tr');

            await test.step('open offcanvas', async () => {
                await rows.nth(1).getByRole('button', { name: /open/ }).click();
                await expect(offcanvas).toBeVisible();
            });

            await test.step('try to add uniformitem', async () => {
                await expect(uniformRows).toHaveCount(5);
                await expect(uniformRows.getByText(/1110/i)).toBeHidden();

                await expect(addUniformInput).toBeVisible();
                await addUniformInput.fill("1110");
                await offcanvas.getByRole('option', { name: /1110/i }).click();

                const warningMessage = page.getByRole('dialog', { name: /Warnungsmeldung/i });
                await expect(warningMessage).toBeVisible();
                await expect(warningMessage.getByText(/Lagereinheit voll/i)).toBeVisible();
                await warningMessage.getByRole('button', { name: /speichern/i }).click();
                await expect(warningMessage).toBeHidden();
            });

            await test.step('validate ui', async () => {
                await expect(uniformRows).toHaveCount(6);
                await expect(uniformRows.getByText(/1110/i)).toBeVisible();
                await expect(rows.nth(1).getByRole('cell').nth(4)).toHaveText('6');
            });

            await test.step('check db update', async () => {
                const uniform = await prisma.uniform.findFirst({
                    where: { id: ids.uniformIds[0][10] },
                });

                expect(uniform).toBeDefined();
                expect(uniform?.number).toBe(1110);
                expect(uniform?.storageUnitId).toBe(data.storageUnits[1].id);
            });
        });
    });
});
