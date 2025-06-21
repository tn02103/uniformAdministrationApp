import german from "@/../public/locales/de";
import { expect } from "playwright/test";
import { prisma } from "../../../../src/lib/db";
import { ValidationTestType, newDescriptionValidationTests, numberValidationTests } from "../../../_playwrightConfig/global/testSets";
import { MaterialGroupListComponent } from "../../../_playwrightConfig/pages/admin/material/MaterialGroupList.component";
import { MaterialListComponent } from "../../../_playwrightConfig/pages/admin/material/MaterialList.component";
import { DangerConfirmationModal } from "../../../_playwrightConfig/pages/popups/DangerConfirmationPopup.component";
import { EditMaterialPopupComponent } from "../../../_playwrightConfig/pages/popups/EditMaterialPopup.component";
import { adminTest } from "../../../_playwrightConfig/setup";


type Fixture = {
    groupListComponent: MaterialGroupListComponent;
    materialListComponent: MaterialListComponent;
    editMaterialPopup: EditMaterialPopupComponent;
}
const test = adminTest.extend<Fixture>({
    groupListComponent: async ({ page }, use) => use(new MaterialGroupListComponent(page)),
    materialListComponent: async ({ page }, use) => use(new MaterialListComponent(page)),
    editMaterialPopup: async ({ page }, use) => use(new EditMaterialPopupComponent(page)),
});
test.beforeEach(async ({ page, staticData }) => {
    await page.goto(`/de/app/admin/material?selectedGroupId=${staticData.ids.materialGroupIds[0]}`);
});
test.afterEach(async ({ staticData: { cleanup } }) => {
    await cleanup.materialConfig();
});

test('validate data', async ({ page, materialListComponent, staticData: { data } }) => {
    const divList = page.locator('div[data-testid^="div_material_"]');
    await expect(divList).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
        const material = data.materialTypes[i];
        const issued = data.materialIssuedEntries
            .filter(entry => entry.fk_material === material.id && !entry.dateReturned)
            .reduce((sum, entry) => sum + entry.quantity, 0);

        await test.step(material.typename, async () => Promise.all([
            expect.soft(divList.nth(i))
                .toHaveAttribute('data-testid', `div_material_${material.id}`),
            expect
                .soft(materialListComponent.div_material_name(material.id))
                .toHaveText(material.typename),
            expect
                .soft(materialListComponent.div_material_actualQuantity(material.id))
                .toHaveText(String(material.actualQuantity)),
            expect
                .soft(materialListComponent.div_material_targetQuantity(material.id))
                .toHaveText(String(material.targetQuantity)),
            expect
                .soft(materialListComponent.div_material_issuedQuantity(material.id))
                .toHaveText(String(issued)),
        ]));
    }
});

