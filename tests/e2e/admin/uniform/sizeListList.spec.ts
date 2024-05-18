import t from "@/../public/locales/de";
import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";
import { UniformSizelist } from "@prisma/client";
import { expect } from "playwright/test";
import { adminTest } from "../../../auth.setup";
import { newDescriptionValidationTests } from "../../../global/testSets";
import { SizelistDetailComponent } from "../../../pages/admin/uniform/SizelistDetail.component";
import { SizelistListComponent } from "../../../pages/admin/uniform/SizelistList.component";
import { MessagePopupComponent } from "../../../pages/popups/MessagePopup.component";
import { SimpleFormPopupComponent } from "../../../pages/popups/SimpleFormPopup.component";
import { cleanupUniformSizeConfiguration } from "../../../testData/cleanupStatic";

type Fixture = {
    sizelists: UniformSizelist[];
    sizelist: UniformSizelist;
    sizeIdArray: string[];
    listComponent: SizelistListComponent;
    detailComponent: SizelistDetailComponent;
    editListPopup: SimpleFormPopupComponent;
}
const test = adminTest.extend<Fixture>({
    sizelists: async ({ staticData }, use) => {
        use(await staticData.getUniformSizelists());
    },
    sizelist: async ({ staticData }, use) => {
        use(await staticData.getUniformSizelist('Liste1') as UniformSizelist);
    },
    sizeIdArray: async ({ staticData }, use) => {
        use(staticData.ids.sizeIds.slice(0, 6));
    },
    listComponent: async ({ page }, use) => {
        use(new SizelistListComponent(page));
    },
    detailComponent: async ({ page }, use) => {
        use(new SizelistDetailComponent(page));
    },
    editListPopup: async ({ page }, use) => {
        use(new SimpleFormPopupComponent(page, 'input[name="input"]', 'err_input'));
    }
});
test.beforeEach(async ({ page }) => {
    await page.goto('/de/app/admin/uniform');
});
test.afterEach(async ({ staticData: { index } }) => {
    await cleanupUniformSizeConfiguration(index);
});

test('validate lists data', async ({ page, sizelists, listComponent }) => {
    const divList = await page.locator('div[data-testid^="div_sizelist_list_"]').all();
    expect(divList).toHaveLength(sizelists.length);

    for (let i = 0; i < divList.length; i++) {
        await expect.soft(divList[i]).toHaveAttribute("data-testid", `div_sizelist_list_${sizelists[i].id}`);
        await expect
            .soft(listComponent.div_sizeList_name(sizelists[i].id))
            .toHaveText(sizelists[i].name);
    }
});
test('validate create sizeList', async ({ page, listComponent, detailComponent, editListPopup, staticData }) => {
    const name = 'newListUnique';
    await test.step('create and validate ui', async () => {
        await listComponent.btn_create.click();

        await expect.soft(editListPopup.div_header).toHaveText(t.admin.uniform.sizeList.createModal.header);
        await editListPopup.txt_input.fill(name);
        await editListPopup.btn_save.click();

        await expect(page.locator('div[data-testid^="div_sizelist_list_"]').getByText(name)).toBeVisible();
        await expect(detailComponent.div_header).toHaveText(name);
    });
    await test.step('validate db', async () => {
        const list = await prisma.uniformSizelist.findFirst({
            where: {
                fk_assosiation: staticData.fk_assosiation,
                name
            },
            include: { uniformSizes: true }
        });

        expect(list).not.toBeNull();
        expect(list?.id).toMatch(uuidValidationPattern);
        expect(list?.uniformSizes).toStrictEqual([]);
    });
});

test('validate data of list', async ({ page, listComponent, detailComponent, sizelist, sizeIdArray }) => {
    await listComponent.btn_sizeList_select(sizelist!.id).click();

    await expect(detailComponent.div_card).toBeVisible();
    await expect.soft(detailComponent.div_header).toHaveText(sizelist!.name);
    await expect(page.locator('div[data-testid^="div_selectedSize_"]')).toHaveCount(sizeIdArray.length);

    for (let i = 0; i < sizeIdArray.length; i++) {
        await expect(detailComponent.div_selectedSize(sizeIdArray[i])).toBeVisible();
    }
});
test('validate namePopup formVaidation', async ({ page, listComponent, editListPopup }) => {
    const tests = newDescriptionValidationTests({
        minLength: 0,
        maxLength: 20,
    });
    for (const testSet of tests) {
        await test.step(testSet.testValue, async () => {
            await page.reload();
            await listComponent.btn_create.click();

            await editListPopup.txt_input.fill(String(testSet.testValue));
            await editListPopup.btn_save.click();

            if (testSet.valid) {
                await expect.soft(editListPopup.err_input).not.toBeVisible();
            } else {
                await expect.soft(editListPopup.err_input).toBeVisible();
            }
        })
    }
});

