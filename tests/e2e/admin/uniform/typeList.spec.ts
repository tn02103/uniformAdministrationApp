import t from "@/../public/locales/de";
import { prisma } from "@/lib/db";
import { UniformType } from "@prisma/client";
import { expect } from "playwright/test";
import { adminTest, inspectorTest, managerTest } from "../../../auth.setup";
import { TypeDetailComponent } from "../../../pages/admin/uniform/typeDetail.component";
import { TypeListComponent } from "../../../pages/admin/uniform/typeList.component";
import { DangerConfirmationModal } from "../../../pages/popups/DangerConfirmationPopup.component";
import { cleanupUniformTypeConfiguration } from "../../../testData/cleanupStatic";

type Fixture = {
    types: UniformType[];
    typeListComponent: TypeListComponent;
    typeDetailComponent: TypeDetailComponent;
}

const test = adminTest.extend<Fixture>({
    types: async ({staticData}, use) => {
        use(await staticData.getUniformTypeList().then(l => l.filter(t => t.recdelete === null)));
    },
    typeListComponent: async ({page}, use) => use(new TypeListComponent(page)),
    typeDetailComponent: async ({page}, use) => use(new TypeDetailComponent(page)),
});
test.beforeEach(async({page}) => {
    await page.goto('/de/app/admin/uniform');
})
test.afterEach(async ({staticData:{index}}) => {
    await cleanupUniformTypeConfiguration(index);
});
test('validate right order', async ({page, typeListComponent, types}) => {
    const divList = await page.locator('div[data-testid^="div_typeList_row_"]').all();

    await expect(divList).toHaveLength(types.length);
    for (let i = 0; i < divList.length; i++) {
        await expect.soft(await divList[i]).toHaveAttribute('data-testid', `div_typeList_row_${types[i].id}`);
        await expect.soft(typeListComponent.div_typename(types[i].id)).toHaveText(types[i].name);
    }
});
test('validate create', async ({typeListComponent, typeDetailComponent, staticData}) => {
    const name = 'Typ5'

    await typeListComponent.btn_create.click();
    await expect(typeListComponent.page.locator('div[data-testid^="div_typeList_row_"]').getByText(name)).toBeVisible();
    await expect(typeDetailComponent.div_header).toHaveText(name);

    const dbData = await prisma.uniformType.findFirst({
        where: {
            name: name,
            fk_assosiation: staticData.fk_assosiation,
            recdelete: null,
            recdeleteUser: null,
        }
    });

    expect(dbData?.sortOrder).not.toBeNull();
    expect(dbData).toEqual(expect.objectContaining({
        acronym: 'AE',
        issuedDefault: 1,
        usingGenerations: false,
        usingSizes: false,
        fk_defaultSizeList: null,
        sortOrder: 4,
    }));
});
test('validate moveUp', async ({page, typeListComponent, staticData: {ids}}) => {
    await test.step('do action and validate ui', async () => {
        await typeListComponent.btn_moveUp(ids.uniformTypeIds[1]).click();

        const divList = await page.locator('div[data-testid^="div_typeList_row_"]').all();
        await expect.soft(divList[0]).toHaveAttribute('data-testid', `div_typeList_row_${ids.uniformTypeIds[1]}`);
    });
    await test.step('validate db ', async () => {
        const [initial, seccond] = await prisma.$transaction([
            prisma.uniformType.findUnique({
                where: { id: ids.uniformTypeIds[1] }
            }),
            prisma.uniformType.findUnique({
                where: { id: ids.uniformTypeIds[0] }
            }),
        ]);

        expect.soft(initial?.sortOrder).toBe(0);
        expect.soft(seccond?.sortOrder).toBe(1);
    });
});
test('validate moveDown', async ({page, typeListComponent, staticData: {ids}}) => {
    await test.step('do action and validate ui', async () => {
        await typeListComponent.btn_moveDown(ids.uniformTypeIds[1]).click();

        const divList = await page.locator('div[data-testid^="div_typeList_row_"]').all();
        await expect.soft(divList[2]).toHaveAttribute('data-testid', `div_typeList_row_${ids.uniformTypeIds[1]}`);
    });
    await test.step('validate db ', async () => {
        const [initial, seccond] = await prisma.$transaction([
            prisma.uniformType.findUnique({
                where: { id: ids.uniformTypeIds[1] }
            }),
            prisma.uniformType.findUnique({
                where: { id: ids.uniformTypeIds[2] }
            }),
        ]);

        expect.soft(initial?.sortOrder).toBe(2);
        expect.soft(seccond?.sortOrder).toBe(1);
    });
});


test('validate delete', async ({page, typeListComponent, staticData}) => {
    const type = await staticData.getUniformType('AB');
    if (!type) throw new Error("Could not find type");
    const dangerModal = new DangerConfirmationModal(page);
    const translation = t.admin.uniform.type.deleteModal;

    await test.step('open modal', async () => {
        await expect.soft(typeListComponent.btn_delete(type.id)).not.toBeVisible();
        await typeListComponent.btn_open(type.id).click();
        await expect.soft(typeListComponent.btn_delete(type.id)).toBeVisible();
        await typeListComponent.btn_delete(type.id).click();
    });

    await test.step('validate modal', async () => {
        await expect(dangerModal.div_popup)
            .toBeVisible();
        await expect
            .soft(dangerModal.div_header)
            .toHaveText(translation.header.replace('{type}', type.name));
        await expect
            .soft(dangerModal.div_confirmationText)
            .toContainText(translation.confirmationText.replace('{type}', type.name));
    });

    await test.step('delete and validate', async () => {
        await dangerModal.txt_confirmation.fill(translation.confirmationText.replace('{type}', type.name));
        await dangerModal.btn_save.click();

        await expect(typeListComponent.div_type(type.id)).not.toBeVisible();
    });
});

managerTest('validate AuthRoles: manager', async ({ page }) => {
    const typeListComponent = new TypeListComponent(page);
    await page.goto('/de/app/admin/uniform');
    await expect(typeListComponent.btn_create).toBeVisible();
});

inspectorTest('validate AuthRoles: inspector', async ({ page }) => {
    await page.goto('/de/app/admin/uniform');
    await expect(page.getByTestId('div_403Page')).toBeVisible();
});