test('validate moveUp', async ({ page, materialListComponent, staticData: { ids } }) => {
    await test.step('do action and validate ui', async () => {
        await materialListComponent.btn_material_moveUp(ids.materialIds[1]).click();

        const divList = page.locator('div[data-testid^="div_material_"]');
        await expect.soft(divList.nth(0)).toHaveAttribute('data-testid', `div_material_${ids.materialIds[1]}`);
    });
    await test.step('validate db', async () => {
        const [initial, seccond] = await prisma.$transaction([
            prisma.material.findUnique({
                where: { id: ids.materialIds[1] }
            }),
            prisma.material.findUnique({
                where: { id: ids.materialIds[0] }
            }),
        ]);
        expect(initial).toBeDefined();
        expect(seccond).toBeDefined();

        expect.soft(initial?.sortOrder).toBe(0);
        expect.soft(seccond?.sortOrder).toBe(1);
    });

});
test('validate moveDown', async ({ page, materialListComponent, staticData: { ids } }) => {
    await test.step('do action and validate ui', async () => {
        await materialListComponent.btn_material_moveDown(ids.materialIds[1]).click();

        const divList = page.locator('div[data-testid^="div_material_"]');
        await expect.soft(divList.nth(2)).toHaveAttribute('data-testid', `div_material_${ids.materialIds[1]}`);
    });
    await test.step('validate db', async () => {
        const [initial, seccond] = await prisma.$transaction([
            prisma.material.findUnique({
                where: { id: ids.materialIds[1] }
            }),
            prisma.material.findUnique({
                where: { id: ids.materialIds[2] }
            }),
        ]);
        expect(initial).toBeDefined();
        expect(seccond).toBeDefined();

        expect.soft(initial?.sortOrder).toBe(2);
        expect.soft(seccond?.sortOrder).toBe(1);
    });
});
test('validate create', async ({ materialListComponent, editMaterialPopup, staticData: { ids } }) => {
    await test.step('create', async () => {
        await materialListComponent.btn_create.click();

        await expect(editMaterialPopup.div_popup).toBeVisible();
        await expect(editMaterialPopup.div_header).toHaveText(german.admin.material.header.createMaterial.replace('{group}', 'Gruppe1'));

        await editMaterialPopup.txt_name.fill('newType');
        await editMaterialPopup.txt_actualQuantity.fill('99');
        await editMaterialPopup.txt_targetQuantity.fill('98');

        await editMaterialPopup.btn_save.click();
        await expect(editMaterialPopup.div_popup).toBeHidden();
    });
    const dbMaterial = await prisma.material.findFirst({
        where: {
            fk_materialGroup: ids.materialGroupIds[0],
            typename: "newType",
        },
    });
    await test.step('validate db', async () => {
        expect(dbMaterial).not.toBeNull();
        expect(dbMaterial).toStrictEqual(expect.objectContaining({
            typename: "newType",
            sortOrder: 4,
            actualQuantity: 99,
            targetQuantity: 98,
            recdelete: null,
            recdeleteUser: null,
        }));
    });
    await test.step('validate ui', async () => {
        const id = dbMaterial!.id
        await expect(materialListComponent.div_material(id)).toBeVisible();
        await expect(materialListComponent.div_material_actualQuantity(id)).toHaveText('99');
        await expect(materialListComponent.div_material_targetQuantity(id)).toHaveText('98');
        await expect(materialListComponent.div_material_issuedQuantity(id)).toHaveText('0');
    });
});
test('validate edit', async ({ materialListComponent, editMaterialPopup, staticData: { data } }) => {
    const material = data.materialTypes[0];

    await test.step('open and validate modal', async () => {
        await materialListComponent.btn_material_edit(material.id).click();

        await expect(editMaterialPopup.div_popup).toBeVisible();
        await Promise.all([
            expect.soft(editMaterialPopup.div_header).toContainText('Gruppe1'),
            expect.soft(editMaterialPopup.div_header).toContainText('Typ1-1'),
            expect.soft(editMaterialPopup.txt_name).toHaveValue(material.typename),
            expect.soft(editMaterialPopup.txt_actualQuantity).toHaveValue(String(material.actualQuantity)),
            expect.soft(editMaterialPopup.txt_targetQuantity).toHaveValue(String(material.targetQuantity)),
        ]);
    });
    await test.step('change data', async () => {
        await editMaterialPopup.txt_name.fill('newName');
        await editMaterialPopup.txt_actualQuantity.fill('99');
        await editMaterialPopup.txt_targetQuantity.fill('98');
        await editMaterialPopup.btn_save.click();
        await editMaterialPopup.div_popup.isHidden();
    });

    await test.step('validate change', async () => {
        await Promise.all([
            expect.soft(materialListComponent.div_material_name(material.id)).toHaveText('newName'),
            expect.soft(materialListComponent.div_material_actualQuantity(material.id)).toHaveText('99'),
            expect.soft(materialListComponent.div_material_targetQuantity(material.id)).toHaveText('98'),
        ]);
    });
    await test.step('validate dbChange', async () => {
        const dbMaterial = await prisma.material.findUniqueOrThrow({ where: { id: material.id } });
        expect.soft(dbMaterial.typename).toBe('newName');
        expect.soft(dbMaterial.actualQuantity).toBe(99);
        expect.soft(dbMaterial.targetQuantity).toBe(98);
    });
});


