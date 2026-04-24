import { prisma } from "@/lib/db";
import { CadetStatus } from "@/prisma/client";
import { expect } from "playwright/test";
import german from "../../../public/locales/de";
import { CadetDataComponent } from "../../_playwrightConfig/pages/cadet/cadetData.component";
import { CadetDetailPage } from "../../_playwrightConfig/pages/cadet/cadetDetail.page";
import { MessagePopupComponent } from "../../_playwrightConfig/pages/popups/MessagePopup.component";
import { ToastTestComponent } from "../../_playwrightConfig/pages/global/Toast.component";
import { adminTest, inspectorTest, userTest } from "../../_playwrightConfig/setup";

type Fixture = {
    cadetDetailPage: CadetDetailPage;
    dataComponent: CadetDataComponent;
    messagePopup: MessagePopupComponent;
    toast: ToastTestComponent;
};

const test = inspectorTest.extend<Fixture>({
    cadetDetailPage: async ({ page }, use) => use(new CadetDetailPage(page)),
    dataComponent: async ({ page }, use) => use(new CadetDataComponent(page)),
    messagePopup: async ({ page }, use) => use(new MessagePopupComponent(page)),
    toast: async ({ page }, use) => use(new ToastTestComponent(page)),
});

test.describe("Cadet Return Uniform", () => {

    test.afterEach(async ({ staticData }) => {
        await staticData.cleanup.cadet();
        // Reset returnProcessEnabled to false (default) after each test
        await prisma.assosiationConfiguration.update({
            where: { assosiationId: staticData.fk_assosiation },
            data: { returnProcessEnabled: false },
        });
    });

    // AC1: "Return Uniform" only visible when cadet status is ACTIVE and user is inspector
    test.describe("AC1: visibility based on cadet status and user role", () => {

        test("inspector sees return menu item for ACTIVE cadet", async ({ page, staticData, cadetDetailPage }) => {
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await expect(page.getByTestId("btn_cadet_menu_return")).toBeVisible();
            await expect(page.getByTestId("btn_cadet_menu_return")).toHaveText(german.cadetDetailPage.returnProcess.dropdownLabel);
        });

        test("inspector does NOT see return menu item for RETURNING cadet", async ({ page, staticData, cadetDetailPage }) => {
            const returningCadetId = staticData.ids.cadetIds[10];
            await page.goto(`/de/app/cadet/${returningCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await expect(page.getByTestId("btn_cadet_menu_return")).toBeHidden();
        });

        test("inspector does NOT see return menu item for RETURNED cadet", async ({ page, staticData, cadetDetailPage }) => {
            const returnedCadetId = staticData.ids.cadetIds[11];
            await page.goto(`/de/app/cadet/${returnedCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await expect(page.getByTestId("btn_cadet_menu_return")).toBeHidden();
        });

        userTest("user role cannot see cadet menu at all", async ({ page, staticData }) => {
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);
            await expect(page.getByTestId("btn_cadet_menu")).toBeHidden();
        });
    });

    // AC4: Without returnProcessEnabled/templates: confirmation dialog → cadet RETURNED
    test.describe("AC4: direct return path (returnProcessEnabled=false)", () => {

        test("shows confirmation modal and returns cadet directly", async ({
            page, staticData, cadetDetailPage, messagePopup, toast,
        }) => {
            // returnProcessEnabled is false by default
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await page.getByTestId("btn_cadet_menu_return").click();

            // Confirm the warning modal is shown
            await expect(messagePopup.div_popup).toBeVisible();
            await expect(messagePopup.div_header).toContainText(german.cadetDetailPage.returnProcess.directReturn.header);
            await expect(messagePopup.div_message).toContainText(staticData.data.cadets[0].firstname);
            await expect(messagePopup.div_message).toContainText(staticData.data.cadets[0].lastname);

            // Confirm the action
            await messagePopup.btn_save.click();

            // Page should refresh, cadet status updates
            await page.waitForLoadState("networkidle");

            // Verify cadet status in DB
            const cadet = await prisma.cadet.findUnique({ where: { id: activeCadetId } });
            expect(cadet?.status === CadetStatus.RETURNED || cadet?.status === CadetStatus.DELETED).toBeTruthy();
        });

        test("cancelling the confirmation modal does not change cadet status", async ({
            page, staticData, cadetDetailPage, messagePopup,
        }) => {
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await page.getByTestId("btn_cadet_menu_return").click();

            await expect(messagePopup.div_popup).toBeVisible();
            await messagePopup.btn_cancel.click();
            await expect(messagePopup.div_popup).toBeHidden();

            // Cadet should still be ACTIVE
            const cadet = await prisma.cadet.findUnique({ where: { id: activeCadetId } });
            expect(cadet?.status).toBe(CadetStatus.ACTIVE);
        });
    });

    // AC2: With returnProcessEnabled + templates: modal opens with checklist; template select only if >1
    // AC3: After "Start ReturnProcess": cadet status becomes RETURNING
    test.describe("AC2/AC3: return process path (returnProcessEnabled=true)", () => {

        test.beforeEach(async ({ staticData }) => {
            await prisma.assosiationConfiguration.update({
                where: { assosiationId: staticData.fk_assosiation },
                data: { returnProcessEnabled: true },
            });
        });

        test("AC2: opens return process modal with checklist items and template selector (>1 templates)", async ({
            page, staticData, cadetDetailPage,
        }) => {
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await page.getByTestId("btn_cadet_menu_return").click();

            // Modal header
            const modalLocator = page.locator(".modal");
            await expect(modalLocator).toBeVisible();
            await expect(modalLocator.locator(".modal-title")).toContainText(german.cadetDetailPage.returnProcess.modal.header);

            // Template select field is visible (>1 templates)
            await expect(modalLocator.locator("select")).toBeVisible();

            // Default template has 2 checklist items
            await expect(modalLocator.getByText(staticData.data.returnChecklistTemplates[0].label)).toBeVisible();
            await expect(modalLocator.getByText(staticData.data.returnChecklistTemplates[1].label)).toBeVisible();

            // Start button visible
            await expect(
                modalLocator.getByRole("button", { name: german.cadetDetailPage.returnProcess.modal.startButton })
            ).toBeVisible();
        });

        test("AC2: default template has defaultProcess=true pre-selected", async ({
            page, staticData, cadetDetailPage,
        }) => {
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await page.getByTestId("btn_cadet_menu_return").click();

            const modalLocator = page.locator(".modal");
            await expect(modalLocator).toBeVisible();

            // Default template "Standard Rückgabe" should be selected
            const selectField = modalLocator.locator("select");
            await expect(selectField).toHaveValue(staticData.ids.returnProcessTemplateIds[0]);
        });

        test("AC2: switching template changes checklist items", async ({
            page, staticData, cadetDetailPage,
        }) => {
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await page.getByTestId("btn_cadet_menu_return").click();

            const modalLocator = page.locator(".modal");
            await expect(modalLocator).toBeVisible();

            // Switch to alternative template
            await modalLocator.locator("select").selectOption(staticData.ids.returnProcessTemplateIds[1]);

            // Alternative template has 1 item
            await expect(modalLocator.getByText(staticData.data.returnChecklistTemplates[2].label)).toBeVisible();
            await expect(modalLocator.getByText(staticData.data.returnChecklistTemplates[0].label)).toBeHidden();
            await expect(modalLocator.getByText(staticData.data.returnChecklistTemplates[1].label)).toBeHidden();
        });

        test("AC3: clicking start return process sets cadet status to RETURNING", async ({
            page, staticData, cadetDetailPage, toast,
        }) => {
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await page.getByTestId("btn_cadet_menu_return").click();

            const modalLocator = page.locator(".modal");
            await expect(modalLocator).toBeVisible();

            // Submit the form
            await modalLocator.getByRole("button", {
                name: german.cadetDetailPage.returnProcess.modal.startButton
            }).click();

            // Modal should close
            await expect(modalLocator).toBeHidden();

            // Success toast
            await expect(toast.toast_success).toBeVisible();

            // DB: cadet status should be RETURNING
            const cadet = await prisma.cadet.findUnique({ where: { id: activeCadetId } });
            expect(cadet?.status).toBe(CadetStatus.RETURNING);
        });

        test("AC3: return process is created in DB with correct template", async ({
            page, staticData, cadetDetailPage,
        }) => {
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await page.getByTestId("btn_cadet_menu_return").click();

            const modalLocator = page.locator(".modal");
            await expect(modalLocator).toBeVisible();

            await modalLocator.getByRole("button", {
                name: german.cadetDetailPage.returnProcess.modal.startButton
            }).click();
            await expect(modalLocator).toBeHidden();

            // Verify return process was created in DB
            const returnProcess = await prisma.returnProcess.findFirst({
                where: {
                    fk_cadet: activeCadetId,
                    fk_assosiation: staticData.fk_assosiation,
                },
                include: { itemStatuses: true },
            });
            expect(returnProcess).not.toBeNull();
            expect(returnProcess?.fk_returnProcessTemplate).toBe(staticData.ids.returnProcessTemplateIds[0]);
            expect(returnProcess?.finished).toBe(false);
        });

        test("closing the modal does not start the return process", async ({
            page, staticData, cadetDetailPage,
        }) => {
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await page.getByTestId("btn_cadet_menu_return").click();

            const modalLocator = page.locator(".modal");
            await expect(modalLocator).toBeVisible();

            // Close modal without submitting
            await modalLocator.getByRole("button", { name: german.common.actions.cancel }).click();
            await expect(modalLocator).toBeHidden();

            // Cadet should still be ACTIVE
            const cadet = await prisma.cadet.findUnique({ where: { id: activeCadetId } });
            expect(cadet?.status).toBe(CadetStatus.ACTIVE);
        });
    });

    // AC5: Error handling: if cadet not active, action fails with error (the return button is hidden, enforced at DAL level too)
    test.describe("AC5: non-ACTIVE cadet cannot trigger return", () => {

        test("RETURNING cadet has no return menu option", async ({
            page, staticData, cadetDetailPage,
        }) => {
            // cadetIds[10] is RETURNING
            const returningCadetId = staticData.ids.cadetIds[10];
            await page.goto(`/de/app/cadet/${returningCadetId}`);

            await cadetDetailPage.btn_menu.click();
            // The return item should not be rendered for non-ACTIVE status
            await expect(page.getByTestId("btn_cadet_menu_return")).toBeHidden();
        });

        test("RETURNED cadet has no return menu option", async ({
            page, staticData, cadetDetailPage,
        }) => {
            // cadetIds[11] is RETURNED
            const returnedCadetId = staticData.ids.cadetIds[11];
            await page.goto(`/de/app/cadet/${returnedCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await expect(page.getByTestId("btn_cadet_menu_return")).toBeHidden();
        });
    });
});
