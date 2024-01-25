import { Page, expect, test } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { CadetDataComponent } from "../../../pages/cadet/cadetData.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { testCadets } from "../../../testData/staticData";
import t from "../../../../public/locales/de";

test.use({ storageState: adminAuthFile });
test.describe('', () => {
    // Marie Ackerman
    const cadet = testCadets.find(c => c.id === "0d06427b-3c12-11ee-8084-0068eb8ba754");
    const testData = {
        firstname: 'firstname',
        lastname: 'lastname',
        active: false,
        comment: 'comment for testing',
    }
    let page: Page;
    let dataComponent: CadetDataComponent;

    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();
        dataComponent = new CadetDataComponent(page);

        await page.goto(`/de/app/cadet/${cadet?.id}`);
    });
    test.beforeEach(async () => {
        await cleanupData();
        await page.reload();
    });
    test.afterAll(async () => page.close());

    test('validate elements editable', async () => {
        await dataComponent.btn_edit.click();

        await Promise.all([
            expect.soft(dataComponent.txt_firstname).toBeEnabled(),
            expect.soft(dataComponent.txt_lastname).toBeEnabled(),
            expect.soft(dataComponent.txt_comment).toBeEnabled(),
            expect.soft(dataComponent.chk_active).toBeVisible(),
            expect.soft(dataComponent.chk_active).toBeEnabled(),
            expect.soft(dataComponent.btn_edit).not.toBeVisible(),
            expect.soft(dataComponent.btn_save).toBeVisible(),
            expect.soft(dataComponent.btn_cancel).toBeVisible(),
        ]);

        await expect.soft(dataComponent.lbl_active).toHaveText(t.common.active.true);
        await dataComponent.chk_active.click();
        await expect.soft(dataComponent.lbl_active).toHaveText(t.common.active.false);
    });

    test('validate functions', async () => {
        if (!cadet) throw ("Testdata Cadet not Found");
        await test.step('change data & cancel', async () => {
            await dataComponent.btn_edit.click();
            await dataComponent.txt_firstname.fill(testData.firstname);
            await dataComponent.txt_lastname.fill(testData.lastname);
            await dataComponent.txt_comment.fill(testData.comment);
            await dataComponent.chk_active.click();

            await dataComponent.btn_cancel.click();
        });

        await test.step('validate', async () => {
            await Promise.all([
                expect.soft(dataComponent.txt_firstname).toHaveValue(cadet.firstname),
                expect.soft(dataComponent.txt_lastname).toHaveValue(cadet.lastname),
                expect.soft(dataComponent.txt_comment).toHaveValue(cadet.comment),
                expect.soft(dataComponent.div_active).toHaveText(t.common.active.true),
            ]);
        });
        await test.step('change data & save', async () => {
            await dataComponent.btn_edit.click();
            await dataComponent.txt_firstname.fill(testData.firstname);
            await dataComponent.txt_lastname.fill(testData.lastname);
            await dataComponent.txt_comment.fill(testData.comment);
            await dataComponent.chk_active.click();

            await dataComponent.btn_save.click();
        });

        await test.step('validate', async () => {
            await Promise.all([
                expect.soft(dataComponent.txt_firstname).toHaveValue(testData.firstname),
                expect.soft(dataComponent.txt_lastname).toHaveValue(testData.lastname),
                expect.soft(dataComponent.txt_comment).toHaveValue(testData.comment),
                expect.soft(dataComponent.div_active).toHaveText(t.common.active.false),
            ]);
        });
    });
});
