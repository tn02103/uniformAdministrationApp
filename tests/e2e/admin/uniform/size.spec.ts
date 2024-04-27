import { Page, expect, test } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { newNameValidationTests, numberValidationTests } from "../../../global/testSets";
import { UniformSizeAdministrationPage } from "../../../pages/admin/uniform/UniformSizeAdministration.page";
import { MessagePopupComponent } from "../../../pages/popups/MessagePopup.component";
import { SimpleFormPopupComponent } from "../../../pages/popups/SimpleFormPopup.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { testAssosiation, testSizes } from "../../../testData/staticData";
import t from "@/../public/locales/de";
import { prisma } from "@/lib/db";

const sizes = testSizes
    .filter(s => (s.fk_assosiation === testAssosiation.id))
    .sort((a, b) => a.sortOrder - b.sortOrder);

test.use({ storageState: adminAuthFile });
test.describe.only('', () => {
    let page: Page;
    let uniformSizePage: UniformSizeAdministrationPage;
    let simpleFormPopup: SimpleFormPopupComponent;
    let messagePopup: MessagePopupComponent;

    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();
        uniformSizePage = new UniformSizeAdministrationPage(page);
        simpleFormPopup = new SimpleFormPopupComponent(page);
        messagePopup = new MessagePopupComponent(page);
        await page.goto('/de/app/admin/uniform/sizes');
    });
    test.beforeEach(async () => {
        await cleanupData();
        await page.reload();
    });
    test.afterAll(() => page.close());

    test('validate Data', async () => {
        await expect(uniformSizePage.div_size(sizes[0].id)).toBeVisible();

        const divList = await page.locator('div[data-testid^="div_size_"]').all();
        await expect(divList.length).toBe(sizes.length);

        const promises = [];
        for (let i = 0; i < divList.length; i++) {
            promises.push(expect.soft(divList[i]).toHaveAttribute("data-testid", `div_size_${sizes[i].id}`));
            promises.push(expect.soft((await uniformSizePage.div_name(sizes[i].id))).toHaveText(sizes[i].name));
            promises.push(expect.soft(uniformSizePage.div_index(sizes[i].id)).toHaveText(String(i + 1)));
        }

        await Promise.all(promises);
    });

    test('validate SizePannel hover', async () => {
        const sizeId = sizes[0].id
        await expect(uniformSizePage.div_size(sizeId)).toBeVisible();

        await Promise.all([
            expect.soft(uniformSizePage.div_name(sizeId)).toBeVisible(),
            expect.soft(uniformSizePage.div_index(sizeId)).toBeVisible(),
            expect.soft(uniformSizePage.btn_menu(sizeId)).not.toBeVisible(),
            expect.soft(uniformSizePage.btn_moveUp(sizeId)).not.toBeVisible(),
            expect.soft(uniformSizePage.btn_moveDown(sizeId)).not.toBeVisible(),
        ]);
        await uniformSizePage.div_name(sizeId).hover();

        await Promise.all([
            expect.soft(uniformSizePage.div_name(sizeId)).toBeVisible(),
            expect.soft(uniformSizePage.div_index(sizeId)).toBeVisible(),
            expect.soft(uniformSizePage.btn_menu(sizeId)).toBeVisible(),
            expect.soft(uniformSizePage.btn_moveUp(sizeId)).toBeVisible(),
            expect.soft(uniformSizePage.btn_moveDown(sizeId)).toBeVisible(),
        ]);
    });

    test('validate MoveUp', async () => {
        await test.step('validate initial state', async () => {
            await expect(uniformSizePage.div_index(sizes[0].id)).toContainText('1');
            await expect(uniformSizePage.div_index(sizes[1].id)).toContainText('2');
            await expect(uniformSizePage.div_index(sizes[2].id)).toContainText('3');
            await expect(uniformSizePage.div_index(sizes[3].id)).toContainText('4');
        });
        await test.step('move size', async () => {
            await uniformSizePage.div_size(sizes[2].id).hover();
            await uniformSizePage.btn_moveUp(sizes[2].id).click();
        });
        await test.step('validate ui', async () => {
            await expect(uniformSizePage.div_index(sizes[0].id)).toContainText('1');
            await expect(uniformSizePage.div_index(sizes[1].id)).toContainText('3');
            await expect(uniformSizePage.div_index(sizes[2].id)).toContainText('2');
            await expect(uniformSizePage.div_index(sizes[3].id)).toContainText('4');

            const divList = await page.locator('div[data-testid^="div_size_"]').all();
            await expect.soft(divList[1]).toHaveAttribute("data-testid", `div_size_${sizes[2].id}`);
        });
        await test.step('validate db', async () => {
            const dbSizes = await prisma.uniformSize.findMany({
                where: { fk_assosiation: testAssosiation.id },
                orderBy: { sortOrder: "asc" }
            });

            expect(dbSizes[0].id).toEqual(sizes[0].id);
            expect(dbSizes[1].id).toEqual(sizes[2].id);
            expect(dbSizes[2].id).toEqual(sizes[1].id);
            expect(dbSizes[3].id).toEqual(sizes[3].id);
        });
    });

    test('validate MoveDown', async () => {
        await test.step('validate initial state', async () => {
            await expect(uniformSizePage.div_index(sizes[0].id)).toContainText('1');
            await expect(uniformSizePage.div_index(sizes[1].id)).toContainText('2');
            await expect(uniformSizePage.div_index(sizes[2].id)).toContainText('3');
            await expect(uniformSizePage.div_index(sizes[3].id)).toContainText('4');
        });
        await test.step('move size', async () => {
            await uniformSizePage.div_size(sizes[1].id).hover();
            await uniformSizePage.btn_moveDown(sizes[1].id).click();
        });
        await test.step('validate ui', async () => {
            await expect(uniformSizePage.div_index(sizes[0].id)).toContainText('1');
            await expect(uniformSizePage.div_index(sizes[1].id)).toContainText('3');
            await expect(uniformSizePage.div_index(sizes[2].id)).toContainText('2');
            await expect(uniformSizePage.div_index(sizes[3].id)).toContainText('4');

            const divList = await page.locator('div[data-testid^="div_size_"]').all();
            await expect.soft(divList[1]).toHaveAttribute("data-testid", `div_size_${sizes[2].id}`);
        });
        await test.step('validate db', async () => {
            const dbSizes = await prisma.uniformSize.findMany({
                where: { fk_assosiation: testAssosiation.id },
                orderBy: { sortOrder: "asc" }
            });

            expect(dbSizes[0].id).toEqual(sizes[0].id);
            expect(dbSizes[1].id).toEqual(sizes[2].id);
            expect(dbSizes[2].id).toEqual(sizes[1].id);
            expect(dbSizes[3].id).toEqual(sizes[3].id);
        });
    });

    test('validate create', async () => {
        await test.step('create size', async () => {
            await uniformSizePage.btn_create.click();
            await expect(simpleFormPopup.div_popup).toBeVisible();
            await simpleFormPopup.txt_input.fill('newSize');
            await simpleFormPopup.btn_save.click();
        });
        await test.step('validate ui', async () => {
            await expect(simpleFormPopup.div_popup).not.toBeVisible();
            await expect(page.getByText('newSize')).toBeVisible();
        });
        await test.step('validate db', async () => {
            const size = await prisma.uniformSize.findFirst({
                where: {
                    fk_assosiation: testAssosiation.id,
                    name: "newSize"
                }
            });

            expect(size).not.toBeNull();
            expect(size!.sortOrder).toBe(sizes.length + 1);
        });
    });
    test('validate namePopup formValidation', async () => {
        const tests = newNameValidationTests({
            minLength: 1,
            maxLength: 10
        });
        for (const testSet of tests) {
            await test.step(testSet.testValue, async () => {
                await page.reload();
                await uniformSizePage.btn_create.click();

                await simpleFormPopup.txt_input.fill(String(testSet.testValue));
                await simpleFormPopup.btn_save.click();

                if (testSet.valid) {
                    await expect.soft(simpleFormPopup.err_input).not.toBeVisible();
                } else {
                    await expect.soft(simpleFormPopup.err_input).toBeVisible();
                }
            });
        }
    });
    test('validate setPosition', async () => {
        await test.step('set position', async () => {
            await uniformSizePage.div_size(sizes[10].id).hover();
            await uniformSizePage.btn_menu(sizes[10].id).click();
            await uniformSizePage.btn_menu_setPosition(sizes[10].id).click();

            await expect(simpleFormPopup.div_popup).toBeVisible();
            await simpleFormPopup.txt_input.fill('3');
            await simpleFormPopup.btn_save.click();
        });
        await test.step('validate ui', async () => {
            await expect(uniformSizePage.div_index(sizes[0].id)).toHaveText('1');
            await expect(uniformSizePage.div_index(sizes[1].id)).toHaveText('2');
            await expect(uniformSizePage.div_index(sizes[2].id)).toHaveText('4');
            await expect(uniformSizePage.div_index(sizes[3].id)).toHaveText('5');
            await expect(uniformSizePage.div_index(sizes[9].id)).toHaveText('11');
            await expect(uniformSizePage.div_index(sizes[10].id)).toHaveText('3');
            await expect(uniformSizePage.div_index(sizes[11].id)).toHaveText('12');
        });
        await test.step('validate db', async () => {
            const dbSizes = await prisma.uniformSize.findMany({
                where: { fk_assosiation: testAssosiation.id },
                orderBy: { sortOrder: "asc" }
            });

            expect(dbSizes[0].id).toEqual(sizes[0].id);
            expect(dbSizes[1].id).toEqual(sizes[1].id);
            expect(dbSizes[3].id).toEqual(sizes[2].id);
            expect(dbSizes[4].id).toEqual(sizes[3].id);
            expect(dbSizes[10].id).toEqual(sizes[9].id);
            expect(dbSizes[2].id).toEqual(sizes[10].id);
            expect(dbSizes[11].id).toEqual(sizes[11].id);
        });
    });
    test('validate setPosition formValidation', async () => {
        const tests = numberValidationTests({
            testEmpty: true
        });

        for (const testSet of tests) {
            await test.step(testSet.testValue, async () => {
                await page.reload();
                await uniformSizePage.div_size(sizes[10].id).hover();
                await uniformSizePage.btn_menu(sizes[10].id).click();
                await uniformSizePage.btn_menu_setPosition(sizes[10].id).click();

                await simpleFormPopup.txt_input.fill(String(testSet.testValue));
                await simpleFormPopup.btn_save.click();

                if (testSet.valid) {
                    await expect(simpleFormPopup.err_input).not.toBeVisible();
                } else {
                    await expect(simpleFormPopup.err_input).toBeVisible();
                }
            });
        }
    });

    test('validate delete Size', async () => {
        const deleteModal = t.admin.uniform.size.deleteModal;
        await test.step('delete size and validate modal', async () => {
            await uniformSizePage.div_size(sizes[16].id).hover();
            await uniformSizePage.btn_menu(sizes[16].id).click();
            await uniformSizePage.btn_menu_delete(sizes[16].id).click();

            await expect(messagePopup.div_popup).toBeVisible();
            await expect
                .soft(messagePopup.div_header)
                .toHaveText(deleteModal.header.replace('{size}', sizes[16].name));
            await expect
                .soft(messagePopup.div_message)
                .toHaveText(deleteModal.message);
            await messagePopup.btn_save.click();
        });
        await test.step('validate ui', async () => {
            await expect(uniformSizePage.div_size(sizes[16].id)).not.toBeVisible();

            await expect(uniformSizePage.div_index(sizes[15].id)).toHaveText('16');
            await expect(uniformSizePage.div_index(sizes[17].id)).toHaveText('17');
            await expect(uniformSizePage.div_index(sizes[20].id)).toHaveText('20');
        });
        await test.step('validate db', async () => {
            const dbSizes = await prisma.uniformSize.findMany({
                where: { fk_assosiation: testAssosiation.id },
                orderBy: { sortOrder: "asc" }
            });

            expect(dbSizes.some(s => s.id === sizes[16].id)).toBeFalsy();
            expect(dbSizes.length).toEqual(20);
            expect(dbSizes[15].id).toEqual(sizes[15].id);
            expect(dbSizes[16].id).toEqual(sizes[17].id);
            expect(dbSizes[19].id).toEqual(sizes[20].id);
        });
    });
});
