import { expect } from "playwright/test";
import { PlannedInspectionTestComponent } from "../../_playwrightConfig/pages/inspection/plannedInspection.component";
import { adminTest } from "../../_playwrightConfig/setup";
import { prisma } from "@/lib/db";

import dayjs from "@/lib/dayjs";

type Fixture = {
    plannedComponent: PlannedInspectionTestComponent;
}
const test = adminTest.extend<Fixture>({
    plannedComponent: ({ page }, use) => use(new PlannedInspectionTestComponent(page)),
});
test.beforeEach(({ page }) => page.goto('/de/app/inspection'));

test('validate Data', async ({ page, plannedComponent, staticData: { data, ids } }) => {
    await test.step('sortOrder', async () => {
        await expect(plannedComponent.div_row_list).toHaveCount(4);
        await expect(plannedComponent.div_row_list.nth(0)).toHaveAttribute('data-testid', `div_inspection_${ids.inspectionIds[2]}`);
        await expect(plannedComponent.div_row_list.nth(1)).toHaveAttribute('data-testid', `div_inspection_${ids.inspectionIds[3]}`);
        await expect(plannedComponent.div_row_list.nth(2)).toHaveAttribute('data-testid', `div_inspection_${ids.inspectionIds[4]}`);
        await expect(plannedComponent.div_row_list.nth(3)).toHaveAttribute('data-testid', `div_inspection_${ids.inspectionIds[5]}`);
    });
    await test.step('expired', async () => {
        const inspection = data.inspections[2];
        const rowComponent = plannedComponent.getRowComponent(inspection.id);
        await Promise.all([
            expect.soft(rowComponent.div_name).toHaveText(inspection.name),
            expect.soft(rowComponent.div_date).toHaveText(dayjs(inspection.date).locale('de').format('dd DD.MM.yyyy')),

            expect.soft(rowComponent.lbl_expired).toBeVisible(),
            expect.soft(rowComponent.lbl_active).not.toBeVisible(),
            expect.soft(rowComponent.lbl_planned).not.toBeVisible(),
            expect.soft(rowComponent.lbl_new).not.toBeVisible(),
            expect.soft(rowComponent.lbl_notCompleted).not.toBeVisible(),
            expect.soft(rowComponent.lbl_completed).not.toBeVisible(),

            expect.soft(rowComponent.btn_edit).toBeVisible(),
            expect.soft(rowComponent.btn_delete).toBeVisible(),
            expect.soft(rowComponent.btn_start).not.toBeVisible(),
            expect.soft(rowComponent.btn_save).not.toBeVisible(),
            expect.soft(rowComponent.btn_cancel).not.toBeVisible(),
            expect.soft(rowComponent.btn_complete).not.toBeVisible(),
        ]);
    });
    await test.step('not Finished', async () => {
        const inspection = data.inspections[3];
        const rowComponent = plannedComponent.getRowComponent(inspection.id);

        await Promise.all([
            expect.soft(rowComponent.div_name).toHaveText(inspection.name),
            expect.soft(rowComponent.div_date).toHaveText(dayjs(inspection.date).locale('de').format('dd DD.MM.yyyy')),

            expect.soft(rowComponent.lbl_expired).not.toBeVisible(),
            expect.soft(rowComponent.lbl_active).not.toBeVisible(),
            expect.soft(rowComponent.lbl_planned).not.toBeVisible(),
            expect.soft(rowComponent.lbl_new).not.toBeVisible(),
            expect.soft(rowComponent.lbl_notCompleted).toBeVisible(),
            expect.soft(rowComponent.lbl_completed).not.toBeVisible(),

            expect.soft(rowComponent.btn_edit).not.toBeVisible(),
            expect.soft(rowComponent.btn_delete).not.toBeVisible(),
            expect.soft(rowComponent.btn_start).not.toBeVisible(),
            expect.soft(rowComponent.btn_save).not.toBeVisible(),
            expect.soft(rowComponent.btn_cancel).not.toBeVisible(),
            expect.soft(rowComponent.btn_complete).toBeVisible(),
        ]);
    });
    await test.step('planned', async () => {
        const inspection = data.inspections[5];
        const rowComponent = plannedComponent.getRowComponent(inspection.id);
        await Promise.all([
            expect.soft(rowComponent.div_name).toHaveText(inspection.name),
            expect.soft(rowComponent.div_date).toHaveText(dayjs(inspection.date).locale('de').format('dd DD.MM.yyyy')),

            expect.soft(rowComponent.lbl_expired).not.toBeVisible(),
            expect.soft(rowComponent.lbl_active).not.toBeVisible(),
            expect.soft(rowComponent.lbl_planned).toBeVisible(),
            expect.soft(rowComponent.lbl_new).not.toBeVisible(),
            expect.soft(rowComponent.lbl_notCompleted).not.toBeVisible(),
            expect.soft(rowComponent.lbl_completed).not.toBeVisible(),

            expect.soft(rowComponent.btn_edit).toBeVisible(),
            expect.soft(rowComponent.btn_delete).toBeVisible(),
            expect.soft(rowComponent.btn_start).not.toBeVisible(),
            expect.soft(rowComponent.btn_save).not.toBeVisible(),
            expect.soft(rowComponent.btn_cancel).not.toBeVisible(),
            expect.soft(rowComponent.btn_complete).not.toBeVisible(),
        ]);
    });
    await test.step('todays', async () => {
        const inspection = data.inspections[4];
        const rowComponent = plannedComponent.getRowComponent(inspection.id);
        await Promise.all([
            expect.soft(rowComponent.div_name).toHaveText(inspection.name),
            expect.soft(rowComponent.div_date).toHaveText(dayjs(inspection.date).locale('de').format('dd DD.MM.yyyy')),

            expect.soft(rowComponent.lbl_expired).not.toBeVisible(),
            expect.soft(rowComponent.lbl_active).not.toBeVisible(),
            expect.soft(rowComponent.lbl_planned).toBeVisible(),
            expect.soft(rowComponent.lbl_new).not.toBeVisible(),
            expect.soft(rowComponent.lbl_notCompleted).not.toBeVisible(),
            expect.soft(rowComponent.lbl_completed).not.toBeVisible(),

            expect.soft(rowComponent.btn_edit).toBeVisible(),
            expect.soft(rowComponent.btn_delete).toBeVisible(),
            expect.soft(rowComponent.btn_start).toBeVisible(),
            expect.soft(rowComponent.btn_save).not.toBeVisible(),
            expect.soft(rowComponent.btn_cancel).not.toBeVisible(),
            expect.soft(rowComponent.btn_complete).not.toBeVisible(),

        ]);
    });
    await test.step('active', async () => {
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
            expect.soft(rowComponent.div_date).toHaveText(dayjs(inspection.date).locale('de').format('dd DD.MM.yyyy')),

            expect.soft(rowComponent.lbl_expired).not.toBeVisible(),
            expect.soft(rowComponent.lbl_active).toBeVisible(),
            expect.soft(rowComponent.lbl_planned).not.toBeVisible(),
            expect.soft(rowComponent.lbl_new).not.toBeVisible(),
            expect.soft(rowComponent.lbl_notCompleted).not.toBeVisible(),
            expect.soft(rowComponent.lbl_completed).not.toBeVisible(),

            expect.soft(rowComponent.btn_edit).not.toBeVisible(),
            expect.soft(rowComponent.btn_delete).not.toBeVisible(),
            expect.soft(rowComponent.btn_start).not.toBeVisible(),
            expect.soft(rowComponent.btn_save).not.toBeVisible(),
            expect.soft(rowComponent.btn_cancel).not.toBeVisible(),
            expect.soft(rowComponent.btn_complete).toBeVisible(),
        ]);
    });
    await test.step('completed', async () => {
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
        })

        await Promise.all([
            expect.soft(rowComponent.div_name).toHaveText(inspection.name),
            expect.soft(rowComponent.div_date).toHaveText(dayjs(inspection.date).locale('de').format('dd DD.MM.yyyy')),

            expect.soft(rowComponent.lbl_expired).not.toBeVisible(),
            expect.soft(rowComponent.lbl_active).not.toBeVisible(),
            expect.soft(rowComponent.lbl_planned).not.toBeVisible(),
            expect.soft(rowComponent.lbl_new).not.toBeVisible(),
            expect.soft(rowComponent.lbl_notCompleted).not.toBeVisible(),
            expect.soft(rowComponent.lbl_completed).toBeVisible(),

            expect.soft(rowComponent.btn_edit).not.toBeVisible(),
            expect.soft(rowComponent.btn_delete).not.toBeVisible(),
            expect.soft(rowComponent.btn_start).toBeVisible(),
            expect.soft(rowComponent.btn_save).not.toBeVisible(),
            expect.soft(rowComponent.btn_cancel).not.toBeVisible(),
            expect.soft(rowComponent.btn_complete).not.toBeVisible(),
        ]);
    });
});
