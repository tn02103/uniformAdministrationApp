import test, { Page, expect } from "playwright/test";
import { adminAuthFile, inspectorAuthFile, materialAuthFile } from "../../../auth.setup";
import { TypeListComponent } from "../../../pages/admin/uniform/typeList.component";
import { DangerConfirmationModal } from "../../../pages/popups/DangerConfirmationPopup.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { testAssosiation, testUniformTypes } from "../../../testData/staticData";
import t from "@/../public/locales/de";
import { TypeDetailComponent } from "../../../pages/admin/uniform/typeDetail.component";
import { prisma } from "@/lib/db";


test.use({ storageState: adminAuthFile });
test.describe('', () => {
    let page: Page;
    let typeListComponent: TypeListComponent;
    let typeDetailComponent: TypeDetailComponent;
    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();
        typeListComponent = new TypeListComponent(page);
        typeDetailComponent = new TypeDetailComponent(page);

        await page.goto('/de/app/admin/uniform');
    });
    test.beforeEach(async () => {
        await cleanupData();
        await page.reload();
    });
    test.afterAll(() => page.close());

    test('validate right order', async () => {
        const types = testUniformTypes
            .filter(type => ((type.fk_assosiation === testAssosiation.id) && (!type.recdelete)))
            .sort((a, b) => a.sortOrder - b.sortOrder);

        const divList = await page.locator('div[data-testid^="div_typeList_row_"]').all();

        await expect(divList.length).toBe(types.length);
        for (let i = 0; i < divList.length; i++) {
            await expect.soft(await divList[i]).toHaveAttribute('data-testid', `div_typeList_row_${types[i].id}`);
            await expect.soft(typeListComponent.div_typename(types[i].id)).toHaveText(types[i].name);
        }
    });

    test('validate create', async () => {
        const name = 'Typ5'

        await typeListComponent.btn_create.click();
        await expect(typeListComponent.page.locator('div[data-testid^="div_typeList_row_"]').getByText(name)).toBeVisible();
        await expect(typeDetailComponent.div_header).toHaveText(name);

        const dbData = await prisma.uniformType.findFirst({
            where: {
                name: name,
                fk_assosiation: testAssosiation.id,
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

    test('validate moveUp', async () => {
        await test.step('do action and validate ui', async () => {
            await typeListComponent.btn_moveUp('0b95e809-3b83-11ee-ab4b-0068eb8ba754').click();

            const divList = await page.locator('div[data-testid^="div_typeList_row_"]').all();
            await expect.soft(divList[0]).toHaveAttribute('data-testid', 'div_typeList_row_0b95e809-3b83-11ee-ab4b-0068eb8ba754');
        });
        await test.step('validate db ', async () => {
            const [initial, seccond] = await prisma.$transaction([
                prisma.uniformType.findUnique({
                    where: { id: '0b95e809-3b83-11ee-ab4b-0068eb8ba754' }
                }),
                prisma.uniformType.findUnique({
                    where: { id: '036ff236-3b83-11ee-ab4b-0068eb8ba754' }
                }),
            ]);

            expect.soft(initial?.sortOrder).toBe(0);
            expect.soft(seccond?.sortOrder).toBe(1);
        });
    });
    test('validate moveDown', async () => {
        await test.step('do action and validate ui', async () => {
            await typeListComponent.btn_moveDown('0b95e809-3b83-11ee-ab4b-0068eb8ba754').click();

            const divList = await page.locator('div[data-testid^="div_typeList_row_"]').all();
            await expect.soft(divList[2]).toHaveAttribute('data-testid', 'div_typeList_row_0b95e809-3b83-11ee-ab4b-0068eb8ba754');
        });
        await test.step('validate db ', async () => {
            const [initial, seccond] = await prisma.$transaction([
                prisma.uniformType.findUnique({
                    where: { id: '0b95e809-3b83-11ee-ab4b-0068eb8ba754' }
                }),
                prisma.uniformType.findUnique({
                    where: { id: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754' }
                }),
            ]);

            expect.soft(initial?.sortOrder).toBe(2);
            expect.soft(seccond?.sortOrder).toBe(1);
        });
    });
    test('validate delete', async () => {
        const type = { id: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', name: 'Typ2' }
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
    test.describe('validate AuthRoles', () => {
        test.describe('admin', async () => {
            test.use({ storageState: materialAuthFile });
            test('', async ({ page }) => {
                const typeListComponent = new TypeListComponent(page);
                await page.goto('/de/app/admin/uniform');
                await expect(typeListComponent.btn_create).toBeVisible();
            });
        });
        test.describe('material', async () => {
            test.use({ storageState: inspectorAuthFile });
            test('', async ({ page }) => {
                await page.goto('/de/app/admin/uniform');
                await expect(page.getByTestId('div_403Page')).toBeVisible();
            });
        });
    });
});