test('validate delete', async ({ page, materialListComponent, staticData: { data, ids } }) => {
    const material = data.materialTypes[0];
    const groupName = "Gruppe1";
    const dangerModal = new DangerConfirmationModal(page);
    const translation = german.admin.material.delete.material;

    await test.step('validate modal', async () => {
        await materialListComponent.btn_material_delete(material.id).click();
        await expect(dangerModal.div_popup).toBeVisible();
        await expect
            .soft(dangerModal.div_header)
            .toHaveText(translation.header
                .replace("{group}", groupName)
                .replace("{type}", material.typename)
            );
        await expect
            .soft(dangerModal.div_confirmationText)
            .toContainText(translation.confirmationText
                .replace("{group}", groupName)
                .replace("{type}", material.typename)
            );
    });

    await test.step('delete and validate', async () => {
        await dangerModal.txt_confirmation.fill(translation.confirmationText
            .replace("{group}", groupName)
            .replace("{type}", material.typename));
        await dangerModal.btn_save.click();

        await expect(materialListComponent.div_material(material.id)).toBeHidden();
    });
    const [dbIssued, dbMaterial] = await prisma.$transaction([
        prisma.materialIssued.findFirst({
            where: {
                fk_cadet: ids.cadetIds[0],
                fk_material: material.id,
            }
        }),
        prisma.material.findUnique({
            where: { id: material.id }
        }),
    ]);
    await test.step('validate DB: material returned', async () => {
        expect(dbIssued).not.toBeNull();
        expect(dbIssued?.dateReturned).not.toBeNull();
    });

    await test.step('validate DB: material deleted', async () => {
        expect(dbMaterial).not.toBeNull();
        expect(dbMaterial!.recdelete).not.toBeNull();
        expect(dbMaterial!.recdeleteUser).toEqual('test4');
    });

});
test.describe('validate formValidation', () => {
    test.beforeEach(async ({ materialListComponent, staticData: { ids } }) => {
        await materialListComponent.btn_material_edit(ids.materialIds[0]).click();
    });
    test('name', async ({ page, editMaterialPopup }) => {
        const tests: ValidationTestType[] = newDescriptionValidationTests({
            minLength: 1,
            maxLength: 20
        });
        for (const testSet of tests) {
            await test.step(String(testSet.testValue), async () => {
                await editMaterialPopup.txt_name.fill(String(testSet.testValue));
                await page.keyboard.press('Tab');
                if (testSet.valid) {
                    await expect.soft(editMaterialPopup.err_name).toBeHidden();
                } else {
                    await expect.soft(editMaterialPopup.err_name).toBeVisible();
                }
            });
        }
        await test.step('Name duplication', async () => {
            await editMaterialPopup.txt_name.fill('Typ1-2');
            await expect(editMaterialPopup.err_name).toBeHidden();
            await editMaterialPopup.btn_save.click();
            await expect(editMaterialPopup.div_popup).toBeVisible();
            await expect(editMaterialPopup.err_name).toBeVisible();

            await editMaterialPopup.txt_name.fill('Typ1-1');
            await editMaterialPopup.btn_save.click();
            await expect(editMaterialPopup.div_popup).toBeHidden();
        });
    });
    test('actualQuantity', async ({ page, editMaterialPopup }) => {
        const tests = numberValidationTests({
            min: 0,
        });
        for (const testSet of tests) {
            await test.step(String(testSet.testValue), async () => {
                await editMaterialPopup.txt_actualQuantity.fill(String(testSet.testValue));
                await page.keyboard.press('Tab');

                if (testSet.valid) {
                    await expect.soft(editMaterialPopup.err_actualQuantity).toBeHidden();
                } else {
                    await expect.soft(editMaterialPopup.err_actualQuantity).toBeVisible();
                }
            });
        }
    });
    test('targetQuantity', async ({ page, editMaterialPopup }) => {
        const tests = numberValidationTests({
            min: 0,
        });
        for (const testSet of tests) {
            await test.step(String(testSet.testValue), async () => {
                await editMaterialPopup.txt_targetQuantity.fill(String(testSet.testValue));
                await page.keyboard.press('Tab');

                if (testSet.valid) {
                    await expect.soft(editMaterialPopup.err_targetQuantity).toBeHidden();
                } else {
                    await expect.soft(editMaterialPopup.err_targetQuantity).toBeVisible();
                }
            });
        }
    });
});
