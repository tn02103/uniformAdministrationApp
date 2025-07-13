/* eslint-disable playwright/missing-playwright-await */
import german from "@/../public/locales/de";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { expect } from "playwright/test";
import { newDescriptionValidationTests } from "../../_playwrightConfig/global/testSets";
import { DeficiencyTypeAdministrationPage } from "../../_playwrightConfig/pages/admin/inspection/DeficiencyTypeAdministration.page";
import { MessagePopupComponent } from "../../_playwrightConfig/pages/popups/MessagePopup.component";
import { adminTest } from "../../_playwrightConfig/setup";

type Fixture = {
    typeComponent: DeficiencyTypeAdministrationPage
}

const test = adminTest.extend<Fixture>({
    typeComponent: ({ page }, use) => use(new DeficiencyTypeAdministrationPage(page)),
});

test.beforeEach(async ({ page }) => {
    await page.goto(`/de/app/inspection/deficiencyType`);
});
test.afterEach(async ({ staticData }) => {
    await staticData.cleanup.inspection()
});

test.describe('<DeficiencyTypeAdministrationPage />', () => {
    test('E2E060401: validate typelist', async ({ typeComponent, staticData: { data } }) => {
        await expect(typeComponent.div_typeList).toHaveCount(data.deficiencyTypes.length);
        await test.step('sortorder', async () => {
            await Promise.all([
                expect.soft(typeComponent.div_typeList.nth(0)).toHaveAttribute('data-testid', `div_type_${data.deficiencyTypes[1].id}`),
                expect.soft(typeComponent.div_typeList.nth(1)).toHaveAttribute('data-testid', `div_type_${data.deficiencyTypes[3].id}`),
                expect.soft(typeComponent.div_typeList.nth(2)).toHaveAttribute('data-testid', `div_type_${data.deficiencyTypes[2].id}`),
                expect.soft(typeComponent.div_typeList.nth(3)).toHaveAttribute('data-testid', `div_type_${data.deficiencyTypes[0].id}`),
                expect.soft(typeComponent.div_typeList.nth(4)).toHaveAttribute('data-testid', `div_type_${data.deficiencyTypes[7].id}`),
                expect.soft(typeComponent.div_typeList.nth(5)).toHaveAttribute('data-testid', `div_type_${data.deficiencyTypes[5].id}`),
                expect.soft(typeComponent.div_typeList.nth(6)).toHaveAttribute('data-testid', `div_type_${data.deficiencyTypes[4].id}`),
                expect.soft(typeComponent.div_typeList.nth(7)).toHaveAttribute('data-testid', `div_type_${data.deficiencyTypes[6].id}`),
            ]);
        });

        await test.step('data', async () => Promise.all(
            data.deficiencyTypes.map(async (type) => {
                const rowComponent = typeComponent.getRowComponent(type.id);
                const active = data.deficiencies.filter(t => t.fk_deficiencyType == type.id && t.dateResolved === null);
                const resolved = data.deficiencies.filter(t => t.fk_deficiencyType == type.id && t.dateResolved !== null);

                const promises: Promise<void>[] = [];
                promises.push(
                    expect.soft(rowComponent.txt_name).toHaveValue(type.name),
                    expect.soft(rowComponent.div_amount_active).toHaveText(String(active.length)),
                    expect.soft(rowComponent.div_amount_resolved).toHaveText(String(resolved.length))
                );

                if (type.dependent)
                    promises.push(expect.soft(rowComponent.div_dependent).toHaveText(german.admin.deficiency.entity[type.dependent]));
                else
                    promises.push(expect.soft(rowComponent.div_dependent).toHaveText(''));

                if (type.relation)
                    promises.push(expect.soft(rowComponent.div_relation).toHaveText(german.admin.deficiency.entity[type.relation]));
                else
                    promises.push(expect.soft(rowComponent.div_relation).toHaveText(''));

                if (type.disabledDate) {// type.disabledDate 
                    promises.push(
                        expect.soft(rowComponent.div_disabled).toBeVisible(),
                        expect.soft(rowComponent.div_disabled).toContainText(format(type.disabledDate, "dd.MM.yyyy")),
                        expect.soft(rowComponent.btn_edit).toBeHidden(),
                        expect.soft(rowComponent.btn_deactivate).toBeHidden(),
                        expect.soft(rowComponent.btn_reactivate).toBeVisible(),
                        expect.soft(rowComponent.btn_delete).toBeVisible()
                    );
                } else {
                    promises.push(
                        expect.soft(rowComponent.div_disabled).toBeHidden(),
                        expect.soft(rowComponent.btn_edit).toBeVisible(),
                        expect.soft(rowComponent.btn_reactivate).toBeHidden()
                    );

                    if (active.length > 0) {
                        promises.push(expect.soft(rowComponent.btn_deactivate).toBeVisible());
                        promises.push(expect.soft(rowComponent.btn_delete).toBeHidden());
                    } else {
                        promises.push(expect.soft(rowComponent.btn_deactivate).toBeHidden());
                        promises.push(expect.soft(rowComponent.btn_delete).toBeVisible());
                    }
                }

                await Promise.all(promises);
            })
        ));
    });

    test('E2E060402: edit unused type', async ({ typeComponent, staticData }) => {
        const type = staticData.data.deficiencyTypes[5]; // unused type
        const rowComponent = typeComponent.getRowComponent(type.id);
        await rowComponent.btn_edit.click();

        await test.step('validate editable status', async () => Promise.all([
            // buttons
            expect.soft(rowComponent.btn_edit).toBeHidden(),
            expect.soft(rowComponent.btn_save).toBeVisible(),
            expect.soft(rowComponent.btn_cancel).toBeVisible(),

            // elements not visible
            expect.soft(rowComponent.div_amount_active).toBeHidden(),
            expect.soft(rowComponent.div_amount_resolved).toBeHidden(),

            // form elements
            expect.soft(rowComponent.txt_name).toBeEditable(),
            expect.soft(rowComponent.sel_dependent).toBeVisible(),
            expect.soft(rowComponent.sel_relation).toBeVisible(),
        ]));

        await test.step('change data', async () => {
            await rowComponent.txt_name.fill('NewName');
            await rowComponent.sel_dependent.selectOption('uniform')
            await rowComponent.btn_save.click();
        });

        await test.step('validate ui', async () => {
            await expect(rowComponent.txt_name).toHaveValue('NewName');
            await Promise.all([
                // buttons
                expect.soft(rowComponent.btn_edit).toBeVisible(),
                expect.soft(rowComponent.btn_save).toBeHidden(),
                expect.soft(rowComponent.btn_cancel).toBeHidden(),

                // elements not visible
                expect.soft(rowComponent.div_dependent).toBeVisible(),
                expect.soft(rowComponent.div_relation).toBeVisible(),
                expect.soft(rowComponent.div_amount_active).toBeVisible(),
                expect.soft(rowComponent.div_amount_resolved).toBeVisible(),

                // form elements
                expect.soft(rowComponent.txt_name).not.toBeEditable(),
                expect.soft(rowComponent.sel_dependent).toBeHidden(),
                expect.soft(rowComponent.sel_relation).toBeHidden(),
            ]);
        });
        await test.step('validate db', async () => {
            await expect(async () => {
                const dbData = await prisma.deficiencyType.findUnique({
                    where: { id: type.id }
                });
                expect(dbData).not.toBeNull();
                expect(dbData!.name).toBe('NewName');
                expect(dbData!.dependent).toBe('uniform');
                expect(dbData!.relation).toBeNull();
            }).toPass();
        });
    });
    test('E2E060403: edit used type', async ({ typeComponent, staticData }) => {
        const type = staticData.data.deficiencyTypes[0];
        const rowComponent = typeComponent.getRowComponent(type.id);

        await test.step('make editable', async () => {
            await rowComponent.btn_edit.click();
            await expect(rowComponent.sel_dependent).toBeVisible();
            await expect(rowComponent.btn_edit).toBeHidden();
        });

        await test.step('validate selects', async () => {
            await expect(rowComponent.sel_dependent).not.toBeEditable();
            await expect(rowComponent.sel_relation).not.toBeEditable();
        });

        await test.step('vaidate cancel', async () => {
            await rowComponent.txt_name.fill('Something');
            await rowComponent.btn_cancel.click();
            await expect(rowComponent.btn_edit).toBeVisible();
            await expect(rowComponent.sel_dependent).toBeHidden();
            await expect(rowComponent.txt_name).not.toBeEditable();
            await expect(rowComponent.txt_name).toHaveValue(type.name);
        });
    });
    test('E2E060404: create type', async ({ typeComponent, staticData }) => {
        const rowComponent = typeComponent.getRowComponent('new');

        await test.step('open new-type row', async () => {
            await expect(rowComponent.div_row).toBeHidden();
            await typeComponent.btn_create.click();
            await expect(rowComponent.div_row).toBeVisible();
            await expect.soft(rowComponent.txt_name).toBeEditable();
        });
        await test.step('create type', async () => {
            await rowComponent.txt_name.fill('NewType');
            await rowComponent.sel_dependent.selectOption('uniform');
            await rowComponent.btn_save.click();

            await expect(rowComponent.div_row).toBeHidden();
            await expect(typeComponent.div_typeList).toHaveCount(staticData.data.deficiencyTypes.length + 1);
        });
        const dbType = await prisma.deficiencyType.findFirst({
            where: {
                name: "NewType",
                fk_assosiation: staticData.fk_assosiation
            }
        });
        expect(dbType).not.toBeNull();
        await test.step('validate ui', async () => {
            const rowIdComponent = typeComponent.getRowComponent(dbType!.id);
            await Promise.all([
                expect.soft(rowIdComponent.txt_name).toHaveValue('NewType'),
                expect.soft(rowIdComponent.div_dependent).toHaveText('Uniformteil'),
                expect.soft(rowIdComponent.div_relation).toHaveText(''),
                expect.soft(rowIdComponent.div_amount_active).toHaveText('0'),
                expect.soft(rowIdComponent.div_amount_resolved).toHaveText('0'),
            ]);
        });
        await test.step('validate db', async () => {
            expect(dbType).toStrictEqual(expect.objectContaining({
                name: "NewType",
                dependent: "uniform",
                relation: null,
                disabledDate: null,
                disabledUser: null,
                fk_assosiation: staticData.fk_assosiation,
            }));
        });
    });
    test('E2E060405: deactivate type', async ({ typeComponent, staticData }) => {
        const rowComponent = typeComponent.getRowComponent(staticData.ids.deficiencyTypeIds[1]);
        await test.step('deactivate type Cadet and validate ui', async () => {
            await expect(typeComponent.div_typeList.nth(0)).toHaveAttribute('data-testid', `div_type_${rowComponent.id}`);
            await rowComponent.btn_deactivate.click();

            await expect(typeComponent.div_typeList.nth(5)).toHaveAttribute('data-testid', `div_type_${rowComponent.id}`);
            await expect(rowComponent.div_disabled).toBeVisible();
        });
        await test.step('validate db', async () => {
            const dbType = await prisma.deficiencyType.findUnique({
                where: { id: rowComponent.id },
            });
            expect(dbType).not.toBeNull();
            expect(dbType!.disabledDate?.setUTCHours(0, 0, 0, 0)).toStrictEqual(new Date().setUTCHours(0, 0, 0, 0))
            expect(dbType!.disabledUser).toBe('test4');
        });
    });
    test('E2E060406: delete type', async ({ typeComponent, page, staticData }) => {
        const popup = new MessagePopupComponent(page);
        const rowComponent = typeComponent.getRowComponent(staticData.ids.deficiencyTypeIds[4]);

        await test.step('open and validate popup', async () => {
            await expect(popup.div_popup).toBeHidden();
            await rowComponent.btn_delete.click();
            await expect(popup.div_popup).toBeVisible();
            await expect(popup.div_header).toHaveClass(/bg-warning/);
        });
        await test.step('delete and validate ui', async () => {
            await popup.btn_save.click();
            await expect(popup.div_popup).toBeHidden();
            await expect(rowComponent.div_row).toBeHidden();
        });
        await test.step('validate type and def deleted', async () => {
            const [dbType, dbDeficiency] = await prisma.$transaction([
                prisma.deficiencyType.findUnique({
                    where: { id: rowComponent.id }
                }),
                prisma.deficiency.findUnique({
                    where: { id: staticData.ids.deficiencyIds[13] }
                }),
            ]);
            expect(dbType).toBeNull();
            expect(dbDeficiency).toBeNull();
        });
    });
    test('E2E060407: reactivate type', async ({ typeComponent, staticData }) => {
        const rowComponent = typeComponent.getRowComponent(staticData.ids.deficiencyTypeIds[4]);
        rowComponent.btn_reactivate.click();
        await expect(rowComponent.div_disabled).toBeHidden();
        await expect(typeComponent.div_typeList.nth(3)).toHaveAttribute('data-testid', `div_type_${rowComponent.id}`);

        const dbType = await prisma.deficiencyType.findUnique({
            where: { id: rowComponent.id }
        });
        expect(dbType).not.toBeNull();
        expect(dbType!.disabledDate).toBeNull();
        expect(dbType!.disabledUser).toBeNull();
    });
    test('E2E060408: validate formComponents', async ({ typeComponent }) => {
        const rowComponent = typeComponent.getRowComponent('new');
        await typeComponent.btn_create.click();
        await test.step('name formvalidation', async () => {
            const testSets = newDescriptionValidationTests({ minLength: 1, maxLength: 20 })
            for (const set of testSets) {
                await test.step(String(set.testValue), async () => {
                    await rowComponent.txt_name.fill(String(set.testValue));
                    if (set.valid) {
                        await expect.soft(rowComponent.err_name).toBeHidden();
                        await expect.soft(rowComponent.txt_name).not.toHaveClass(/invalid/);
                    } else {
                        await expect.soft(rowComponent.err_name).toBeVisible();
                        await expect.soft(rowComponent.txt_name).toHaveClass(/invalid/);
                    }
                });
            }
        });

        await test.step('validate dependent', async () => {
            const options = await rowComponent.sel_dependent.locator('option').all();
            expect(options).toHaveLength(2);
            await expect(options[0]).toHaveAttribute('value', 'cadet');
            await expect(options[1]).toHaveAttribute('value', 'uniform');
        });
        await test.step('validate relation', async () => {
            await test.step('for dependen cadet', async () => {
                await rowComponent.sel_dependent.selectOption('cadet');

                await expect(rowComponent.sel_relation).toBeEnabled();
                const options = await rowComponent.sel_relation.locator('option').all();
                expect(options).toHaveLength(3);
                await expect(options[0]).toHaveAttribute('value', 'null');
                await expect(options[1]).toHaveAttribute('value', 'uniform');
                await expect(options[2]).toHaveAttribute('value', 'material');

                await rowComponent.sel_relation.selectOption('uniform');
            });

            await test.step('for dependent uniform', async () => {
                await rowComponent.sel_dependent.selectOption('uniform');

                await expect(rowComponent.sel_relation).toBeDisabled();
                await expect(rowComponent.sel_relation).toHaveValue('');
            });
        });
    });
});
