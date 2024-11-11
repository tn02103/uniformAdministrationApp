import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import { PlannedInspectionTestComponent } from "../../_playwrightConfig/pages/inspection/plannedInspection.component";
import { adminTest } from "../../_playwrightConfig/setup";

import dayjs from "@/lib/dayjs";

type Fixture = {
    plannedComponent: PlannedInspectionTestComponent;
}
const test = adminTest.extend<Fixture>({
    plannedComponent: ({ page }, use) => use(new PlannedInspectionTestComponent(page)),
});
test.beforeEach(({ page }) => page.goto('/de/app/inspection'));

test.describe('validate Data', async () => {
    test('sortOrder', async ({ plannedComponent, staticData: { ids } }) => {
        await expect(plannedComponent.div_row_list).toHaveCount(3);
        await expect(plannedComponent.div_row_list.nth(0)).toHaveAttribute('data-testid', `div_inspection_${ids.inspectionIds[2]}`);
        await expect(plannedComponent.div_row_list.nth(1)).toHaveAttribute('data-testid', `div_inspection_${ids.inspectionIds[4]}`);
        await expect(plannedComponent.div_row_list.nth(2)).toHaveAttribute('data-testid', `div_inspection_${ids.inspectionIds[3]}`);
    });
    test('expired', async ({ plannedComponent, staticData: { data } }) => {
        const inspection = data.inspections[2];
        const rowComponent = plannedComponent.getRowComponent(inspection.id);
        await Promise.all([
            expect.soft(rowComponent.div_name).toHaveText(inspection.name),
            expect.soft(rowComponent.div_date).toHaveText(dayjs(inspection.date).locale('de').format('dd DD.MM.YYYY')),
        ]);
    });
    test('not Finished', async ({ page, plannedComponent, staticData: { data } }) => {
        const inspection = data.inspections[1];
        await test.step('prepare Data', async () => {
            await prisma.inspection.update({
                where: { id: inspection.id },
                data: { timeEnd: null }
            });
            await page.reload();
        });
        const rowComponent = plannedComponent.getRowComponent(inspection.id);

        await Promise.all([
            expect.soft(rowComponent.div_name).toHaveText(inspection.name),
            expect.soft(rowComponent.div_date).toHaveText(dayjs(inspection.date).locale('de').format('dd DD.MM.YYYY')),
        ]);
    });
    test('planned', async ({ plannedComponent, staticData: { data } }) => {
        const inspection = data.inspections[3];
        const rowComponent = plannedComponent.getRowComponent(inspection.id);
        await Promise.all([
            expect.soft(rowComponent.div_name).toHaveText(inspection.name),
            expect.soft(rowComponent.div_date).toHaveText(dayjs(inspection.date).locale('de').format('dd DD.MM.YYYY')),
        ]);
    });
    test('todays', async ({ plannedComponent, staticData: { data } }) => {
        const inspection = data.inspections[4];
        const rowComponent = plannedComponent.getRowComponent(inspection.id);
        await Promise.all([
            expect.soft(rowComponent.div_name).toHaveText(inspection.name),
            expect.soft(rowComponent.div_date).toHaveText(dayjs(inspection.date).locale('de').format('dd DD.MM.YYYY')),
        ]);
    });
    test('active', async ({ page, plannedComponent, staticData: { data } }) => {
        const inspection = data.inspections[4];
        const rowComponent = plannedComponent.getRowComponent(inspection.id);

        await test.step('prepare Data', async () => {
            await prisma.inspection.update({
                where: { id: inspection.id },
                data: { timeStart: dayjs.utc("02:00:00", 'HH:mm:ss').toDate() }
            });
            await page.reload();
        });

        await Promise.all([
            expect.soft(rowComponent.div_name).toHaveText(inspection.name),
            expect.soft(rowComponent.div_date).toHaveText(dayjs(inspection.date).locale('de').format('dd DD.MM.YYYY')),
        ]);
    });
    test('completed', async ({ page, plannedComponent, staticData: { data } }) => {
        const inspection = data.inspections[4];
        const rowComponent = plannedComponent.getRowComponent(inspection.id);

        await test.step('prepare Data', async () => {
            await prisma.inspection.update({
                where: {
                    id: inspection.id,
                },
                data: {
                    timeStart: dayjs.utc("02:00:00", 'HH:mm:ss').toDate(),
                    timeEnd: dayjs.utc("04:00:00", 'HH:mm:ss').toDate(),
                }
            });
            await page.reload();
        });
        
        await Promise.all([
            expect.soft(rowComponent.div_name).toHaveText(inspection.name),
            expect.soft(rowComponent.div_date).toHaveText(dayjs(inspection.date).locale('de').format('dd DD.MM.YYYY')),
        ]);
    });
});
