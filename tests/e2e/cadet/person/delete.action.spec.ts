import { Page, expect, test } from "playwright/test";
import { adminAuthFile, inspectorAuthFile, materialAuthFile } from "../../../auth.setup";
import { CadetDetailPage } from "../../../pages/cadet/cadetDetail.page";
import { CadetListPage } from "../../../pages/cadet/cadetList.page";
import { MessagePopupComponent } from "../../../pages/popups/MessagePopup.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import t from "../../../../public/locales/de";

test.use({ storageState: adminAuthFile });
test.describe('', () => {
    const cadetId = "0d06427b-3c12-11ee-8084-0068eb8ba754" // Marie Ackerman
    let page: Page;
    let cadetDetailPage: CadetDetailPage;
    let popupComponent: MessagePopupComponent;
    let listPage: CadetListPage;

    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();
        cadetDetailPage = new CadetDetailPage(page);
        popupComponent = new MessagePopupComponent(page);
        listPage = new CadetListPage(page)

        await page.goto(`/de/app/cadet/${cadetId}`);
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

    //E2E0205
    test.describe('validate authRoles', async () => {
        test.describe('', async () => {
            test.use({ storageState: materialAuthFile });
            test('materialManager', async ({ page }) => {
                const cadetDetailPage = new CadetDetailPage(page);
                await page.goto(`/de/app/cadet/${cadetId}`);
                await expect.soft(cadetDetailPage.btn_menu).toBeVisible();
            });
        });
        test.describe('', async () => {
            test.use({ storageState: inspectorAuthFile });
            test('inspector', async ({ page }) => {
                const cadetDetailPage = new CadetDetailPage(page);
                await page.goto(`/de/app/cadet/${cadetId}`);

                await expect.soft(cadetDetailPage.btn_menu).not.toBeVisible();
            });
        });
    });

    test('validate delete popup', async () => {
        await test.step('open popup', async () => {
            await cadetDetailPage.btn_menu.click();
            await expect(cadetDetailPage.btn_menu_delete).toBeVisible();

            await cadetDetailPage.btn_menu_delete.click();
            await expect(popupComponent.div_popup).toBeVisible();
        });

        await test.step('validate popup', async () => {
            await Promise.all([
                expect.soft(popupComponent.div_header).toHaveText(t.cadetDetailPage.delete.header),
                expect.soft(popupComponent.div_message).toContainText(/Marie Ackerman/),
                expect.soft(popupComponent.div_header).toHaveAttribute("class", /bg-warning/),
                expect.soft(popupComponent.div_icon.locator('svg[data-icon="triangle-exclamation"]')).toBeVisible(),
                expect.soft(popupComponent.btn_save).toHaveText(t.common.actions.delete),
            ]);
        });

        await test.step('close popup', async () => {
            await popupComponent.btn_close.click();
            await expect.soft(popupComponent.div_popup).not.toBeVisible();
            await expect(page.url()).toContain(`/cadet/${cadetId}`);
        });
    });

    //E2E0206
    test('validate save function', async () => {
        await test.step('open popup and save', async () => {
            await cadetDetailPage.btn_menu.click();
            await expect(cadetDetailPage.btn_menu_delete).toBeVisible();
            await cadetDetailPage.btn_menu_delete.click();
            await expect(popupComponent.div_popup).toBeVisible();
            await popupComponent.btn_save.click();
        });

        await test.step('validate result', async () => {
            await expect.soft(popupComponent.div_popup).not.toBeVisible();
            await page.waitForURL(/app\/cadet/)
            await expect.soft(listPage.div_cadet(cadetId)).not.toBeVisible();
        });
    });
});
