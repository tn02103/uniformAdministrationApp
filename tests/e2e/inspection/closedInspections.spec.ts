import { expect } from "playwright/test";
import { managerTest } from "../../_playwrightConfig/setup";

const test = managerTest;

test.describe("Abgeschlossene Kontrollen", () => {
    test.beforeEach(({ page }) => page.goto("/de/app/inspection"));

    test.afterEach(async ({ staticData: { cleanup } }) => {
        await cleanup.inspection();
    });

    test("E2E-CI02: static closed inspections appear in the list", async ({
        page,
        staticData: { ids },
    }) => {
        const table = page.getByTestId("div_closedInspectionTable");

        const row0 = table.getByTestId(`row_${ids.inspectionIds[0]}`);
        const row1 = table.getByTestId(`row_${ids.inspectionIds[1]}`);

        await expect(row0).toBeVisible();
        await expect(row0).toContainText("Quartal 1");
        await expect(row0).toContainText("2023-06-18");

        await expect(row1).toBeVisible();
        await expect(row1).toContainText("Quartal 2");
        await expect(row1).toContainText("2023-08-13");
    });

    test("E2E-CI05: clicking 'Show Report' button opens the report offcanvas", async ({
        page,
        staticData: { ids },
    }) => {
        const table = page.getByTestId("div_closedInspectionTable");
        const row = table.getByTestId(`row_${ids.inspectionIds[0]}`);

        await row.getByRole("button", { name: /Bericht anzeigen/i }).click();

        const offcanvas = page.getByRole("dialog");
        await expect(offcanvas).toBeVisible();
        await expect(
            offcanvas.getByText(/Inspektionsbericht/i)
        ).toBeVisible();

        // Cadet list table columns
        const reportTable = offcanvas.locator("table");
        await expect(reportTable).toBeVisible();
        await expect(
            reportTable.locator("thead").getByText(/Anwesenheit/i)
        ).toBeVisible();
        await expect(
            reportTable.locator("thead").getByText(/Uniform vollst/i)
        ).toBeVisible();
    });

    test("E2E-CI06: XLSX download endpoint returns 200 with spreadsheet content-type", async ({
        page,
        staticData: { ids },
    }) => {
        const response = await page.request.get(
            `/api/inspection/${ids.inspectionIds[0]}/report`
        );

        expect(response.status()).toBe(200);
        const contentType = response.headers()["content-type"];
        expect(contentType).toContain(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        const contentDisposition = response.headers()["content-disposition"];
        expect(contentDisposition).toMatch(/attachment/);
        expect(contentDisposition).toMatch(/\.xlsx/);
    });

});
