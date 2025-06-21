import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";
import { expect, Page } from "playwright/test";
import t from "../../../../public/locales/de";
import { viewports } from "../../../_playwrightConfig/global/helper";
import { CadetDetailPage } from "../../../_playwrightConfig/pages/cadet/cadetDetail.page";
import { CadetUniformComponent } from "../../../_playwrightConfig/pages/cadet/cadetUniform.component";
import { MessagePopupComponent } from "../../../_playwrightConfig/pages/popups/MessagePopup.component";
import { SimpleFormPopupComponent } from "../../../_playwrightConfig/pages/popups/SimpleFormPopup.component";
import { adminTest } from "../../../_playwrightConfig/setup";

type Fixture = {
    cadetId: string;
    uniformComponent: CadetUniformComponent;
    messageComponent: MessagePopupComponent;
    issuePopupComponent: SimpleFormPopupComponent;
};

const test = adminTest.extend<Fixture>({
    cadetId: async ({ staticData }, use) => use(staticData.ids.cadetIds[1]),
    uniformComponent: async ({ page }, use) => use(new CadetUniformComponent(page)),
    messageComponent: async ({ page }, use) => use(new MessagePopupComponent(page)),
    issuePopupComponent: async ({ page }, use) => use(new SimpleFormPopupComponent(page)),
});
test.afterEach(async ({ staticData }) => {
    await staticData.resetData();
});
test.describe(() => {
    const dbIssuedItemCheck = async (fk_uniform: string, fk_cadet: string) => {
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);
        const ui = await prisma.uniformIssued.findMany({
            where: { fk_uniform, fk_cadet },
        });
        expect(ui).toHaveLength(1);
        expect.soft(ui[0]).toEqual(expect.objectContaining({
            id: expect.stringMatching(uuidValidationPattern),
            dateIssued: date,
            dateReturned: null,
            fk_cadet,
        }));
    }
    const dbIssuedAmountCheck = async (fk_cadet: string, amount: number) => {
        const uiList = await prisma.uniformIssued.findMany({
            where: {
                fk_cadet,
                dateReturned: null
            }
        });
        expect.soft(uiList).toHaveLength(amount);
    }
    const dbReturnedCheck = async (fk_uniform: string, fk_cadet: string, dateIssued: Date) => {
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);
        const ui = await prisma.uniformIssued.findMany({
            where: { fk_uniform, fk_cadet },
        });
        expect(ui).toHaveLength(1);
        expect.soft(ui[0]).toEqual(expect.objectContaining({
            id: expect.stringMatching(uuidValidationPattern),
            dateIssued,
            dateReturned: date,
            fk_cadet,
        }));
    }
    const dbCommentCheck = async (cadetId: string, uniformNumber: string) => {
        const cadet = await prisma.cadet.findUniqueOrThrow({ where: { id: cadetId } });

        expect(cadet.comment).toContain('initial-comment');
        expect(cadet.comment).toContain('Marie Becker');
        expect(cadet.comment).toContain('Typ1');
        expect(cadet.comment).toContain(uniformNumber);
    }

    test.beforeEach(async ({ page, cadetId }) => {
        await page.goto(`/de/app/cadet/${cadetId}`);
    });
    test('return uniformItem Desktop', async ({ uniformComponent, messageComponent, cadetId, staticData: { ids } }) => {
        await test.step('open and validate modal', async () => {
            await uniformComponent.btn_uitem_withdraw(ids.uniformIds[0][84]).click();
            await expect(messageComponent.div_popup).toBeVisible();

            await Promise.all([
                expect.soft(messageComponent.div_header).toHaveText(t.modals.messageModal.uniform.return.header),
                expect.soft(messageComponent.div_message).toBeVisible(),
                expect.soft(messageComponent.div_icon.locator('svg[data-icon="triangle-exclamation"]')).toBeVisible(),
            ]);
        });
        await test.step('return and verify ui', async () => {
            await messageComponent.btn_save.click();
            await expect(messageComponent.div_popup).toBeHidden();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][84])).toBeHidden();
        });
        await test.step('verify db', async () => {
            await dbReturnedCheck(ids.uniformIds[0][84], cadetId, new Date('2023-08-16T00:00:00.000Z'));
        });
    });
    test('return uniformItem mobile', async ({ page, uniformComponent, messageComponent, cadetId, staticData: { ids } }) => {
        await page.setViewportSize(viewports.xs);

        await test.step('open modal', async () => {
            await uniformComponent.btn_uitem_menu(ids.uniformIds[0][84]).click();
            await uniformComponent.btn_uitem_menu_withdraw(ids.uniformIds[0][84]).click();
            await expect(messageComponent.div_popup).toBeVisible();
        });
        await test.step('return and verify ui', async () => {
            await messageComponent.btn_save.click();
            await expect(messageComponent.div_popup).toBeHidden();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][84])).toBeHidden();
        });
        await test.step('verify db', async () => {
            await dbReturnedCheck(ids.uniformIds[0][84], cadetId, new Date('2023-08-16T00:00:00.000Z'));
        });
    });

    test('Switch UniformItem without errors', async ({ uniformComponent, page, cadetId, staticData: { ids } }) => {
        const div_popup = page.getByRole("dialog");
        const txt_autocomplete = div_popup.getByRole('textbox', { name: t.cadetDetailPage.issueModal["input.label"] });
        const btn_save = div_popup.getByRole("button", { name: t.cadetDetailPage.issueModal["button.replace"] });

        await test.step('verify startData', async () => {
            await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toHaveText(`(3 ${t.common.of} 3)`);
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][11])).toBeHidden();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][84])).toBeVisible();
        });

        await test.step('issue uniformItem and validate Modal', async () => {
            await uniformComponent.btn_uitem_switch(ids.uniformIds[0][84]).click();

            await expect(div_popup).toBeVisible();
            await expect(div_popup.getByRole("heading")).toHaveText(`Typ1-1184 ersetzen`);


            await expect(txt_autocomplete).toBeVisible();
            await txt_autocomplete.click();
            await expect(div_popup.getByRole("option").nth(0)).toBeVisible(); // waiting till options are loaded

            await txt_autocomplete.fill('1111');
            await expect(txt_autocomplete).toHaveValue('1111');
            await expect(btn_save).toBeEnabled();
            await btn_save.click();
        });

        await test.step('verify ui', async () => {
            await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toHaveText(`(3 ${t.common.of} 3)`);
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][11])).toBeVisible();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][84])).toBeHidden();
        });
        await test.step('verify db', async () => {
            await Promise.all([
                dbIssuedAmountCheck(cadetId, 6),
                dbIssuedItemCheck(ids.uniformIds[0][11], cadetId),
                dbReturnedCheck(ids.uniformIds[0][84], cadetId, new Date('2023-08-16T00:00:00.000Z')),
            ]);
        });
    });
    test('Issue UniformItem without errors', async ({ uniformComponent, page, cadetId, staticData: { ids } }) => {
        const div_popup = page.getByRole("dialog");
        const txt_autocomplete = div_popup.getByRole('textbox', { name: t.cadetDetailPage.issueModal["input.label"] });
        const btn_save = div_popup.getByRole("button", { name: t.cadetDetailPage.issueModal["button.issue"] });

        await test.step('issue uniformItem', async () => {
            await uniformComponent.btn_utype_issue(ids.uniformTypeIds[0]).click();

            await expect(div_popup).toBeVisible();
            await expect(div_popup.getByRole("heading")).toHaveText(`Typ1 ausgeben`);


            await expect(txt_autocomplete).toBeVisible();
            await txt_autocomplete.click();
            await expect(div_popup.getByRole("option").nth(0)).toBeVisible(); // waiting till options are loaded

            await txt_autocomplete.fill('1111');
            await expect(txt_autocomplete).toHaveValue('1111');
            await expect(btn_save).toBeEnabled();
            await btn_save.click();
        });
        await test.step('verify ui', async () => {
            await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toHaveText(`(4 ${t.common.of} 3)`);
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][11])).toBeVisible();
        });
        await test.step('verify db', async () => {
            await Promise.all([
                dbIssuedAmountCheck(cadetId, 7),
                dbIssuedItemCheck(ids.uniformIds[0][11], cadetId),
            ]);
        });
    });

    test("Issue issued uniform item", async ({ uniformComponent, page, cadetId, staticData: { ids } }) => {
        const div_popup = page.getByRole("dialog");
        const txt_autocomplete = div_popup.getByRole('textbox', { name: t.cadetDetailPage.issueModal["input.label"] });
        const btn_save = div_popup.getByRole("button", { name: t.cadetDetailPage.issueModal["button.changeOwner"] });

        await test.step('issue UniformItem', async () => {
            await uniformComponent.btn_utype_issue(ids.uniformTypeIds[0]).click();
            await expect(txt_autocomplete).toBeVisible();
            await txt_autocomplete.click();
            await expect(div_popup.getByRole("option").nth(0)).toBeVisible(); // waiting till options are loaded

            await txt_autocomplete.fill('1100');
            await expect(txt_autocomplete).toHaveValue('1100');
            await expect(btn_save).toBeEnabled();
            await btn_save.click();
        });
        await test.step('verify ui', async () => {
            await expect(div_popup).toBeHidden();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][0])).toBeVisible();
        });
        await test.step('verify db', async () => {
            await Promise.all([
                dbIssuedAmountCheck(cadetId, 7),
                dbIssuedItemCheck(ids.uniformIds[0][0], cadetId),
                dbReturnedCheck(ids.uniformIds[0][0], ids.cadetIds[5], new Date('2023-08-13T00:00:00.000Z')),
                dbCommentCheck(ids.cadetIds[5], '1100'),
            ]);
        });
    });

    test('Check UniformItem issued: open Cadet', async ({ page, uniformComponent, staticData: { ids } }) => {
        let page2: Page, cadet2Page: CadetDetailPage;
        const div_popup = page.getByRole("dialog");
        const txt_autocomplete = div_popup.getByRole('textbox', { name: t.cadetDetailPage.issueModal["input.label"] });
        const lnk_openCadet = div_popup.getByRole("link", { name: 'Maik Finkel' });

        await test.step('open and fill modal', async () => {
            await uniformComponent.btn_utype_issue(ids.uniformTypeIds[0]).click();
            await expect(txt_autocomplete).toBeVisible();
            await txt_autocomplete.click();
            await expect(div_popup.getByRole("option").nth(0)).toBeVisible(); // waiting till options are loaded

            await txt_autocomplete.fill('1100');
            await expect(txt_autocomplete).toHaveValue('1100');
        });
        await test.step('issued exceptionHandling & opening cadet', async () => {
            await expect(lnk_openCadet).toBeVisible();
            const page2Promise = page.waitForEvent('popup');
            await lnk_openCadet.click();
            page2 = await page2Promise;
            cadet2Page = new CadetDetailPage(page2);
        });
        await test.step('verify opendCadetPage', async () => {
            await expect.soft(cadet2Page.page).toHaveURL(`/de/app/cadet/${ids.cadetIds[5]}`);
            await expect.soft(cadet2Page.divPageHeader).toContainText('Maik Finkel');
        });
    });
});
