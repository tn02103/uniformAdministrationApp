import { expect } from "playwright/test";
import { managerTest } from "../../_playwrightConfig/setup";

const test = managerTest;

test.describe("Abgeschlossene Kontrollen", () => {
    test.beforeEach(({ page }) => page.goto("/de/app/inspection"));

    test.afterEach(async ({ staticData: { cleanup } }) => {
        await cleanup.inspection();
    });

    test("E2E-CI01: section is visible with correct column headers", async ({
        page,
    }) => {
        await expect(
            page.getByRole("heading", { name: /Abgeschlossene Kontrollen/i })
        ).toBeVisible();

        const table = page.getByTestId("div_closedInspectionTable");
        await expect(table).toBeVisible();

        const headers = table.locator("thead th");
        await expect(headers.filter({ hasText: /Name/i })).toBeVisible();
        await expect(headers.filter({ hasText: /Datum/i })).toBeVisible();
        await expect(headers.filter({ hasText: /Dauer/i })).toBeVisible();
        await expect(headers.filter({ hasText: /Aktive VKs/i })).toBeVisible();
        await expect(headers.filter({ hasText: /Kontrolliert/i })).toBeVisible();
        await expect(headers.filter({ hasText: /Abgemeldet/i })).toBeVisible();
        await expect(headers.filter({ hasText: /Fehlend/i })).toBeVisible();
        await expect(headers.filter({ hasText: /Uniform vollst/i })).toBeVisible();
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

    test("E2E-CI05: clicking Bericht anzeigen opens the report offcanvas", async ({
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

    test("E2E-CI07: XLSX download endpoint returns 403 for unknown inspection ID", async ({
        page,
    }) => {
        const response = await page.request.get(
            "/api/inspection/00000000-0000-0000-0000-000000000000/report"
        );
        expect(response.status()).toBe(403);
    });
});
