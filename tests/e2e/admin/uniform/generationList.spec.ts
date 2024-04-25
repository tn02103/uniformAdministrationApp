import t from "@/../public/locales/de";
import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";
import test, { Page, expect } from "playwright/test";
import { adminAuthFile, inspectorAuthFile, materialAuthFile } from "../../../auth.setup";
import { newDescriptionValidationTests } from "../../../global/testSets";
import { GenerationListComponent } from "../../../pages/admin/uniform/GenerationList.component";
import { TypeListComponent } from "../../../pages/admin/uniform/typeList.component";
import { DangerConfirmationModal } from "../../../pages/popups/DangerConfirmationPopup.component";
import { EditGenerationPopupComponent } from "../../../pages/popups/EditGenerationPopup.component";
import { MessagePopupComponent } from "../../../pages/popups/MessagePopup.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { testGenerations } from "../../../testData/staticData";

const typeId = '036ff236-3b83-11ee-ab4b-0068eb8ba754';
const generationList = testGenerations
    .filter(g => (!g.recdelete && (g.fk_uniformType === typeId)))
    .sort((a, b) => (a.sortOrder - b.sortOrder));
test.use({ storageState: adminAuthFile });
test.describe('', () => {
    let page: Page;
    let listComponent: TypeListComponent;
    let generationComponent: GenerationListComponent;
    let editGenerationPopup: EditGenerationPopupComponent;

    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();
        listComponent = new TypeListComponent(page);
        generationComponent = new GenerationListComponent(page);
        editGenerationPopup = new EditGenerationPopupComponent(page);

        await page.goto('/de/app/admin/uniform');
    });
    test.beforeEach(async () => {
        await cleanupData();
        await page.reload();
        await listComponent.btn_open(typeId).click();
    });
    test.afterAll(() => page.close());

    test('validate data', async () => {
        await expect(generationComponent.div_generation(generationList[0].id)).toBeVisible();
        const divList = await page.locator('div[data-testid^="div_generation_"]').all();
        await expect(divList.length).toBe(generationList.length);

        for (let i = 0; i < divList.length; i++) {
            await expect
                .soft(divList[i])
                .toHaveAttribute("data-testid", `div_generation_${generationList[i].id}`);

            await expect
                .soft(generationComponent.div_gen_name(generationList[i].id))
                .toHaveText(generationList[i].name);
        }
    });

    test('validate create', async () => {
        const name = 'testGenerationUnique';

        await test.step('create generation & validate ui', async () => {
            await generationComponent.btn_create.click();
            await editGenerationPopup.txt_name.fill(name);
            await editGenerationPopup.sel_sizeList.selectOption('277a262c-3b83-11ee-ab4b-0068eb8ba754')
            await editGenerationPopup.chk_outdated.setChecked(true);
            await editGenerationPopup.btn_save.click();
            await expect(page.locator('div[data-testid^="div_generation_"]').getByText(name)).toBeVisible();
        });
        await test.step('validate db', async () => {
            const dbData = await prisma.uniformGeneration.findFirst({
                where: {
                    fk_uniformType: typeId,
                    name
                }
            });
            expect(dbData).not.toBeNull();
            expect(dbData).toEqual(expect.objectContaining({
                id: expect.stringMatching(uuidValidationPattern),
                name: name,
                sortOrder: 4,
                outdated: true,
                fk_sizeList: '277a262c-3b83-11ee-ab4b-0068eb8ba754',
                fk_uniformType: typeId
            }));
        });
    });
    test('validate moveUp', async () => {
        await generationComponent.btn_gen_moveUp(generationList[1].id).click();

        const divList = await page.locator('div[data-testid^="div_generation_"]').all();
        await expect
            .soft(divList[0])
            .toHaveAttribute("data-testid", `div_generation_${generationList[1].id}`);

        await test.step('validate DB', async () => {
            const [initial, seccond] = await prisma.$transaction([
                prisma.uniformGeneration.findUnique({
                    where: { id: generationList[1].id }
                }),
                prisma.uniformGeneration.findUnique({
                    where: { id: generationList[0].id }
                }),
            ]);

            expect.soft(initial?.sortOrder).toBe(0);
            expect.soft(seccond?.sortOrder).toBe(1);
        });
    });
    test('validate moveDown', async () => {
        await generationComponent.btn_gen_moveDown(generationList[1].id).click();

        const divList = await page.locator('div[data-testid^="div_generation_"]').all();
        await expect
            .soft(divList[2])
            .toHaveAttribute("data-testid", `div_generation_${generationList[1].id}`);
        await test.step('validate DB', async () => {
            const [initial, seccond] = await prisma.$transaction([
                prisma.uniformGeneration.findUnique({
                    where: { id: generationList[1].id }
                }),
                prisma.uniformGeneration.findUnique({
                    where: { id: generationList[2].id }
                }),
            ]);

            expect.soft(initial?.sortOrder).toBe(2);
            expect.soft(seccond?.sortOrder).toBe(1);
        });
    });
    test('validate delete', async () => {
        const dangerModal = new DangerConfirmationModal(page);
        const deleteModal = t.admin.uniform.generationList.deleteModal;

        await test.step('open modal', async () => {
            await generationComponent.btn_gen_delete(generationList[1].id).click();
            await expect(dangerModal.div_popup)
                .toBeVisible();
            await expect
                .soft(dangerModal.div_header)
                .toHaveText(deleteModal.header.replace('{generation}', generationList[1].name));
            await expect
                .soft(dangerModal.div_confirmationText)
                .toContainText(deleteModal.confirmationText.replace('{generation}', generationList[1].name))
        });

        await test.step('delete and validate', async () => {
            await dangerModal.txt_confirmation.fill(deleteModal.confirmationText.replace('{generation}', generationList[1].name));
            await dangerModal.btn_save.click();

            await expect(generationComponent.div_generation(generationList[1].id)).not.toBeVisible();
        });

        await test.step('validate db', async () => {
            const date = new Date();
            date.setUTCMinutes(0, 0, 0);
            const data = await prisma.uniformGeneration.findUnique({
                where: {
                    id: generationList[1].id
                }
            });

            expect(data).not.toBeNull();
            data?.recdelete?.setUTCMinutes(0, 0, 0);
            expect(data?.recdelete).toEqual(date);
            expect(data?.recdeleteUser).toBe('test4');
        });
    });
    test('validate outdated label', async () => {
        await expect(generationComponent.div_gen_outdated(generationList!.find(g => !g.outdated)!.id)).not.toBeVisible();
        await expect(generationComponent.div_gen_outdated(generationList!.find(g => g.outdated)!.id)).toBeVisible();
    });
    test.describe('validate AuthRoles', () => {
        test.describe('material', async () => {
            test.use({ storageState: materialAuthFile });
            test('', async ({ page }) => {
                const typeListComponent = new TypeListComponent(page);
                await page.goto('/de/app/admin/uniform');
                await expect(typeListComponent.btn_create).toBeVisible();
            });
        });
        test.describe('inspector', async () => {
            test.use({ storageState: inspectorAuthFile });
            test('', async ({ page }) => {
                await page.goto('/de/app/admin/uniform');
                await expect(page.getByTestId('div_403Page')).toBeVisible();
            });
        });
    });

    test('validate formValidation: name', async () => {
        const tests = newDescriptionValidationTests({
            minLength: 1,
            maxLength: 20,
        });
        for (const testSet of tests) {
            await test.step(testSet.testValue, async () => {
                await page.reload();
                await listComponent.btn_open(typeId).click();
                await generationComponent.btn_gen_edit(generationList[1].id).click();

                await editGenerationPopup.txt_name.fill(String(testSet.testValue));
                await editGenerationPopup.btn_save.click();

                if (testSet.valid) {
                    await expect.soft(editGenerationPopup.div_popup).not.toBeVisible();
                } else {
                    await expect.soft(editGenerationPopup.div_popup).toBeVisible();
                }
            });
        }
    });
    test('validate edit', async () => {
        const popupComponent = new MessagePopupComponent(page);
        const genId = generationList[1].id;

        await test.step('edit generation', async () => {
            await generationComponent.btn_gen_edit(genId).click();
            await editGenerationPopup.txt_name.fill('testGeneration');
            await editGenerationPopup.chk_outdated.click();
            await editGenerationPopup.sel_sizeList.selectOption('277a262c-3b83-11ee-ab4b-0068eb8ba754');
            await editGenerationPopup.btn_save.click();

            await test.step('handle sizeList warning', async () => {
                await expect(popupComponent.div_popup).toBeVisible();
                await expect(popupComponent.div_message).toHaveText(t.admin.uniform.changeSizeListWarning);
                await popupComponent.btn_save.click();
            });
        });


        await test.step('validate ui', async () => {
            await expect.soft(generationComponent.div_gen_name(genId)).toHaveText('testGeneration');
            await expect.soft(generationComponent.div_gen_outdated(genId)).toBeVisible();
            await expect.soft(generationComponent.div_gen_sizeList(genId)).toHaveText('Liste2');
        });

        await test.step('validate DB', async () => {
            const dbData = await prisma.uniformGeneration.findUnique({
                where: { id: genId }
            });

            expect(dbData).not.toBeNull();
            expect(dbData).toEqual(expect.objectContaining({
                name: 'testGeneration',
                outdated: true,
                fk_sizeList: '277a262c-3b83-11ee-ab4b-0068eb8ba754',
                fk_uniformType: typeId
            }));
        });

    });
    test('validate no sizeList Warning', async () => {
        const popupComponent = new MessagePopupComponent(page);
        const genId = generationList[1].id;

        await generationComponent.btn_gen_edit(genId).click();
        await editGenerationPopup.txt_name.fill('testGeneration');
        await editGenerationPopup.sel_sizeList.selectOption('277a262c-3b83-11ee-ab4b-0068eb8ba754');
        await editGenerationPopup.sel_sizeList.selectOption(generationList[1].fk_sizeList);
        await editGenerationPopup.btn_save.click();
        await expect.soft(popupComponent.div_popup).not.toBeVisible();
    });
});
