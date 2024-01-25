import { Page, expect, test } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { CadetDataComponent } from "../../../pages/cadet/cadetData.component";
import { CadetDetailPage } from "../../../pages/cadet/cadetDetail.page";
import { CadetUniformComponent } from "../../../pages/cadet/cadetUniform.component";
import { MessagePopupComponent } from "../../../pages/popups/MessagePopup.component";
import { SimpleFormPopupComponent } from "../../../pages/popups/SimpleFormPopup.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { testUniformTypes } from "../../../testData/staticData";
import t from "../../../../public/locales/de";

test.use({ storageState: adminAuthFile });
test.describe('', () => {
    const testData = {
        normal: {
            cadetId: '0d06427b-3c12-11ee-8084-0068eb8ba754',
            cadetNamePattern: /Marie Ackerman/,
            uTypeId: '036ff236-3b83-11ee-ab4b-0068eb8ba754',
            typePattern: /Typ1/,
            oldUniformId: '45f35815-3c0d-11ee-8084-0068eb8ba754',
            newUniformId: '45f31751-3c0d-11ee-8084-0068eb8ba754',
            newUniformNumber: '1111',
            oldUniformNumber: '1184',
        },
        notExisting: {
            uniformNumber: '9999',
            numberPattern: /9999/,
        },
        passive: {
            uniformId: '45f30af6-3c0d-11ee-8084-0068eb8ba754',
            uniformNumber: '1105',
            numberPattern: /1105/,
        },
        issued: {
            numberPattern: /1100/,
            uniformId: '45f2fdcc-3c0d-11ee-8084-0068eb8ba754',
            uniformNumber: '1100',
            ownerId: "db998c2f-3c11-11ee-8084-0068eb8ba754",
            ownerNamePattern: /Maik Finkel/,
        },
        passiveAndIssued: {
            uniformId: '45f31e47-3c0d-11ee-8084-0068eb8ba754',
            uniformNumber: '1121',
            numberPatter: /1121/,
            ownerId: 'd468ac3c-3c11-11ee-8084-0068eb8ba754',
        }
    }
    let page: Page;
    let uniformComponent: CadetUniformComponent;
    let cadetComponent: CadetDataComponent;
    let messageComponent: MessagePopupComponent;
    let issuePopupComponent: SimpleFormPopupComponent;

    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();
        uniformComponent = new CadetUniformComponent(page);
        cadetComponent = new CadetDataComponent(page);
        messageComponent = new MessagePopupComponent(page);
        issuePopupComponent = new SimpleFormPopupComponent(page);
    });
    test.afterAll(async () => page.close());
    test.beforeEach(async () => {
        await cleanupData();
        await page.reload();
    });

    test('validate Content of IssueUniform Modal', async () => {
        const uType = testUniformTypes.find(t => t.id == testData.normal.uTypeId);

        await test.step('Validate Popup issue', async () => {
            await test.step('go to cadet and open modal', async () => {
                await page.goto(`/de/app/cadet/${testData.normal.cadetId}`);
                await uniformComponent.btn_utype_issue(testData.normal.uTypeId).click();
                await expect(issuePopupComponent.div_popup).toBeVisible();
            });

            await test.step('validate modal', async () => {
                await expect.soft(issuePopupComponent.div_header).toHaveText(t.modals.messageModal.uniform.issue.header.replace('{type}', uType?.name as string));
                await expect.soft(issuePopupComponent.btn_cancel).toBeVisible();
                await expect.soft(issuePopupComponent.btn_save).toBeVisible();
                await expect.soft(issuePopupComponent.txt_input).toBeVisible();
            });
        });
        await test.step('Validate Popup replace', async () => {
            await test.step('reload page and open modal', async () => {
                await page.reload();
                await uniformComponent.btn_uitem_switch(testData.normal.oldUniformId).click();
                await expect(issuePopupComponent.div_popup).toBeVisible();
            });
            await test.step('validate modal', async () => {
                await expect.soft(issuePopupComponent.div_header).toHaveText(`${uType?.name} ${testData.normal.oldUniformNumber} austauschen`);
            });
        });
    });

    test('Check Formvalidation of IssueUniform Modal: ', async () => {
        await page.goto(`/de/app/cadet/${testData.normal.cadetId}`);
        const testValues = ['', '-10', '160000000', 'Test string', '1.25'];

        for (const value of testValues) {
            await test.step(`testValue: "${value}"`, async () => {
                await test.step('relaod and open modal', async () => {
                    await page.reload();
                    await uniformComponent.btn_utype_issue(testData.normal.uTypeId).click();
                    await expect(issuePopupComponent.div_popup).toBeVisible();
                });

                await test.step('trigger validation', async () => {
                    await issuePopupComponent.txt_input.fill(value);
                    await issuePopupComponent.btn_save.click();
                });

                await test.step('check validation', async () => {
                    await expect.soft(issuePopupComponent.div_popup).toBeVisible();
                    await expect.soft(issuePopupComponent.err_input).toBeVisible();
                });
            });
        }
    });

    test.describe('Actions without errors', () => {
        test.beforeEach(async () => {
            await page.goto(`/de/app/cadet/${testData.normal.cadetId}`);
        });

        test('Switch UniformItem', async () => {
            await test.step('verify startData', async () => {
                await expect.soft(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(3 ${t.common.of} 3)`);
                await expect.soft(uniformComponent.div_uitem(testData.normal.newUniformId)).not.toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.normal.oldUniformId)).toBeVisible();
            });

            await test.step('issue uniformItem', async () => {
                await uniformComponent.btn_uitem_switch(testData.normal.oldUniformId).click();
                await issuePopupComponent.txt_input.fill(testData.normal.newUniformNumber);
                await issuePopupComponent.btn_save.click();
            });

            await test.step('verify issued', async () => {
                await expect.soft(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(3 ${t.common.of} 3)`);
                await expect.soft(uniformComponent.div_uitem(testData.normal.newUniformId)).toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.normal.oldUniformId)).not.toBeVisible();
            });
        })
        test('Issue UniformItem', async () => {
            await test.step('verify startData', async () => {
                await expect.soft(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(3 ${t.common.of} 3)`);
                await expect.soft(uniformComponent.div_uitem(testData.normal.newUniformId)).not.toBeVisible();
            });
            await test.step('issue uniformItem', async () => {
                await uniformComponent.btn_utype_issue(testData.normal.uTypeId).click();
                await issuePopupComponent.txt_input.fill(testData.normal.newUniformNumber);
                await issuePopupComponent.btn_save.click();
            });
            await test.step('verify issued', async () => {
                await expect.soft(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(4 ${t.common.of} 3)`);
                await expect.soft(uniformComponent.div_uitem(testData.normal.newUniformId)).toBeVisible();
            });
        });
    });

    test.describe('Issue UniformItem not existing', () => {
        test.beforeEach(async () => {
            await test.step('verify startData', async () => {
                await page.goto(`/de/app/cadet/${testData.normal.cadetId}`);
                await expect(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(3 ${t.common.of} 3)`);
                await expect(page.getByText(testData.notExisting.uniformNumber)).not.toBeVisible();
            });
        });

        test('Validate erorrMessage Popup and close action', async () => {
            await test.step('issue uniformItem', async () => {
                await uniformComponent.btn_utype_issue(testData.normal.uTypeId).click();
                await issuePopupComponent.txt_input.fill(testData.notExisting.uniformNumber);
                await issuePopupComponent.btn_save.click();
            });
            await test.step('verify popup components', async () => {
                await Promise.all([
                    expect.soft(messageComponent.div_popup).toBeVisible(),
                    expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible(),
                    expect.soft(messageComponent.div_header).toHaveAttribute("class", /bg-danger/),
                    expect.soft(messageComponent.div_header).toHaveText(t.modals.messageModal.uniform.nullValueException.header),
                    expect.soft(messageComponent.btn_save).toHaveText(t.modals.messageModal.uniform.nullValueException.createOption),
                    expect.soft(messageComponent.div_message).toHaveText(testData.notExisting.numberPattern),
                    expect.soft(messageComponent.btn_cancel).toBeVisible(),
                    expect.soft(messageComponent.btn_close).toBeVisible(),
                    expect.soft(messageComponent.btn_save).toBeVisible(),
                ]);
            });
            await test.step('closePopup | verify not issued', async () => {
                await messageComponent.btn_close.click();
                await expect.soft(messageComponent.div_popup).not.toBeVisible();
                await expect.soft(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(3 ${t.common.of} 3)`);
                await expect.soft(page.getByText(testData.notExisting.uniformNumber)).not.toBeVisible();
            });
        });

        test('Check cancel Function', async () => {
            await test.step('issue uniformItem', async () => {
                await uniformComponent.btn_utype_issue(testData.normal.uTypeId).click();
                await issuePopupComponent.txt_input.fill(testData.notExisting.uniformNumber);
                await issuePopupComponent.btn_save.click();
            });
            await test.step('verify popup components', async () => {
                await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
                await messageComponent.btn_cancel.click();
            });
            await test.step('closePopup | verify not issued', async () => {
                await expect.soft(messageComponent.div_popup).not.toBeVisible();
                await expect.soft(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(3 ${t.common.of} 3)`);
                await expect.soft(page.getByText(testData.notExisting.uniformNumber)).not.toBeVisible();
            });
        });
        test('Check with switch function', async () => {
            await test.step('issue uniformItem', async () => {
                await uniformComponent.btn_uitem_switch(testData.normal.oldUniformId).click();
                await issuePopupComponent.txt_input.fill(testData.notExisting.uniformNumber);
                await issuePopupComponent.btn_save.click();
            });
            await test.step('verify popup components', async () => {
                await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
                await messageComponent.btn_save.click();
            });
            await test.step('closePopup | verify not issued', async () => {
                await expect.soft(messageComponent.div_popup).not.toBeVisible();
                await expect.soft(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(3 ${t.common.of} 3)`);
                await expect.soft(uniformComponent.div_uitem(testData.normal.oldUniformId)).not.toBeVisible();
                await expect.soft(page.getByText(testData.notExisting.uniformNumber)).toBeVisible();
            });
        });
        test('Check save Function', async () => {
            await test.step('issue uniformItem', async () => {
                await uniformComponent.btn_utype_issue(testData.normal.uTypeId).click();
                await issuePopupComponent.txt_input.fill(testData.notExisting.uniformNumber);
                await issuePopupComponent.btn_save.click();
            });
            await test.step('verify popup components', async () => {
                await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
                await messageComponent.btn_save.click();
            });
            await test.step('closePopup | verify not issued', async () => {
                await expect.soft(messageComponent.div_popup).not.toBeVisible();
                await expect.soft(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(4 ${t.common.of} 3)`);
                await expect.soft(page.getByText(testData.notExisting.uniformNumber)).toBeVisible();
            });
        });
    });

    test.describe('Issue UniformItem passiv', () => {
        test.beforeEach(async () => {
            await page.goto(`/de/app/cadet/${testData.normal.cadetId}`);

            await test.step('verify startData', async () => {
                await expect.soft(uniformComponent.div_uitem(testData.passive.uniformId)).not.toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.normal.oldUniformId)).toBeVisible();
                await expect.soft(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(3 ${t.common.of} 3)`);
            });
        });

        test('Validate erorrMessage Popup', async () => {
            await test.step('issue uniformItem', async () => {
                await uniformComponent.btn_utype_issue(testData.normal.uTypeId).click();
                await issuePopupComponent.txt_input.fill(testData.passive.uniformNumber);
                await issuePopupComponent.btn_save.click();
            });
            await test.step('verify popup component', async () => {
                await Promise.all([
                    expect.soft(messageComponent.div_popup).toBeVisible(),
                    expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible(),
                    expect.soft(messageComponent.div_header).toHaveAttribute("class", /bg-danger/),
                    expect.soft(messageComponent.div_header).toHaveText(t.modals.messageModal.uniform.inactiveException.header),
                    expect.soft(messageComponent.div_message).toHaveText(testData.passive.numberPattern),
                    expect.soft(messageComponent.btn_cancel).toBeVisible(),
                    expect.soft(messageComponent.btn_close).toBeVisible(),
                    expect.soft(messageComponent.btn_save).toBeVisible(),
                ]);
            });
            await test.step('closePopup | verify not issued', async () => {
                await messageComponent.btn_close.click();
                await expect.soft(messageComponent.div_popup).not.toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.passive.uniformId)).not.toBeVisible();
                await expect.soft(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(3 ${t.common.of} 3)`);
            });
        });
        test('Check cancel Function', async () => {
            await test.step('issue uniformItem', async () => {
                await uniformComponent.btn_utype_issue(testData.normal.uTypeId).click();
                await issuePopupComponent.txt_input.fill(testData.passive.uniformNumber);
                await issuePopupComponent.btn_save.click();
            });
            await test.step('passive exceptionHandling', async () => {
                await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
                await messageComponent.btn_cancel.click();
            });
            await test.step('verify not issued', async () => {
                await expect.soft(messageComponent.div_popup).not.toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.passive.uniformId)).not.toBeVisible();
                await expect.soft(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(3 ${t.common.of} 3)`);
            });
        });
        test('Check with switch function', async () => {
            await test.step('issue uniformItem', async () => {
                await uniformComponent.btn_uitem_switch(testData.normal.oldUniformId).click();
                await issuePopupComponent.txt_input.fill(testData.passive.uniformNumber);
                await issuePopupComponent.btn_save.click();
            });
            await test.step('passive exceptionHandling', async () => {
                await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
                await messageComponent.btn_save.click();
            });
            await test.step('verify not issued', async () => {
                await expect.soft(messageComponent.div_popup).not.toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.passive.uniformId)).toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.normal.oldUniformId)).not.toBeVisible();
                await expect.soft(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(3 ${t.common.of} 3)`);
            });
        });
        test('Check save Function', async () => {
            await test.step('issue uniformItem', async () => {
                await uniformComponent.btn_utype_issue(testData.normal.uTypeId).click();
                await issuePopupComponent.txt_input.fill(testData.passive.uniformNumber);
                await issuePopupComponent.btn_save.click();
            });
            await test.step('passive exceptionHandling', async () => {
                await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
                await messageComponent.btn_save.click();
            });
            await test.step('verify not issued', async () => {
                await expect.soft(messageComponent.div_popup).not.toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.passive.uniformId)).toBeVisible();
                await expect.soft(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(4 ${t.common.of} 3)`);
            });
        });
    });

    test.describe('Issue UniformItem issued', () => {
        test.beforeEach(async ({ }) => {
            await page.goto(`/de/app/cadet/${testData.normal.cadetId}`);
        });

        test('Validate erorrMessage Popup', async () => {
            await test.step('issue UniformItem', async () => {
                await uniformComponent.btn_utype_issue(testData.normal.uTypeId).click();
                await issuePopupComponent.txt_input.fill(testData.issued.uniformNumber);
                await issuePopupComponent.btn_save.click();
            });

            await test.step('verify components in popup', async () => {
                await Promise.all([
                    expect.soft(messageComponent.div_popup).toBeVisible(),
                    expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible(),
                    expect.soft(messageComponent.div_header).toHaveAttribute("class", /bg-danger/),
                    expect.soft(messageComponent.div_header).toHaveText(t.modals.messageModal.uniform.issuedException.header),
                    expect.soft(messageComponent.div_message).toHaveText(testData.issued.ownerNamePattern),
                    expect.soft(messageComponent.btn_cancel).toBeVisible(),
                    expect.soft(messageComponent.btn_close).toBeVisible(),
                    expect.soft(messageComponent.btn_save).toBeVisible(),
                    expect.soft(messageComponent.div_popup.getByTestId('btn_openCadet')).toBeVisible(),
                ]);
            });

            await test.step('closePopup | verify not issued', async () => {
                await messageComponent.btn_close.click();
                await expect.soft(messageComponent.div_popup).not.toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.issued.uniformId)).not.toBeVisible();
            });
        });
        test('Check cancel Function', async () => {
            await test.step('issue UniformItem', async () => {
                await uniformComponent.btn_utype_issue(testData.normal.uTypeId).click();
                await issuePopupComponent.txt_input.fill(testData.issued.uniformNumber);
                await issuePopupComponent.btn_save.click();
            });

            await test.step('issued exceptionHandling and cancel', async () => {
                await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
                await messageComponent.btn_cancel.click();
            });

            await test.step('verify not issued', async () => {
                await expect.soft(messageComponent.div_popup).not.toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.issued.uniformId)).not.toBeVisible();
            });
        });
        test('Check openCadet function', async () => {
            let page2: Page, cadet2Page: CadetDetailPage;

            await test.step('issue UniformItem', async () => {
                await uniformComponent.btn_utype_issue(testData.normal.uTypeId).click();
                await issuePopupComponent.txt_input.fill(testData.issued.uniformNumber);
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
                await expect.soft(cadet2Page.page).toHaveURL(`/de/app/cadet/${testData.issued.ownerId}`);
                await expect.soft(cadet2Page.divPageHeader).toContainText(testData.issued.ownerNamePattern);
            });
        });
        test('Check save function', async () => {
            await test.step('issue UniformItem', async () => {
                await uniformComponent.btn_utype_issue(testData.normal.uTypeId).click();
                await issuePopupComponent.txt_input.fill(testData.issued.uniformNumber);
                await issuePopupComponent.btn_save.click();
            });
            await test.step('issued exceptionHandling', async () => {
                await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
                await messageComponent.btn_save.click();
            });
            await test.step('verify issued', async () => {
                await expect.soft(messageComponent.div_popup).not.toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.issued.uniformId)).toBeVisible();
            });
            await test.step('verify comment created', async () => {
                await page.goto(`/de/app/cadet/${testData.issued.ownerId}`);
                await expect.soft(cadetComponent.txt_comment).toHaveValue(testData.normal.cadetNamePattern);
                await expect.soft(cadetComponent.txt_comment).toHaveValue(testData.normal.typePattern);
                await expect.soft(cadetComponent.txt_comment).toHaveValue(testData.issued.numberPattern);
            });
        });
        test('Check save with switch function', async () => {
            await test.step('issue UniformItem', async () => {
                await uniformComponent.btn_uitem_switch(testData.normal.oldUniformId).click();
                await issuePopupComponent.txt_input.fill(testData.issued.uniformNumber);
                await issuePopupComponent.btn_save.click();
            });
            await test.step('issued exceptionHandling', async () => {
                await expect.soft(messageComponent.div_icon.locator('svg[data-icon="circle-xmark"]')).toBeVisible();
                await messageComponent.btn_save.click();
            });

            await test.step('verify issued', async () => {
                await expect.soft(messageComponent.div_popup).not.toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.issued.uniformId)).toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.normal.oldUniformId)).not.toBeVisible();
            });

            await test.step('verify comment created', async () => {
                await page.goto(`/de/app/cadet/${testData.issued.ownerId}`);
                await expect.soft(cadetComponent.txt_comment).toHaveValue(testData.normal.cadetNamePattern);
                await expect.soft(cadetComponent.txt_comment).toHaveValue(testData.normal.typePattern);
                await expect.soft(cadetComponent.txt_comment).toHaveValue(testData.issued.numberPattern);
            });
        });
    });

    test.describe('Test multiexception Handling', () => {
        test.beforeEach(async ({ }) => {
            await page.goto(`/de/app/cadet/${testData.normal.cadetId}`);
        });

        test('normal, passive, issued', async () => {
            await test.step('verify not jet issued', async () => {
                await expect.soft(uniformComponent.div_uitem(testData.passiveAndIssued.uniformId)).not.toBeVisible();
            });
            await test.step('try to issue', async () => {
                await uniformComponent.btn_utype_issue(testData.normal.uTypeId).click();
                await issuePopupComponent.txt_input.fill(testData.passiveAndIssued.uniformNumber);
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
            await test.step('verify issued', async () => {
                await expect.soft(messageComponent.div_popup).not.toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.passiveAndIssued.uniformId)).toBeVisible();
            });
            await test.step('verify comment created', async () => {
                await page.goto(`/de/app/cadet/${testData.passiveAndIssued.ownerId}`);
                await expect.soft(cadetComponent.txt_comment).toHaveValue(testData.normal.cadetNamePattern);
                await expect.soft(cadetComponent.txt_comment).toHaveValue(testData.normal.typePattern);
                await expect.soft(cadetComponent.txt_comment).toHaveValue(testData.passiveAndIssued.numberPatter);
            });
        });

        test('switch, passive, issued', async () => {
            await test.step('verify not jet issued', async () => {
                await expect.soft(uniformComponent.div_uitem(testData.passiveAndIssued.uniformId)).not.toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.normal.oldUniformId)).toBeVisible();
            });
            await test.step('try to issue', async () => {
                await uniformComponent.btn_uitem_switch(testData.normal.oldUniformId).click();
                await issuePopupComponent.txt_input.fill(testData.passiveAndIssued.uniformNumber);
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
            await test.step('verify issued', async () => {
                await expect.soft(messageComponent.div_popup).not.toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.passiveAndIssued.uniformId)).toBeVisible();
                await expect.soft(uniformComponent.div_uitem(testData.normal.oldUniformId)).not.toBeVisible();
            });
            await test.step('verify comment created', async () => {
                await page.goto(`/de/app/cadet/${testData.passiveAndIssued.ownerId}`);
                await expect.soft(cadetComponent.txt_comment).toHaveValue(testData.normal.cadetNamePattern);
                await expect.soft(cadetComponent.txt_comment).toHaveValue(testData.normal.typePattern);
                await expect.soft(cadetComponent.txt_comment).toHaveValue(testData.passiveAndIssued.numberPatter);
            });
        });
    });

    test('validate mobile switch button', async () => {
        await test.step('Setup - AdminLogin', async () => {
            await page.goto(`/de/app/cadet/${testData.normal.cadetId}`);
            await page.setViewportSize({ width: 300, height: 800 });
        });

        await test.step('verify startData', async () => {
            await expect.soft(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(3 ${t.common.of} 3)`);
            await expect.soft(uniformComponent.div_uitem(testData.normal.newUniformId)).not.toBeVisible();
            await expect.soft(uniformComponent.div_uitem(testData.normal.oldUniformId)).toBeVisible();
        });

        await test.step('issue uniformItem', async () => {
            await uniformComponent.btn_uitem_menu(testData.normal.oldUniformId).click();
            await uniformComponent.btn_uitem_menu_switch(testData.normal.oldUniformId).click();

            await issuePopupComponent.txt_input.fill(testData.normal.newUniformNumber);
            await issuePopupComponent.btn_save.click();
        });

        await test.step('verify issued', async () => {
            await expect.soft(uniformComponent.div_utype_amount(testData.normal.uTypeId)).toHaveText(`(3 ${t.common.of} 3)`);
            await expect.soft(uniformComponent.div_uitem(testData.normal.newUniformId)).toBeVisible();
            await expect.soft(uniformComponent.div_uitem(testData.normal.oldUniformId)).not.toBeVisible();
        });
    });
});
