import { Page, expect, test } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { cleanupData } from "../../../testData/cleanupStatic";
import { SizelistListComponent } from "../../../pages/admin/uniform/SizelistList.component";
import { testAssosiation, testSizelists, testSizes } from "../../../testData/staticData";
import { SimpleFormPopupComponent } from "../../../pages/popups/SimpleFormPopup.component";
import { SizelistDetailComponent } from "../../../pages/admin/uniform/SizelistDetail.component";
import { newDescriptionValidationTests } from "../../../global/testSets";
import { MessagePopupComponent } from "../../../pages/popups/MessagePopup.component";
import t from "@/../public/locales/de";

const lists = testSizelists.filter(sl => (sl.fk_assosiation === testAssosiation.id));
const sizeList = lists.find(sl => sl.id === '23a700ff-3b83-11ee-ab4b-0068eb8ba754');
const listSizeIds = [
    "585509de-3b83-11ee-ab4b-0068eb8ba754",
    "3656714b-3b83-11ee-ab4b-0068eb8ba754",
    "37665288-3b83-11ee-ab4b-0068eb8ba754",
    "38823b5b-3b83-11ee-ab4b-0068eb8ba754",
    "39939996-3b83-11ee-ab4b-0068eb8ba754",
    "3b93f87a-3b83-11ee-ab4b-0068eb8ba754"
];
test.use({ storageState: adminAuthFile });
test.describe.skip('', () => {
    let page: Page;
    let listComponent: SizelistListComponent;
    let detailComponent: SizelistDetailComponent;
    let editListPopup: SimpleFormPopupComponent;

    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();
        listComponent = new SizelistListComponent(page);
        detailComponent = new SizelistDetailComponent(page);
        editListPopup = new SimpleFormPopupComponent(page, 'input[name="input"]', 'err_input')

        await page.goto('/de/app/admin/uniform');
    });
    test.beforeEach(async () => {
        await cleanupData();
        await page.reload();
    });
    test.afterAll(() => page.close());

    test('validate lists data', async () => {
        const divList = await page.locator('div[data-testid^="div_sizelist_list_"]').all();
        expect(divList.length).toBe(lists.length);

        for (let i = 0; i < divList.length; i++) {
            await expect.soft(divList[i]).toHaveAttribute("data-testid", `div_sizelist_list_${lists[i].id}`);
            await expect
                .soft(listComponent.div_sizeList_name(lists[i].id))
                .toHaveText(lists[i].name);
        }
    });
    test('validate create sizeList', async () => {
        await listComponent.btn_create.click();

        await expect.soft(editListPopup.div_header).toHaveText(t.admin.uniform.sizeList.createModal.header); // Input correct translation germamModal.formModalHeaders.createSizeList);
        await editListPopup.txt_input.fill('newList');
        await editListPopup.btn_save.click();

        const divList = await page.$$('div[data-testid^="div_sizelist_list_"]');
        await expect(divList.length).toBe(lists.length + 1);
    });

    test('validate data of list', async () => {
        await listComponent.btn_sizeList_select(sizeList!.id).click();

        await expect(detailComponent.div_card).toBeVisible();
        await expect.soft(detailComponent.div_header).toHaveText(sizeList!.name);
        const divList = await page.$$('div[data-testid^="div_selectedSize_"]');
        await expect(divList.length).toBe(listSizeIds.length);

        for (let i = 0; i < listSizeIds.length; i++) {
            await expect(detailComponent.div_selectedSize(listSizeIds[i])).toBeVisible();
        }
    });
    test('validate namePopup formVaidation', async () => {
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
    test('validate edit', async () => {
        await test.step('open editable mode', async () => {
            await listComponent.btn_sizeList_select(sizeList!.id).click();
            await detailComponent.btn_menu.click();
            await detailComponent.btn_menu_edit.click();
        });

        await test.step('check data', async () => {
            await Promise.all(listSizeIds.map(async (id) => {
                await expect(detailComponent.btn_selectedSize(id)).toBeVisible();
                await expect(detailComponent.btn_backupSize(id)).not.toBeVisible();
            }));
            await Promise.all(testSizes
                .filter(size => (!listSizeIds.includes(size.id) && size.fk_assosiation === testAssosiation.id))
                .map(async (size) => {
                    await expect(detailComponent.btn_selectedSize(size.id)).not.toBeVisible();
                    await expect(detailComponent.btn_backupSize(size.id)).toBeVisible();
                })
            );
        });

        await test.step('validate changed data', async () => {
            await detailComponent.btn_selectedSize('585509de-3b83-11ee-ab4b-0068eb8ba754').click();
            await detailComponent.btn_backupSize('65942979-3b83-11ee-ab4b-0068eb8ba754').click();

            await Promise.all([
                expect.soft(detailComponent.btn_selectedSize('585509de-3b83-11ee-ab4b-0068eb8ba754')).not.toBeVisible(),
                expect.soft(detailComponent.btn_backupSize('585509de-3b83-11ee-ab4b-0068eb8ba754')).toBeVisible(),
                expect.soft(detailComponent.btn_selectedSize('65942979-3b83-11ee-ab4b-0068eb8ba754')).toBeVisible(),
                expect.soft(detailComponent.btn_backupSize('65942979-3b83-11ee-ab4b-0068eb8ba754')).not.toBeVisible(),
            ]);
        });
        await test.step('validate save', async () => {
            await detailComponent.btn_save.click();
            await expect.soft(detailComponent.div_selectedSize('585509de-3b83-11ee-ab4b-0068eb8ba754')).not.toBeVisible();
            await expect.soft(detailComponent.div_selectedSize('65942979-3b83-11ee-ab4b-0068eb8ba754')).toBeVisible();
        });
    });
    test('validate rename', async () => {
        await listComponent.btn_sizeList_select(sizeList!.id).click();
        await detailComponent.btn_menu.click();
        await detailComponent.btn_menu_rename.click();

        await editListPopup.txt_input.fill('newListName');
        await editListPopup.btn_save.click();

        expect(listComponent.div_sizeList_name(sizeList!.id)).toHaveText('newListName');
        expect(detailComponent.div_header).toHaveText('newListName');
    });
    test('validate delete inUseError', async () => {
        const messageModal = new MessagePopupComponent(page);
        const inUseError = t.admin.uniform.sizeList.inUseError;
        await listComponent.btn_sizeList_select(sizeList!.id).click();
        await detailComponent.btn_menu.click();
        await detailComponent.btn_menu_delete.click();

        await expect.soft(messageModal.div_header).toHaveAttribute("class", /bg-danger/);
        await expect.soft(messageModal.div_header).toHaveText(inUseError.header);
        await expect.soft(messageModal.div_message).toHaveText(inUseError.message);
        await expect.soft(messageModal.btn_cancel).not.toBeVisible();
        await messageModal.btn_save.click();

        await expect.soft(listComponent.div_sizeList(sizeList!.id)).toBeVisible();
    });
    test('validate delete warning', async () => {
        const messageModal = new MessagePopupComponent(page);
        const deleteWarning = t.admin.uniform.sizeList.deleteWarning
        await listComponent.btn_sizeList_select('34097829-3b83-11ee-ab4b-0068eb8ba754').click();
        await detailComponent.btn_menu.click();
        await detailComponent.btn_menu_delete.click();

        await expect.soft(messageModal.div_header).toHaveAttribute("class", /bg-warning/);
        await expect.soft(messageModal.div_header).toHaveText(deleteWarning.header.replace('{{sizeList}}', 'Liste4'));
        await expect.soft(messageModal.div_message).toContainText(deleteWarning.message);
        await messageModal.btn_save.click();

        await expect.soft(listComponent.div_sizeList('34097829-3b83-11ee-ab4b-0068eb8ba754')).not.toBeVisible();
    });
});
