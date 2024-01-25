import { Page, expect, test } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { CadetUniformComponent } from "../../../pages/cadet/cadetUniform.component";
import { MessagePopupComponent } from "../../../pages/popups/MessagePopup.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import t from "../../../../public/locales/de";

test.use({ storageState: adminAuthFile });
test.describe('', () => {
    const cadetId = '0d06427b-3c12-11ee-8084-0068eb8ba754'; // Marie Ackerman
    const uniformId = '45f35815-3c0d-11ee-8084-0068eb8ba754'; // 1184
    let page: Page;
    let uniformComponent: CadetUniformComponent;
    let messagePopupComponent: MessagePopupComponent;

    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();
        uniformComponent = new CadetUniformComponent(page);
        messagePopupComponent = new MessagePopupComponent(page);
    });
    test.afterAll(async () => page.close());
    test.beforeEach(async () => {
        await cleanupData();
        if (page.url().endsWith(cadetId)) {
            await page.reload();
        } else {
            await page.goto(`/de/app/cadet/${cadetId}`);
        }
    });

    test('validate Popup and close popup', async () => {
        await test.step('open modal', async () => {
            await uniformComponent.btn_uitem_withdraw(uniformId).click();
            await expect(messagePopupComponent.div_popup).toBeVisible();
        });

        await test.step('open modal', async () => {
            await page.pause();
            await Promise.all([
                expect.soft(messagePopupComponent.div_header).toHaveText(t.modals.messageModal.uniform.return.header),
                expect.soft(messagePopupComponent.div_message).toBeVisible(),
                expect.soft(messagePopupComponent.div_icon.locator('svg[data-icon="triangle-exclamation"]')).toBeVisible(),
                expect.soft(messagePopupComponent.btn_cancel).toBeVisible(),
                expect.soft(messagePopupComponent.btn_save).toBeVisible(),
                expect.soft(messagePopupComponent.btn_close).toBeVisible(),
            ]);
        });
        await test.step('close modal', async () => {
            await messagePopupComponent.btn_close.click();
            await expect(messagePopupComponent.div_popup).not.toBeVisible();
            await expect.soft(uniformComponent.div_uitem(uniformId)).toBeVisible();
        });
    });
    test('abbort action', async () => {
        await test.step('open modal', async () => {
            await uniformComponent.btn_uitem_withdraw(uniformId).click();
            await expect(messagePopupComponent.div_popup).toBeVisible();
        });
        await test.step('abort and close modal', async () => {
            await messagePopupComponent.btn_cancel.click();
            await expect(messagePopupComponent.div_popup).not.toBeVisible();
            await expect.soft(uniformComponent.div_uitem(uniformId)).toBeVisible();
        });
    });
    test('save action', async () => {
        await test.step('open modal', async () => {
            await uniformComponent.btn_uitem_withdraw(uniformId).click();
            await expect(messagePopupComponent.div_popup).toBeVisible();
        });
        await test.step('save and close modal', async () => {
            await messagePopupComponent.btn_save.click();
            await expect(messagePopupComponent.div_popup).not.toBeVisible();
            await expect.soft(uniformComponent.div_uitem(uniformId)).not.toBeVisible();
        });
    });

    test('validate mobile buttons', async () => {
        await page.setViewportSize({ width: 300, height: 800 });

        await test.step('open modal', async () => {
            await uniformComponent.btn_uitem_menu(uniformId).click();
            await uniformComponent.btn_uitem_menu_withdraw(uniformId).click();
            await expect(messagePopupComponent.div_popup).toBeVisible();
        });
        await test.step('save and close modal', async () => {
            await messagePopupComponent.btn_save.click();
            await expect(messagePopupComponent.div_popup).not.toBeVisible();
            await expect.soft(uniformComponent.div_uitem(uniformId)).not.toBeVisible();
        });
    });
});