test('validate edit', async ({ listComponent, detailComponent, sizelist, sizeIdArray, staticData }) => {
    await test.step('open editable mode', async () => {
        await listComponent.btn_sizeList_select(sizelist!.id).click();
        await detailComponent.btn_menu.click();
        await detailComponent.btn_menu_edit.click();
    });

    await test.step('check data', async () => {
        await Promise.all(sizeIdArray.map(async (id) => {
            await expect(detailComponent.btn_selectedSize(id)).toBeVisible();
            await expect(detailComponent.btn_backupSize(id)).not.toBeVisible();
        }));
        await Promise.all((await staticData.getUniformSizes())
            .filter(size => (!sizeIdArray.includes(size.id)))
            .map(async (size) => {
                await expect(detailComponent.btn_selectedSize(size.id)).not.toBeVisible();
                await expect(detailComponent.btn_backupSize(size.id)).toBeVisible();
            })
        );
    });

    await test.step('validate changed data', async () => {
        await detailComponent.btn_selectedSize(staticData.ids.sizeIds[0]).click();
        await detailComponent.btn_backupSize(staticData.ids.sizeIds[16]).click();

        await Promise.all([
            expect.soft(detailComponent.btn_selectedSize(staticData.ids.sizeIds[0])).not.toBeVisible(),
            expect.soft(detailComponent.btn_backupSize(staticData.ids.sizeIds[0])).toBeVisible(),
            expect.soft(detailComponent.btn_selectedSize(staticData.ids.sizeIds[16])).toBeVisible(),
            expect.soft(detailComponent.btn_backupSize(staticData.ids.sizeIds[16])).not.toBeVisible(),
        ]);
    });
    await test.step('validate save', async () => {
        await detailComponent.btn_save.click();
        await expect.soft(detailComponent.div_selectedSize(staticData.ids.sizeIds[0])).not.toBeVisible();
        await expect.soft(detailComponent.div_selectedSize(staticData.ids.sizeIds[16])).toBeVisible();
    });
    await test.step('validate db', async () => {
        const data = await prisma.uniformSizelist.findUniqueOrThrow({
            where: { id: sizelist!.id },
            include: { uniformSizes: true }
        });

        expect(data.uniformSizes.map(s => s.id)).toEqual(expect.arrayContaining([staticData.ids.sizeIds[16]]));
        expect(data.uniformSizes.map(s => s.id)).not.toEqual(expect.arrayContaining([staticData.ids.sizeIds[0]]));
    });
});
test('validate rename', async ({ page, listComponent, detailComponent, editListPopup, sizelist }) => {
    await test.step('rename', async () => {

        await listComponent.btn_sizeList_select(sizelist.id).click();
        await detailComponent.btn_menu.click();
        await detailComponent.btn_menu_rename.click();

        await editListPopup.txt_input.fill('newListName');
        await editListPopup.btn_save.click();
    });

    await test.step('validate', async () => {
        await expect(page.locator('div[data-testid^="div_sizelist_list_"]').getByText('newListName')).toBeVisible();
        await expect(listComponent.div_sizeList_name(sizelist.id)).toHaveText('newListName');
        await expect(detailComponent.div_header).toHaveText('newListName');

        const data = await prisma.uniformSizelist.findUniqueOrThrow({
            where: { id: sizelist.id }
        });

        expect(data.name).toEqual('newListName');
    });
});
test('validate delete inUseError', async ({ page, listComponent, detailComponent, sizelist }) => {
    const messageModal = new MessagePopupComponent(page);
    const inUseError = t.admin.uniform.sizeList.deleteFailure;
    const message = inUseError.message.replace('{entity}', 'Uniformtyp').replace('{name}', 'Typ1')

    await listComponent.btn_sizeList_select(sizelist!.id).click();
    await detailComponent.btn_menu.click();
    await detailComponent.btn_menu_delete.click();
    await messageModal.btn_save.click();

    await expect.soft(messageModal.div_header).toHaveAttribute("class", /bg-danger/);
    await expect.soft(messageModal.div_header).toHaveText(inUseError.header);
    await expect.soft(messageModal.div_message).toHaveText(message);
    await expect.soft(messageModal.btn_cancel).not.toBeVisible();
    await messageModal.btn_save.click();

    await expect.soft(listComponent.div_sizeList(sizelist!.id)).toBeVisible();
});
test('validate delete warning', async ({ page, listComponent, detailComponent, staticData }) => {
    const messageModal = new MessagePopupComponent(page);
    const deleteWarning = t.admin.uniform.sizeList.deleteWarning
    await listComponent.btn_sizeList_select(staticData.ids.sizelistIds[3]).click();
    await detailComponent.btn_menu.click();
    await detailComponent.btn_menu_delete.click();

    await expect.soft(messageModal.div_header).toHaveAttribute("class", /bg-warning/);
    await expect.soft(messageModal.div_header).toHaveText(deleteWarning.header.replace('{name}', 'Liste4'));
    await expect.soft(messageModal.div_message).toContainText(deleteWarning.message.line1);
    await expect.soft(messageModal.div_message).toContainText(deleteWarning.message.line2);
    await messageModal.btn_save.click();

    await expect.soft(listComponent.div_sizeList(staticData.ids.sizelistIds[3])).not.toBeVisible();
    const data = await prisma.uniformSizelist.findUnique({ where: { id: staticData.ids.sizelistIds[3] } });
    expect(data).toBeNull();
});
