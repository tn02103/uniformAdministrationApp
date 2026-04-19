import { expect } from "playwright/test";
import german from "../../../public/locales/de";
import { adminTest, inspectorTest, managerTest, userTest } from "../../_playwrightConfig/setup";

// cadetIds[1] = Marie Becker — inspected in inspectionIds[0] (Quartal 1, closed) and inspectionIds[1] (Quartal 2, closed)
const CADET_INDEX = 1;

adminTest.describe("Cadet Inspection History — Extended Information section", () => {
    adminTest("section visible for admin role", async ({ page, staticData: { ids } }) => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[CADET_INDEX]}`);

        // The ExpandableDividerArea toggle button should be present (section exists, collapsed by default)
        await expect(
            page.getByRole("button", { name: german.expandableArea.showMore })
        ).toBeVisible();
    });

    adminTest("inspection history tab renders rows after expanding", async ({ page, staticData: { ids } }) => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[CADET_INDEX]}`);

        // Expand the Extended Information section
        await page.getByRole("button", { name: german.expandableArea.showMore }).click();

        // Verify the section header and tab are visible
        await expect(
            page.getByRole("heading", { name: german.cadetDetailPage.extendedInformation.header })
        ).toBeVisible();

        // Click the Inspection History tab (it should be the default, but click to be sure)
        await page.getByRole("tab", {
            name: german.cadetDetailPage.extendedInformation.tabs.inspectionHistory,
        }).click();

        // Verify the table has at least one row (tbody tr)
        const rows = page.locator("table tbody tr");
        await expect(rows.first()).toBeVisible();

        // Verify the first row contains a date cell (non-empty)
        const firstRow = rows.first();
        const cells = firstRow.locator("td");
        await expect(cells.first()).not.toBeEmpty();

        // Verify an attendance badge is rendered in the row
        await expect(firstRow.locator(".badge")).toBeVisible();
    });
});

managerTest.describe("Cadet Inspection History — materialManager role", () => {
    managerTest("section visible for materialManager role", async ({ page, staticData: { ids } }) => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[CADET_INDEX]}`);

        await expect(
            page.getByRole("button", { name: german.expandableArea.showMore })
        ).toBeVisible();
    });
});

inspectorTest.describe("Cadet Inspection History — lower roles cannot see section", () => {
    inspectorTest("section NOT visible for inspector role", async ({ page, staticData: { ids } }) => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[CADET_INDEX]}`);

        await expect(
            page.getByRole("button", { name: german.expandableArea.showMore })
        ).toBeHidden();
    });
});

userTest.describe("Cadet Inspection History — user role", () => {
    userTest("section NOT visible for user role", async ({ page, staticData: { ids } }) => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[CADET_INDEX]}`);

        await expect(
            page.getByRole("button", { name: german.expandableArea.showMore })
        ).toBeHidden();
    });
});
