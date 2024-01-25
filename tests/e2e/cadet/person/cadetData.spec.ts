import { expect, test } from "playwright/test";
import { adminAuthFile, inspectorAuthFile, userAuthFile } from "../../../auth.setup";
import { CadetDataComponent } from "../../../pages/cadet/cadetData.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { testCadets } from "../../../testData/staticData";
import t from "../../../../public/locales/de";

// Marie Ackerman
const cadet = testCadets.find(c => c.id === "0d06427b-3c12-11ee-8084-0068eb8ba754");
test.use({ storageState: adminAuthFile });
test.beforeEach(async () => {
    await cleanupData();
});

test('validate data', async ({ page }) => {
    if (!cadet) throw Error();
    const dataComponent = new CadetDataComponent(page);
    await page.goto(`/de/app/cadet/${cadet?.id}`);

    await test.step('validate correct data', async () => {
        await Promise.all([
            expect.soft(dataComponent.txt_firstname).toHaveValue(cadet.firstname),
            expect.soft(dataComponent.txt_lastname).toHaveValue(cadet.lastname),
            expect.soft(dataComponent.txt_comment).toHaveValue(cadet.comment),
            expect.soft(dataComponent.div_lastInspection).toHaveText('13.08.2023'),
            expect.soft(dataComponent.div_active).toHaveText(t.common.active.true),
        ]);
    });
    await test.step('validate elements not editable', async () => {
        await Promise.all([
            expect.soft(dataComponent.txt_firstname).toBeDisabled(),
            expect.soft(dataComponent.txt_lastname).toBeDisabled(),
            expect.soft(dataComponent.txt_comment).toBeDisabled(),
            expect.soft(dataComponent.chk_active).not.toBeVisible(),
        ]);
    });
});

test.describe('validate Authroles', async () => {
    test.describe('', async () => {
        test.use({ storageState: userAuthFile });
        test('user', async ({ page }) => {
            const dataComponent = new CadetDataComponent(page);
            await page.goto(`/de/app/cadet/${cadet?.id}`);
            await test.step('validate', async () => {
                await Promise.all([
                    expect.soft(dataComponent.div_card).toBeVisible(),
                    expect.soft(dataComponent.div_header).toBeVisible(),
                    expect.soft(dataComponent.txt_firstname).toBeVisible(),
                    expect.soft(dataComponent.txt_lastname).toBeVisible(),
                    expect.soft(dataComponent.div_active).toBeVisible(),
                    expect.soft(dataComponent.txt_comment).not.toBeVisible(),
                    expect.soft(dataComponent.div_lastInspection).not.toBeVisible(),
                    expect.soft(dataComponent.btn_edit).not.toBeVisible(),
                ]);
            });
        });
    });

    test.describe('', async () => {
        test.use({ storageState: inspectorAuthFile });
        test('inspector', async ({ page }) => {
            const dataComponent = new CadetDataComponent(page);

            await page.goto(`/de/app/cadet/${cadet?.id}`);
            await test.step('validate', async () => {
                await Promise.all([
                    expect.soft(dataComponent.div_card).toBeVisible(),
                    expect.soft(dataComponent.div_header).toBeVisible(),
                    expect.soft(dataComponent.txt_firstname).toBeVisible(),
                    expect.soft(dataComponent.txt_lastname).toBeVisible(),
                    expect.soft(dataComponent.div_active).toBeVisible(),
                    expect.soft(dataComponent.txt_comment).toBeVisible(),
                    expect.soft(dataComponent.div_lastInspection).toBeVisible(),
                    expect.soft(dataComponent.btn_edit).toBeVisible(),
                ]);
            });
        });
    });
});
