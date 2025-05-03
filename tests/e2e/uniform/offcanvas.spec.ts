import { prisma } from "@/lib/db";
import { adminTest as test } from "../../_playwrightConfig/setup";
import { expect } from "playwright/test";



test.describe('Offcanvas - CadetOverview', () => {
    test.beforeEach(async ({ page, staticData: { ids } }) => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`);
    });
    test.afterEach(async ({ staticData: { cleanup } }) => {
        await cleanup.uniform();
    });

    const openOffcanvas = async (page: any, uniformId: string) => {
        const cadetUniformRow = await page.getByTestId(`div_uniform_typeList`).getByTestId(`div_uitem_${uniformId}`);
        await cadetUniformRow.getByRole('button', { name: /open/i }).click();
        await page.waitForSelector('div[role="dialog"]', { state: 'visible' });
        return page.getByRole('dialog');
    }

    test('should open and close offcanvas', async ({ page, staticData: { ids } }) => {
        const cadetUniformRow = await page.getByTestId(`div_uniform_typeList`).getByTestId(`div_uitem_${ids.uniformIds[0][84]}`)
        await cadetUniformRow.getByRole('button', { name: /open/i }).click();
        await page.waitForSelector('div[role="dialog"]', { state: 'visible' });

        const offcanvas = page.getByRole('dialog');
        await expect(offcanvas).toBeVisible();
        await offcanvas.getByRole('button', { name: /close/i }).click();
        await expect(offcanvas).not.toBeVisible();
    });

    test('should allow to edit and save uniform', async ({ page, staticData: { ids } }) => {
        const cadetUniformRow = page.getByTestId(`div_uniform_typeList`).getByTestId(`div_uitem_${ids.uniformIds[0][84]}`);
        const dialog = await openOffcanvas(page, ids.uniformIds[0][84]);
        const activeField = dialog.getByLabel(/Status/i);
        const generationField = dialog.getByLabel(/Generation/i);
        const sizeField = dialog.getByLabel(/Größe/i);
        const commentField = dialog.getByLabel(/Kommentar/i);

        await test.step('Edit and save uniform', async () => {
            const editButton = dialog.getByRole('button', { name: /Bearbeiten/i });
            await editButton.click();

            await activeField.uncheck();
            await generationField.selectOption({ label: 'Generation1-1' });
            await sizeField.selectOption({ label: '1' });
            await commentField.fill('Test comment');

            const saveButton = dialog.getByRole('button', { name: /Speichern/i });
            await saveButton.click();
            await expect(commentField).toBeDisabled();
        });
        expect(cadetUniformRow).toBeVisible();
        await Promise.all([
            test.step('validate dialog', async () => Promise.all([
                expect(activeField).toHaveText('Reserve'),
                expect(generationField).toHaveText('Generation1-1'),
                expect(sizeField).toHaveText('1'),
                expect(commentField).toHaveText('Test comment'),
            ])),
            test.step('validate cadetUniformRow', async () => Promise.all([
                expect(cadetUniformRow.getByTestId('div_number')).toHaveText('1184'),
                expect(cadetUniformRow.getByTestId('div_generation')).toHaveText('Generation1-1'),
                expect(cadetUniformRow.getByTestId('div_size')).toHaveText('1'),
                expect(cadetUniformRow.getByTestId('div_comment')).toHaveText('Test comment'),
                expect(cadetUniformRow.getByTestId('div_number')).toHaveClass(/text-danger/),
            ])),
            test.step('validate db', async () => {
                const cadetUniform = await prisma.uniform.findFirst({
                    where: {
                        id: ids.uniformIds[0][84],
                    },
                });
                expect(cadetUniform).toBeDefined();
                expect(cadetUniform?.active).toBe(false);
                expect(cadetUniform?.comment).toBe('Test comment');
            }),
        ]);
    });
});