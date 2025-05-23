import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";
import { Page, expect } from "playwright/test";
import t from "../../../../public/locales/de";
import { adminTest } from "../../../_playwrightConfig/setup";
import { viewports } from "../../../_playwrightConfig/global/helper";
import { numberValidationTests } from "../../../_playwrightConfig/global/testSets";
import { CadetDetailPage } from "../../../_playwrightConfig/pages/cadet/cadetDetail.page";
import { CadetUniformComponent } from "../../../_playwrightConfig/pages/cadet/cadetUniform.component";
import { MessagePopupComponent } from "../../../_playwrightConfig/pages/popups/MessagePopup.component";
import { SimpleFormPopupComponent } from "../../../_playwrightConfig/pages/popups/SimpleFormPopup.component";

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
    test('E2E0239: return uniformItem Desktop', async ({ uniformComponent, messageComponent, cadetId, staticData: { ids } }) => {
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
    test('E2E0240: return uniformItem mobile', async ({ page, uniformComponent, messageComponent, cadetId, staticData: { ids } }) => {
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
    test('E2E0218: issue formvalidation', async ({ page, uniformComponent, issuePopupComponent, staticData: { ids } }) => {
        const testSets = numberValidationTests({ min: 0, max: 9999999, strict: false, testEmpty: true });

        for (const set of testSets) {
            await test.step(`testValue: "${set.testValue}"`, async () => {
                await test.step('relaod and open modal', async () => {
                    await page.reload();
                    await uniformComponent.btn_utype_issue(ids.uniformTypeIds[0]).click();
                    await expect(issuePopupComponent.div_popup).toBeVisible();
                });

                await test.step('trigger validation', async () => {
                    await issuePopupComponent.txt_input.fill(String(set.testValue));
                    await issuePopupComponent.btn_save.click();
                });

                await test.step('check validation', async () => {
                    if (set.valid) {
                        await expect.soft(issuePopupComponent.div_popup).toBeHidden();
                    } else {
                        await expect.soft(issuePopupComponent.div_popup).toBeVisible();
                        await expect.soft(issuePopupComponent.err_input).toBeVisible();
                    }
                });
            });
        }
    });
    test('E2E0219: Switch UniformItem without errors', async ({ uniformComponent, issuePopupComponent, cadetId, staticData: { ids } }) => {
        await test.step('verify startData', async () => {
            await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toHaveText(`(3 ${t.common.of} 3)`);
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][11])).toBeHidden();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][84])).toBeVisible();
        });

        await test.step('issue uniformItem and validate Modal', async () => {
            await uniformComponent.btn_uitem_switch(ids.uniformIds[0][84]).click();
            await expect(issuePopupComponent.div_popup).toBeVisible();
            await expect(issuePopupComponent.div_header).toHaveText(`Typ1 1184 austauschen`);

            await issuePopupComponent.txt_input.fill('1111');
            await issuePopupComponent.btn_save.click();
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
    test('E2E0220: Issue UniformItem without errors', async ({ uniformComponent, issuePopupComponent, cadetId, staticData: { ids } }) => {
        await test.step('verify startData', async () => {
            await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toHaveText(`(3 ${t.common.of} 3)`);
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][11])).toBeHidden();
        });
        await test.step('issue uniformItem', async () => {
            await uniformComponent.btn_utype_issue(ids.uniformTypeIds[0]).click();
            await expect(issuePopupComponent.div_popup).toBeVisible();
            await expect(issuePopupComponent.div_header).toHaveText(t.modals.messageModal.uniform.issue.header.replace('{type}', 'Typ1'));

            await issuePopupComponent.txt_input.fill('1111');
            await issuePopupComponent.btn_save.click();
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

    test('E2E0223: Switch UniformItem not existing', async ({ page, uniformComponent, issuePopupComponent, messageComponent, cadetId, staticData: { ids } }) => {
        await test.step('issue uniformItem', async () => {
            await uniformComponent.btn_uitem_switch(ids.uniformIds[0][84]).click();
            await issuePopupComponent.txt_input.fill('9999');
            await issuePopupComponent.btn_save.click();
        });
        await test.step('verify popup components', async () => {
            await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
            await messageComponent.btn_save.click();
        });
        await test.step('closePopup | verify not issued', async () => {
            await expect.soft(messageComponent.div_popup).toBeHidden();
            await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toHaveText(`(3 ${t.common.of} 3)`);
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][84])).toBeHidden();
            await expect.soft(page.getByText('9999')).toBeVisible();
        });
        await test.step('verify db', async () => {
            await dbIssuedAmountCheck(cadetId, 6);
            await dbReturnedCheck(ids.uniformIds[0][84], cadetId, new Date('2023-08-16T00:00:00.000Z'));

            const date = new Date();
            date.setUTCHours(0, 0, 0, 0);
            const uniform = await prisma.uniform.findFirst({
                where: {
                    fk_uniformType: ids.uniformTypeIds[0],
                    number: 9999
                },
                include: { issuedEntries: true }
            });

            expect(uniform).not.toBeNull();
            expect(uniform).toEqual(expect.objectContaining({
                id: expect.stringMatching(uuidValidationPattern),
                fk_generation: null,
                fk_size: null,
                comment: null,
                active: true,
                recdelete: null,
                recdeleteUser: null,
                issuedEntries: [
                    expect.objectContaining({
                        id: expect.stringMatching(uuidValidationPattern),
                        dateIssued: date,
                        dateReturned: null,
                        fk_cadet: cadetId,
                    }),
                ],
            }));
        });
    });

    test('E2E0224: Issue UniformItem not existing', async ({ page, uniformComponent, issuePopupComponent, messageComponent, cadetId, staticData: { ids } }) => {
        await test.step('issue uniformItem', async () => {
            await uniformComponent.btn_utype_issue(ids.uniformTypeIds[0]).click();
            await issuePopupComponent.txt_input.fill('9999');
            await issuePopupComponent.btn_save.click();
        });
        await test.step('verify errorPopup and submit', async () => {
            await expect(messageComponent.div_popup).toBeVisible();
            await Promise.all([
                expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible(),
                expect.soft(messageComponent.div_header).toHaveAttribute("class", /bg-danger/),
                expect.soft(messageComponent.div_header).toHaveText(t.modals.messageModal.uniform.nullValueException.header),
                expect.soft(messageComponent.btn_save).toHaveText(t.modals.messageModal.uniform.nullValueException.createOption),
                expect.soft(messageComponent.div_message).toContainText(/9999/),
            ]);
            await messageComponent.btn_save.click();
        });
        await test.step('verify ui', async () => {
            await expect.soft(messageComponent.div_popup).toBeHidden();
            await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toHaveText(`(4 ${t.common.of} 3)`);
            await expect.soft(page.getByText('9999')).toBeVisible();
        });
        await test.step('verify db', async () => {
            await dbIssuedAmountCheck(cadetId, 7);

            const date = new Date();
            date.setUTCHours(0, 0, 0, 0);
            const uniform = await prisma.uniform.findFirst({
                where: {
                    fk_uniformType: ids.uniformTypeIds[0],
                    number: 9999
                },
                include: { issuedEntries: true }
            });

            expect(uniform).not.toBeNull();
            expect(uniform).toEqual(expect.objectContaining({
                id: expect.stringMatching(uuidValidationPattern),
                fk_generation: null,
                fk_size: null,
                comment: null,
                active: true,
                recdelete: null,
                recdeleteUser: null,
                issuedEntries: [
                    expect.objectContaining({
                        id: expect.stringMatching(uuidValidationPattern),
                        dateIssued: date,
                        dateReturned: null,
                        fk_cadet: cadetId,
                    }),
                ],
            }));
        });
    });

    test('E2E0227: Switch UniformItem passive', async ({ uniformComponent, issuePopupComponent, messageComponent, cadetId, staticData: { ids } }) => {
        await test.step('issue uniformItem', async () => {
            await uniformComponent.btn_uitem_switch(ids.uniformIds[0][84]).click();
            await issuePopupComponent.txt_input.fill('1105');
            await issuePopupComponent.btn_save.click();
        });
        await test.step('submit popup', async () => {
            await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
            await messageComponent.btn_save.click();
        });
        await test.step('verify not issued', async () => {
            await expect.soft(messageComponent.div_popup).toBeHidden();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][5])).toBeVisible();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][84])).toBeHidden();
            await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toHaveText(`(3 ${t.common.of} 3)`);
        });
        await test.step('verify db', async () => {
            await dbIssuedAmountCheck(cadetId, 6);
            await dbIssuedItemCheck(ids.uniformIds[0][5], cadetId)
            await dbReturnedCheck(ids.uniformIds[0][84], cadetId, new Date('2023-08-16T00:00:00.000Z'));
        });
    });
    test('E2E0228: Issue UniformItem passive', async ({ uniformComponent, issuePopupComponent, messageComponent, cadetId, staticData: { ids } }) => {
        await test.step('issue uniformItem', async () => {
            await uniformComponent.btn_utype_issue(ids.uniformTypeIds[0]).click();
            await issuePopupComponent.txt_input.fill('1105');
            await issuePopupComponent.btn_save.click();
        });
        await test.step('verify errorPopup and submit', async () => {
            await expect(messageComponent.div_popup).toBeVisible();
            await Promise.all([
                expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible(),
                expect.soft(messageComponent.div_header).toHaveAttribute("class", /bg-danger/),
                expect.soft(messageComponent.div_header).toHaveText(t.modals.messageModal.uniform.inactiveException.header),
                expect.soft(messageComponent.div_message).toContainText(/1105/),
            ]);
            await messageComponent.btn_save.click();
        });
        await test.step('verify ui', async () => {
            await expect.soft(messageComponent.div_popup).toBeHidden();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][5])).toBeVisible();
            await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toHaveText(`(4 ${t.common.of} 3)`);
        });
        await test.step('verify db', async () => {
            await Promise.all([
                dbIssuedAmountCheck(cadetId, 7),
                dbIssuedItemCheck(ids.uniformIds[0][5], cadetId),
            ]);
        });
    });
    test('Check UniformItem issued: open Cadet', async ({ page, uniformComponent, issuePopupComponent, messageComponent, staticData: { ids } }) => {
        let page2: Page, cadet2Page: CadetDetailPage;

        await test.step('issue UniformItem', async () => {
            await uniformComponent.btn_utype_issue(ids.uniformTypeIds[0]).click();
            await issuePopupComponent.txt_input.fill('1100');
            await issuePopupComponent.btn_save.click();
        });
        await test.step('issued exceptionHandling & opening cadet', async () => {
            await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
            const page2Promise = page.waitForEvent('popup');
            await messageComponent.div_popup.getByTestId('btn_openCadet').click();
            page2 = await page2Promise;
            cadet2Page = new CadetDetailPage(page2);
        });
        await test.step('verify opendCadetPage', async () => {
            await expect.soft(cadet2Page.page).toHaveURL(`/de/app/cadet/${ids.cadetIds[5]}`);
            await expect.soft(cadet2Page.divPageHeader).toContainText('Maik Finkel');
        });
    });

    test('E2E0232: Issue UniformItem issued', async ({ uniformComponent, issuePopupComponent, messageComponent, cadetId, staticData: { ids } }) => {
        await test.step('issue UniformItem', async () => {
            await uniformComponent.btn_utype_issue(ids.uniformTypeIds[0]).click();
            await issuePopupComponent.txt_input.fill('1100');
            await issuePopupComponent.btn_save.click();
        });
        await test.step('verify errorPopup and submit', async () => {
            await expect(messageComponent.div_popup).toBeVisible();
            await Promise.all([
                expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible(),
                expect.soft(messageComponent.div_header).toHaveAttribute("class", /bg-danger/),
                expect.soft(messageComponent.div_header).toHaveText(t.modals.messageModal.uniform.issuedException.header),
                expect.soft(messageComponent.div_message).toContainText('Maik Finkel'),
                expect.soft(messageComponent.div_message).toContainText('1100'),
                expect.soft(messageComponent.div_popup.getByTestId('btn_openCadet')).toBeVisible(),
            ]);
            await messageComponent.btn_save.click();
        });
        await test.step('verify ui', async () => {
            await expect.soft(messageComponent.div_popup).toBeHidden();
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
    test('E2E0233: Switch UniformItem issued', async ({ uniformComponent, issuePopupComponent, messageComponent, cadetId, staticData: { ids } }) => {
        await test.step('issue UniformItem', async () => {
            await uniformComponent.btn_uitem_switch(ids.uniformIds[0][84]).click();
            await issuePopupComponent.txt_input.fill('1100');
            await issuePopupComponent.btn_save.click();
        });
        await test.step('submit errorPopup', async () => {
            await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
            await messageComponent.btn_save.click();
        });

        await test.step('verify ui', async () => {
            await expect.soft(messageComponent.div_popup).toBeHidden();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][0])).toBeVisible();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][84])).toBeHidden();
        });

        await test.step('verify db', async () => {
            await Promise.all([
                dbIssuedAmountCheck(cadetId, 6),
                dbIssuedItemCheck(ids.uniformIds[0][0], cadetId),
                dbReturnedCheck(ids.uniformIds[0][0], ids.cadetIds[5], new Date('2023-08-13T00:00:00.000Z')),
                dbCommentCheck(ids.cadetIds[5], '1100'),
            ]);
        });
    });

    test('E2E0234: multiException-Handling: Issue with passive and issued', async ({ uniformComponent, issuePopupComponent, messageComponent, cadetId, staticData: { ids } }) => {
        await test.step('issue', async () => {
            await uniformComponent.btn_utype_issue(ids.uniformTypeIds[0]).click();
            await issuePopupComponent.txt_input.fill('1121');
            await issuePopupComponent.btn_save.click();
        });
        await test.step('passive exceptionHandling', async () => {
            await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
            await expect.soft(messageComponent.div_header).toHaveText(t.modals.messageModal.uniform.inactiveException.header);
            await messageComponent.btn_save.click();
        });
        await test.step('issued exceptionHandling', async () => {
            await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
            await expect.soft(messageComponent.div_header).toHaveText(t.modals.messageModal.uniform.issuedException.header);
            await messageComponent.btn_save.click();
        });
        await test.step('verify ui', async () => {
            await expect.soft(messageComponent.div_popup).toBeHidden();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][21])).toBeVisible();
        });
        await test.step('verify db', async () => {
            await Promise.all([
                dbIssuedAmountCheck(cadetId, 7),
                dbIssuedItemCheck(ids.uniformIds[0][21], cadetId),
                dbReturnedCheck(ids.uniformIds[0][21], ids.cadetIds[4], new Date('2023-08-13T00:00:00.000Z')),
                dbCommentCheck(ids.cadetIds[4], '1121'),
            ]);
        });
    });

    test('E2E0235: multiException-Handling: Switch with passive and issued', async ({ uniformComponent, issuePopupComponent, messageComponent, cadetId, staticData: { ids } }) => {
        await test.step('switch', async () => {
            await uniformComponent.btn_uitem_switch(ids.uniformIds[0][84]).click();
            await issuePopupComponent.txt_input.fill('1121');
            await issuePopupComponent.btn_save.click();
        });
        await test.step('passive exceptionHandling', async () => {
            await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
            await expect.soft(messageComponent.div_header).toHaveText(t.modals.messageModal.uniform.inactiveException.header);
            await messageComponent.btn_save.click();
        });
        await test.step('issued exceptionHandling', async () => {
            await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
            await expect.soft(messageComponent.div_header).toHaveText(t.modals.messageModal.uniform.issuedException.header);
            await messageComponent.btn_save.click();
        });
        await test.step('verify ui', async () => {
            await expect.soft(messageComponent.div_popup).toBeHidden();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][21])).toBeVisible();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][84])).toBeHidden();
        });
        await test.step('verify db', async () => {
            await Promise.all([
                dbIssuedAmountCheck(cadetId, 6),
                dbIssuedItemCheck(ids.uniformIds[0][21], cadetId),
                dbReturnedCheck(ids.uniformIds[0][21], ids.cadetIds[4], new Date('2023-08-13T00:00:00.000Z')),
                dbReturnedCheck(ids.uniformIds[0][84], cadetId, new Date('2023-08-16T00:00:00.000Z')),
                dbCommentCheck(ids.cadetIds[4], '1121'),
            ]);
        });
    });
    test('E2E0236: validate mobile switch button', async ({ page, uniformComponent, issuePopupComponent, staticData: { ids } }) => {
        await page.setViewportSize(viewports.xs);

        await test.step('verify startData', async () => {
            await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toHaveText(`(3 ${t.common.of} 3)`);
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][11])).toBeHidden();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][84])).toBeVisible();
        });

        await test.step('issue uniformItem', async () => {
            await uniformComponent.btn_uitem_menu(ids.uniformIds[0][84]).click();
            await uniformComponent.btn_uitem_menu_switch(ids.uniformIds[0][84]).click();

            await issuePopupComponent.txt_input.fill('1111');
            await issuePopupComponent.btn_save.click();
        });

        await test.step('verify issued', async () => {
            await expect.soft(uniformComponent.div_utype_amount(ids.uniformTypeIds[0])).toHaveText(`(3 ${t.common.of} 3)`);
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][11])).toBeVisible();
            await expect.soft(uniformComponent.div_uitem(ids.uniformIds[0][84])).toBeHidden();
        });
    });
});
