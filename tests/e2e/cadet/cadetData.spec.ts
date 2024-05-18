import { prisma } from "@/lib/db";
import { Cadet } from "@prisma/client";
import { expect, } from "playwright/test";
import t from "../../../public/locales/de";
import { adminTest, inspectorTest, managerTest, userTest } from "../../auth.setup";
import { CadetDataComponent } from "../../pages/cadet/cadetData.component";
import { CadetDetailPage } from "../../pages/cadet/cadetDetail.page";
import { CadetListPage } from "../../pages/cadet/f";
import { MessagePopupComponent } from "../../pages/popups/MessagePopup.component";
import { cleanupCadet } from "../../testData/cleanupStatic";


type Fixture = {
    cadet: Cadet;
    dataComponent: CadetDataComponent;
    messagePopup: MessagePopupComponent;
    cadetDetailPage: CadetDetailPage;
}
const test = adminTest.extend<Fixture>({
    cadet: async ({ staticData }, use) => use(await prisma.cadet.findUniqueOrThrow({ where: { id: staticData.ids.cadetIds[1] } })),
    dataComponent: async ({ page }, use) => use(new CadetDataComponent(page)),
    cadetDetailPage: async ({ page }, use) => use(new CadetDetailPage(page)),
    messagePopup: async ({ page }, use) => use(new MessagePopupComponent(page)),
});

userTest('Authrole: user', async ({ page, staticData: { ids } }) => {
    const dataComponent = new CadetDataComponent(page);
    const detailPage = new CadetDetailPage(page);
    await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`);

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
            expect.soft(detailPage.btn_menu).not.toBeVisible(),
        ]);
    });
});

inspectorTest('Authrole: inspector', async ({ page, staticData: { ids } }) => {
    const dataComponent = new CadetDataComponent(page);
    const detailPage = new CadetDetailPage(page);
    await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`);

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
            expect.soft(detailPage.btn_menu).not.toBeVisible(),
        ]);
    });
});
managerTest('Authrole: materialManager', async ({ page, staticData: { ids } }) => {
    const dataComponent = new CadetDataComponent(page);
    const detailPage = new CadetDetailPage(page);
    await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`);

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
            expect.soft(detailPage.btn_menu).toBeVisible(),
        ]);
    });
});

test.describe(async () => {
    test.beforeEach(async ({ page, staticData }) => {
        await page.goto(`/de/app/cadet/${staticData.ids.cadetIds[1]}`);
    });
    test.afterEach(async ({ staticData: { index } }) => {
        await cleanupCadet(index);
    });

    test('validate data', async ({ dataComponent, cadet }) => {
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

    test('delete', async ({ page, cadetDetailPage, messagePopup, staticData: { ids } }) => {
        const listPage = new CadetListPage(page);
        await test.step('validate popup and save', async () => {
            await cadetDetailPage.btn_menu.click();
            await expect(cadetDetailPage.btn_menu_delete).toBeVisible();
            await cadetDetailPage.btn_menu_delete.click();
            await expect(messagePopup.div_popup).toBeVisible();

            await Promise.all([
                expect.soft(messagePopup.div_header).toHaveText(t.cadetDetailPage.delete.header),
                expect.soft(messagePopup.div_message).toContainText(/Marie Becker/),
                expect.soft(messagePopup.div_header).toHaveAttribute("class", /bg-warning/),
                expect.soft(messagePopup.div_icon.locator('svg[data-icon="triangle-exclamation"]')).toBeVisible(),
                expect.soft(messagePopup.btn_save).toHaveText(t.common.actions.delete),
            ]);
            await messagePopup.btn_save.click();
        });

        await test.step('validate ui', async () => {
            await expect.soft(messagePopup.div_popup).not.toBeVisible();
            await page.waitForURL(/app\/cadet$/);
            await expect.soft(listPage.div_cadet(ids.cadetIds[1])).not.toBeVisible();
        });
        await test.step('validate db', async () => {
            const date = new Date();
            date.setUTCHours(0, 0, 0, 0);
            const cadet = await prisma.cadet.findUniqueOrThrow({
                where: { id: ids.cadetIds[1] }
            });

            expect(cadet.recdelete).not.toBeNull();
            expect(cadet.recdeleteUser).toBe('test4');
        });
    });

    test('edit', async ({ page, dataComponent, cadet }) => {
        const testData = {
            firstname: 'firstname',
            lastname: 'lastname',
            active: false,
            comment: 'comment for testing',
        }
        await test.step('check editable', async () => {
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
        });
        await test.step('validate lbl_active', async () => {
            await expect.soft(dataComponent.lbl_active).toHaveText(t.common.active.true);
            await dataComponent.chk_active.click();
            await expect.soft(dataComponent.lbl_active).toHaveText(t.common.active.false);
        })
        await test.step('change data & cancel', async () => {
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
            await dataComponent.btn_edit.isEnabled();
        });

        await test.step('validate ui', async () => {
            await Promise.all([
                expect.soft(dataComponent.txt_firstname).toHaveValue(testData.firstname),
                expect.soft(dataComponent.txt_lastname).toHaveValue(testData.lastname),
                expect.soft(dataComponent.txt_comment).toHaveValue(testData.comment),
                expect.soft(dataComponent.div_active).toHaveText(t.common.active.false),
            ]);
        });
        await test.step('validate db', async () => {
            const dbCadet = await prisma.cadet.findUniqueOrThrow({
                where: { id: cadet.id }
            });

            expect(dbCadet).toEqual(expect.objectContaining({
                ...testData,
                recdelete: null,
                recdeleteUser: null,
            }));
        });
    });
});
