import { CadetStatus } from "@/prisma/client";
import { expect } from "playwright/test";
import { CadetDetailPage } from "../../_playwrightConfig/pages/cadet/cadetDetail.page";
import { ToastTestComponent } from "../../_playwrightConfig/pages/global/Toast.component";
import { inspectorTest, userTest } from "../../_playwrightConfig/setup";
import german from "../../../public/locales/de";

type Fixture = {
    cadetDetailPage: CadetDetailPage;
    toast: ToastTestComponent;
};

const test = inspectorTest.extend<Fixture>({
    cadetDetailPage: async ({ page }, use) => use(new CadetDetailPage(page)),
    toast: async ({ page }, use) => use(new ToastTestComponent(page)),
});

test.describe("Cadet Return Uniform", () => {

    test.afterEach(async ({ staticData }) => {
        await staticData.cleanup.cadet();
        await staticData.setReturnProcessEnabled(false);
    });

    // AC1: "Vereinsaustritt" only visible when cadet status is ACTIVE and user is inspector
    test.describe("AC1: visibility based on cadet status and user role", () => {

        test("inspector sees return menu item for ACTIVE cadet", async ({ page, staticData, cadetDetailPage }) => {
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await expect(cadetDetailPage.btn_menu_memberExit).toBeVisible();
        });

        test("inspector does NOT see return menu item for RETURNING cadet", async ({ page, staticData, cadetDetailPage }) => {
            const returningCadetId = staticData.ids.cadetIds[10];
            await page.goto(`/de/app/cadet/${returningCadetId}`);

            await expect(cadetDetailPage.btn_menu).toBeHidden();
        });

        test("inspector does NOT see return menu item for RETURNED cadet", async ({ page, staticData, cadetDetailPage }) => {
            const returnedCadetId = staticData.ids.cadetIds[11];
            await page.goto(`/de/app/cadet/${returnedCadetId}`);

            await expect(cadetDetailPage.btn_menu).toBeHidden();
        });

        userTest("user role cannot see cadet menu at all", async ({ page, staticData }) => {
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);
            await expect(page.getByTestId("btn_cadet_menu")).toBeHidden();
        });
    });

    // AC4: Without returnProcessEnabled/templates: modal opens with step 1 → direct save → cadet RETURNED
    test.describe("AC4: direct return path (returnProcessEnabled=false)", () => {
        test.beforeEach(async ({ staticData }) => {
            await staticData.setReturnProcessEnabled(false);
        });
        test("shows member exit modal with uniform items step and saves directly", async ({
            page, staticData, cadetDetailPage, toast,
        }) => {
            // returnProcessEnabled is false by default
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await cadetDetailPage.btn_menu_memberExit.click();

            // Modal opens with step 1
            const modalLocator = page.locator(".modal");
            await expect(modalLocator).toBeVisible();

            // Save button (no process step)
            const saveBtn = modalLocator.getByRole("button", { name: german.cadetDetailPage.memberExit.modal.actions.save });
            await expect(saveBtn).toBeVisible();
            await saveBtn.click();

            // Modal should close
            await expect(modalLocator).toBeHidden();

            // Success toast
            await expect(toast.toast_success).toBeVisible();

            // Verify cadet status in DB
            const cadet = await staticData.getCadet(activeCadetId);
            expect(cadet?.status === CadetStatus.RETURNED || cadet?.status === CadetStatus.DELETED).toBeTruthy();
        });

        test("cancelling the modal does not change cadet status", async ({
            page, staticData, cadetDetailPage,
        }) => {
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await cadetDetailPage.btn_menu_memberExit.click();

            const modalLocator = page.locator(".modal");
            await expect(modalLocator).toBeVisible();
            await modalLocator.getByRole("button", { name: german.common.actions.cancel }).click();
            await expect(modalLocator).toBeHidden();

            // Cadet should still be ACTIVE
            const cadet = await staticData.getCadet(activeCadetId);
            expect(cadet?.status).toBe(CadetStatus.ACTIVE);
        });
    });

    // AC2: With returnProcessEnabled + templates: two-step modal; template select only if >1
    // AC3: After "Start Process": cadet status becomes RETURNING
    test.describe("AC2/AC3: return process path (returnProcessEnabled=true)", () => {

        test.beforeEach(async ({ staticData }) => {
            await staticData.setReturnProcessEnabled(true);
        });

        test("AC3: clicking start process sets cadet status to RETURNING", async ({
            page, staticData, cadetDetailPage, toast,
        }) => {
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await cadetDetailPage.btn_menu_memberExit.click();

            const modalLocator = page.locator(".modal");
            await expect(modalLocator).toBeVisible();
            await modalLocator.getByRole("button", { name: german.cadetDetailPage.memberExit.modal.actions.next }).click();

            // Submit the form
            await modalLocator.getByRole("button", {
                name: german.cadetDetailPage.memberExit.modal.actions.startProcess
            }).click();

            // Modal should close
            await expect(modalLocator).toBeHidden();

            // Success toast
            await expect(toast.toast_success).toBeVisible();

            // DB: cadet status should be RETURNING
            const cadet = await staticData.getCadet(activeCadetId);
            expect(cadet?.status).toBe(CadetStatus.RETURNING);
        });

        test("AC3: return process is created in DB with correct template", async ({
            page, staticData, cadetDetailPage,
        }) => {
            const activeCadetId = staticData.ids.cadetIds[0];
            await page.goto(`/de/app/cadet/${activeCadetId}`);

            await cadetDetailPage.btn_menu.click();
            await cadetDetailPage.btn_menu_memberExit.click();

            const modalLocator = page.locator(".modal");
            await expect(modalLocator).toBeVisible();
            await modalLocator.getByRole("button", { name: german.cadetDetailPage.memberExit.modal.actions.next }).click();

            await modalLocator.getByRole("button", {
                name: german.cadetDetailPage.memberExit.modal.actions.startProcess
            }).click();
            await expect(modalLocator).toBeHidden();

            // Verify return process was created in DB
            const returnProcess = await staticData.getReturnProcessByCadetId(activeCadetId);
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
            await cadetDetailPage.btn_menu_memberExit.click();

            const modalLocator = page.locator(".modal");
            await expect(modalLocator).toBeVisible();

            // Close modal without submitting
            await modalLocator.getByRole("button", { name: german.common.actions.cancel }).click();
            await expect(modalLocator).toBeHidden();

            // Cadet should still be ACTIVE
            const cadet = await staticData.getCadet(activeCadetId);
            expect(cadet?.status).toBe(CadetStatus.ACTIVE);
        });
    });
});

