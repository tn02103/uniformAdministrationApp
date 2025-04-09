import { expect } from "playwright/test";
import { UniformType } from "@prisma/client";
import german from "../../../../public/locales/de";
import { adminTest } from "../../../_playwrightConfig/setup";
import { setTimeout } from "timers/promises";
import { prisma } from "@/lib/db";
import { off } from "process";
import { DangerConfirmationModal } from "../../../_playwrightConfig/pages/popups/DangerConfirmationPopup.component";


const actionText = german.common.actions;
const typeText = german.common.uniform.type;

type Fixture = {
    types: UniformType[];
}

const test = adminTest.extend<Fixture>({
    types: async ({ staticData }, use) => {
        use(staticData.data.uniformTypes.filter(t => t.recdelete === null));
    },
});
test.beforeEach(async ({ page }) => {
    await page.goto('/de/app/admin/uniform');
})
test.afterEach(async ({ staticData: { cleanup } }) => {
    await cleanup.uniformTypeConfiguration();
});

test.describe('UniformType Configuration', () => {
    test('create type wihtout sizes', async ({ page, staticData: { fk_assosiation } }) => {
        await test.step('open create type offcanvas', async () => {
            await expect(page.getByRole('button', { name: 'create' })).toBeVisible();
            await page.getByRole('button', { name: 'create' }).click();
            await expect(page.getByRole('dialog').getByRole('heading', { name: actionText.create })).toBeVisible();
        });
        const offcanvas = page.getByRole('dialog');

        await test.step('fill the form and submit', async () => {
            await offcanvas.getByRole('textbox', { name: german.common.name }).fill('New Type');
            await offcanvas.getByRole('textbox', { name: typeText.acronym }).fill('NT');
            await offcanvas.getByRole('spinbutton', { name: typeText.issuedDefault }).fill('4');
            await offcanvas.getByRole('button', { name: actionText.create }).click();
        });

        await test.step('check if the type is created', async () => {
            await offcanvas.getByRole('heading', { name: 'New Type' }).waitFor({ state: 'visible' });
            await expect(offcanvas.getByRole('button', { name: actionText.cancel })).not.toBeVisible();
            await expect(offcanvas.getByRole('button', { name: actionText.create })).not.toBeVisible();

            await expect(offcanvas.getByRole('textbox', { name: typeText.name })).toHaveValue('New Type');
            await expect(offcanvas.getByRole('textbox', { name: typeText.acronym })).toHaveValue('NT');
            await expect(offcanvas.getByRole('spinbutton', { name: typeText.issuedDefault })).toHaveValue('4');
            await expect(offcanvas.getByRole('textbox', { name: typeText.name })).toBeDisabled();
            await expect(offcanvas.getByRole('textbox', { name: typeText.acronym })).toBeDisabled();
            await expect(offcanvas.getByRole('spinbutton', { name: typeText.issuedDefault })).toBeDisabled();

            await expect(page.getByRole('table', { name: typeText["type#other"] })).toBeVisible();
            expect(page.getByRole('table', { name: typeText["type#other"] }).getByRole('row', { name: 'New Type' })).toBeVisible();
        });

        await test.step('validate db data', async () => {
            const dbType = await prisma.uniformType.findFirst({
                where: {
                    fk_assosiation,
                    name: 'New Type',
                }
            });

            expect(dbType).not.toBeNull();
            expect(dbType).toEqual(expect.objectContaining({
                acronym: 'NT',
                issuedDefault: 4,
                usingGenerations: false,
                usingSizes: false,
                fk_defaultSizelist: null,
                sortOrder: 4,
            }));
        });
    });

    test('create type with sizes', async ({ page, staticData: { fk_assosiation, ids, data } }) => {
        const sizeList = data.uniformSizelists[0]
        await test.step('open dialog', async () => {
            await expect(page.getByRole('button', { name: 'create' })).toBeVisible();
            await page.getByRole('button', { name: 'create' }).click();
            await expect(page.getByRole('dialog').getByRole('heading', { name: actionText.create })).toBeVisible();
        });
        const offcanvas = page.getByRole('dialog');
        await test.step('fill in form', async () => {
            await offcanvas.getByRole('textbox', { name: german.common.name }).fill('New Type 2');
            await offcanvas.getByRole('textbox', { name: typeText.acronym }).fill('NB');
            await offcanvas.getByRole('spinbutton', { name: typeText.issuedDefault }).fill('2');
            await offcanvas.getByRole('switch', { name: typeText.usingSizes }).check();
            await offcanvas.getByRole('switch', { name: typeText.usingGenerations }).check();
            await offcanvas.getByRole('combobox', { name: typeText.defaultSizelist }).selectOption(sizeList.id);
            await offcanvas.getByRole('button', { name: actionText.create }).click();
        });

        await test.step('check if the type is created', async () => {
            await offcanvas.getByRole('heading', { name: 'New Type 2' }).waitFor({ state: 'visible' });
            await expect(offcanvas.getByRole('button', { name: actionText.cancel })).not.toBeVisible();
            await expect(offcanvas.getByRole('button', { name: actionText.create })).not.toBeVisible();

            await expect(offcanvas.getByRole('textbox', { name: typeText.name })).toHaveValue('New Type 2');
            await expect(offcanvas.getByRole('textbox', { name: typeText.acronym })).toHaveValue('NB');
            await expect(offcanvas.getByRole('spinbutton', { name: typeText.issuedDefault })).toHaveValue('2');
            await expect(offcanvas.getByRole('switch', { name: typeText.usingSizes })).toBeChecked();
            await expect(offcanvas.getByRole('switch', { name: typeText.usingGenerations })).toBeChecked();
            await expect(offcanvas.getByRole('paragraph')).toHaveText(sizeList.name);
            await expect(offcanvas.getByRole('textbox', { name: typeText.name })).toBeDisabled();
            await expect(offcanvas.getByRole('textbox', { name: typeText.acronym })).toBeDisabled();
            await expect(offcanvas.getByRole('spinbutton', { name: typeText.issuedDefault })).toBeDisabled();
        });
        await test.step('validate db data', async () => {
            const dbType = await prisma.uniformType.findFirst({
                where: {
                    fk_assosiation,
                    name: 'New Type 2',
                }
            });

            expect(dbType).not.toBeNull();
            expect(dbType).toEqual(expect.objectContaining({
                acronym: 'NB',
                issuedDefault: 2,
                usingGenerations: true,
                usingSizes: true,
                fk_defaultSizelist: ids.sizelistIds[0],
                sortOrder: 4,
            }));
        });
    });

    test('update type', async ({ page, types }) => {
        await test.step('open type offcanvas', async () => {
            expect(page.getByRole('row', { name: types[0].name })).toBeVisible();
            await page.getByRole('row', { name: types[0].name }).getByRole('button', { name: 'open' }).click();
            await expect(page.getByRole('dialog').getByRole('heading', { name: types[0].name })).toBeVisible();
        });
        const dialog = page.getByRole('dialog');
        await test.step('change values and submit', async () => {
            await dialog.getByRole('button', { name: actionText.edit }).click();
            await dialog.getByRole('textbox', { name: typeText.name }).fill('Updated');
            await dialog.getByRole('textbox', { name: typeText.acronym }).fill('UT');
            await dialog.getByRole('spinbutton', { name: typeText.issuedDefault }).fill('3');
            await dialog.getByRole('switch', { name: typeText.usingSizes }).uncheck();
            await dialog.getByRole('switch', { name: typeText.usingGenerations }).check();
            await dialog.getByRole('button', { name: actionText.save }).click();
            await dialog.getByRole('button', { name: actionText.save }).waitFor({ state: 'hidden' });
        });

        await test.step('check if the type is updated', async () => {
            await expect(dialog.getByRole('heading', { name: 'Updated' })).toBeVisible();
            await expect(dialog.getByRole('button', { name: actionText.cancel })).not.toBeVisible();
            await expect(dialog.getByRole('button', { name: actionText.save })).not.toBeVisible();

            await expect(dialog.getByRole('textbox', { name: typeText.name })).toHaveValue('Updated');
            await expect(dialog.getByRole('textbox', { name: typeText.acronym })).toHaveValue('UT');
            await expect(dialog.getByRole('spinbutton', { name: typeText.issuedDefault })).toHaveValue('3');
            await expect(dialog.getByRole('switch', { name: typeText.usingSizes })).not.toBeChecked();
            await expect(dialog.getByRole('switch', { name: typeText.usingGenerations })).toBeChecked();

        });
        await test.step('validate db data', async () => {
            const dbType = await prisma.uniformType.findUnique({
                where: {
                    id: types[0].id,
                }
            });

            expect(dbType).not.toBeNull();
            expect(dbType).toEqual(expect.objectContaining({
                name: 'Updated',
                acronym: 'UT',
                issuedDefault: 3,
                usingGenerations: true,
                usingSizes: false,
                fk_defaultSizelist: types[0].fk_defaultSizelist,
            }));
        });
    });

    test('delete type', async ({ page, types, staticData: { fk_assosiation } }) => {
        const dangerDialog = new DangerConfirmationModal(page);
        await test.step('open type offcanvas', async () => {
            expect(page.getByRole('row', { name: types[0].name })).toBeVisible();
            await page.getByRole('row', { name: types[0].name }).getByRole('button', { name: 'open' }).click();
            await expect(page.getByRole('dialog').getByRole('heading', { name: types[0].name })).toBeVisible();
        });

        const dialog = page.getByRole('dialog');

        await test.step('click delete button and handle danger dialog', async () => {
            await dialog.getByRole('button', { name: actionText.delete }).click();
            await expect(dangerDialog.div_popup).toBeVisible();
            await expect(dangerDialog.div_header).toContainText(types[0].name);
            await expect(dangerDialog.div_message).toContainText('82');

            await dangerDialog.txt_confirmation.fill(`Uniformtyp-${types[0].name}`);
            await dangerDialog.btn_save.click();
        });

        await test.step('check if offcanvas is closed and type is removed from table', async () => {
            await dialog.waitFor({ state: 'hidden' });
            await expect(page.getByRole('row', { name: types[0].name })).not.toBeVisible();
        });

        await test.step('validate recdelete in database', async () => {
            const dbType = await prisma.uniformType.findUnique({
                where: {
                    id: types[0].id,
                },
            });

            expect(dbType).not.toBeNull();
            expect(dbType?.recdelete).not.toBeNull();
            expect(dbType?.recdelete).toBeInstanceOf(Date);
            expect(dbType?.recdeleteUser).toEqual('test4')
        });
    });

    test('change sortOrder down', async ({ page, types }) => {
        await test.step('change sortOrder', async () => {
            const firstRow = page.getByRole('row', { name: types[0].name });
            const thirdRow = page.getByRole('row', { name: types[2].name });
            const firstRowMove = firstRow.getByRole('cell', { name: 'move Item' });
            const thirdRowMove = thirdRow.getByRole('cell', { name: 'move Item' });
            await expect(firstRow).toBeVisible()
            await expect(firstRowMove).toBeVisible();
            await expect(thirdRow).toBeVisible()
            await expect(thirdRowMove).toBeVisible();
            await firstRowMove.locator('span[draggable]').dragTo(thirdRowMove);
        });

        await test.step('check if the order is changed', async () => {
            const rows = await page.locator('tbody').getByRole('row').all();
            await expect(rows).toHaveLength(4);
            await expect(rows[0]).toHaveAttribute('aria-label', types[1].name);
            await expect(rows[1]).toHaveAttribute('aria-label', types[2].name);
            await expect(rows[2]).toHaveAttribute('aria-label', types[0].name);
            await expect(rows[3]).toHaveAttribute('aria-label', types[3].name);
        });

        await test.step('validate db data', async () => {
            const dbList = await prisma.uniformType.findMany({
                where: {
                    fk_assosiation: types[0].fk_assosiation,
                    recdelete: null,
                },
                orderBy: {
                    sortOrder: 'asc',
                },
            });

            expect(dbList).toHaveLength(4);
            expect(dbList[0].id).toBe(types[1].id);
            expect(dbList[1].id).toBe(types[2].id);
            expect(dbList[2].id).toBe(types[0].id);
            expect(dbList[3].id).toBe(types[3].id);
        });
    });
    test('change sortOrder up', async ({ page, types }) => {
        await test.step('change sortOrder', async () => {
            const secondRow = page.getByRole('row', { name: types[1].name });
            const thirdRow = page.getByRole('row', { name: types[2].name });
            const secondRowMove = secondRow.getByRole('cell', { name: 'move Item' });
            const thirdRowMove = thirdRow.getByRole('cell', { name: 'move Item' });

            await expect(secondRow).toBeVisible()
            await expect(secondRowMove).toBeVisible();
            await expect(thirdRow).toBeVisible()
            await expect(thirdRowMove).toBeVisible();
            await thirdRowMove.locator('span[draggable]').dragTo(secondRowMove);
        });

        await test.step('check if the order is changed', async () => {
            const rows = await page.locator('tbody').getByRole('row').all();
            await expect(rows).toHaveLength(4);
            await expect(rows[0]).toHaveAttribute('aria-label', types[0].name);
            await expect(rows[1]).toHaveAttribute('aria-label', types[2].name);
            await expect(rows[2]).toHaveAttribute('aria-label', types[1].name);
            await expect(rows[3]).toHaveAttribute('aria-label', types[3].name);
        });

        await test.step('validate db data', async () => {
            const dbList = await prisma.uniformType.findMany({
                where: {
                    fk_assosiation: types[0].fk_assosiation,
                    recdelete: null,
                },
                orderBy: {
                    sortOrder: 'asc',
                },
            });

            expect(dbList).toHaveLength(4);
            expect(dbList[0].id).toBe(types[0].id);
            expect(dbList[1].id).toBe(types[2].id);
            expect(dbList[2].id).toBe(types[1].id);
            expect(dbList[3].id).toBe(types[3].id);
        });
    });
});