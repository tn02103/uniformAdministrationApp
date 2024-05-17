import t from "@/../public/locales/de";
import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";
import { UniformGeneration } from "@prisma/client";
import { test as baseTest, expect } from "playwright/test";
import { adminTest, authenticatedFixture, inspectorTest, managerTest } from "../../../auth.setup";
import { newDescriptionValidationTests } from "../../../global/testSets";
import { GenerationListComponent } from "../../../pages/admin/uniform/GenerationList.component";
import { TypeListComponent } from "../../../pages/admin/uniform/typeList.component";
import { DangerConfirmationModal } from "../../../pages/popups/DangerConfirmationPopup.component";
import { EditGenerationPopupComponent } from "../../../pages/popups/EditGenerationPopup.component";
import { MessagePopupComponent } from "../../../pages/popups/MessagePopup.component";


type Fixture = {
    typeId: string;
    generationList: UniformGeneration[];
    components: {
        listComponent: TypeListComponent;
        generationComponent: GenerationListComponent;
        editGenerationPopup: EditGenerationPopupComponent;
    }
}


const test = adminTest.extend<authenticatedFixture & Fixture>({
    typeId: async ({ staticData }, use) => {
        await use((await staticData.getUniformType('AA'))!.id)
    },
    generationList: async ({ staticData, typeId }, use) => {
        await use((await staticData.getUniformGenerationList()).filter(g => g.fk_uniformType === typeId))
    },
    components: async ({ page, typeId }, use) => {
        const comp = {
            listComponent: new TypeListComponent(page),
            generationComponent: new GenerationListComponent(page),
            editGenerationPopup: new EditGenerationPopupComponent(page),
        }

        await page.goto('/de/app/admin/uniform');
        await comp.listComponent.btn_open(typeId).click();
        use(comp);
    },
});

test('validate data', async ({ page, components: { generationComponent }, generationList }) => {
    await expect(generationComponent.div_generation(generationList[0].id)).toBeVisible();
    const divList = await page.locator('div[data-testid^="div_generation_"]').all();
    await expect(divList).toHaveLength(generationList.length);

    for (let i = 0; i < divList.length; i++) {
        await expect
            .soft(divList[i])
            .toHaveAttribute("data-testid", `div_generation_${generationList[i].id}`);

        await expect
            .soft(generationComponent.div_gen_name(generationList[i].id))
            .toHaveText(generationList[i].name);
    }
});

test('validate create', async ({ page, components: { generationComponent, editGenerationPopup }, staticData, typeId }) => {
    const name = 'testGenerationUnique';
    const sizelist = await staticData.getUniformSizelist('Liste2');

    await test.step('create generation & validate ui', async () => {
        await generationComponent.btn_create.click();
        await editGenerationPopup.txt_name.fill(name);
        await editGenerationPopup.sel_sizeList.selectOption(sizelist!.id)
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
            fk_sizeList: sizelist!.id,
            fk_uniformType: typeId
        }));
    });
});
test('validate moveUp', async ({ page, components: { generationComponent }, generationList }) => {
    await generationComponent.btn_gen_moveUp(generationList[1].id).click();

    const divList = await page.locator('div[data-testid^="div_generation_"]').all();
    await expect
        .soft(divList[0])
        .toHaveAttribute("data-testid", `div_generation_${generationList[1].id}`);

    await baseTest.step('validate DB', async () => {
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
test('validate moveDown', async ({ page, components: { generationComponent }, generationList }) => {
    await generationComponent.btn_gen_moveDown(generationList[1].id).click();

    const divList = await page.locator('div[data-testid^="div_generation_"]').all();
    await expect
        .soft(divList[2])
        .toHaveAttribute("data-testid", `div_generation_${generationList[1].id}`);
    await baseTest.step('validate DB', async () => {
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
test('validate delete', async ({ page, generationList, components: { generationComponent } }) => {
    const dangerModal = new DangerConfirmationModal(page);
    const deleteModal = t.admin.uniform.generationList.deleteModal;

    await baseTest.step('open modal', async () => {
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

    await baseTest.step('delete and validate', async () => {
        await dangerModal.txt_confirmation.fill(deleteModal.confirmationText.replace('{generation}', generationList[1].name));
        await dangerModal.btn_save.click();

        await expect(generationComponent.div_generation(generationList[1].id)).not.toBeVisible();
    });

    await baseTest.step('validate db', async () => {
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
test('validate outdated label', async ({ generationList, components: { generationComponent } }) => {
    await expect(generationComponent.div_gen_outdated(generationList!.find(g => !g.outdated)!.id)).not.toBeVisible();
    await expect(generationComponent.div_gen_outdated(generationList!.find(g => g.outdated)!.id)).toBeVisible();
});

managerTest('validate AuthRoles: material', async ({ page }) => {
    const typeListComponent = new TypeListComponent(page);
    await page.goto('/de/app/admin/uniform');
    await expect(typeListComponent.btn_create).toBeVisible();
});

inspectorTest('validate AuthRoles: inspector', async ({ page }) => {
    await page.goto('/de/app/admin/uniform');
    await expect(page.getByTestId('div_403Page')).toBeVisible();
});


test('validate formValidation: name', async ({ page, typeId, generationList, components: { listComponent, generationComponent, editGenerationPopup } }) => {
    const tests = newDescriptionValidationTests({
        minLength: 1,
        maxLength: 20,
    });
    for (const testSet of tests) {
        await baseTest.step(testSet.testValue, async () => {
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
test('validate edit', async ({ page, typeId, generationList, staticData, components: { generationComponent, editGenerationPopup } }) => {
    const popupComponent = new MessagePopupComponent(page);
    const genId = generationList[1].id;
    const sizelist = await staticData.getUniformSizelist('Liste2');

    await baseTest.step('edit generation', async () => {
        await generationComponent.btn_gen_edit(genId).click();
        await editGenerationPopup.txt_name.fill('testGeneration');
        await editGenerationPopup.chk_outdated.click();
        await editGenerationPopup.sel_sizeList.selectOption(sizelist!.id);
        await editGenerationPopup.btn_save.click();

        await baseTest.step('handle sizeList warning', async () => {
            await expect(popupComponent.div_popup).toBeVisible();
            await expect(popupComponent.div_message).toHaveText(t.admin.uniform.changeSizeListWarning);
            await popupComponent.btn_save.click();
        });
    });


    await baseTest.step('validate ui', async () => {
        await expect.soft(generationComponent.div_gen_name(genId)).toHaveText('testGeneration');
        await expect.soft(generationComponent.div_gen_outdated(genId)).toBeVisible();
        await expect.soft(generationComponent.div_gen_sizeList(genId)).toHaveText('Liste2');
    });

    await baseTest.step('validate DB', async () => {
        const dbData = await prisma.uniformGeneration.findUnique({
            where: { id: genId }
        });

        expect(dbData).not.toBeNull();
        expect(dbData).toEqual(expect.objectContaining({
            name: 'testGeneration',
            outdated: true,
            fk_sizeList: sizelist!.id,
            fk_uniformType: typeId
        }));
    });

});
test('validate no sizeList Warning', async ({ page, generationList, staticData, components: { generationComponent, editGenerationPopup } }) => {
    const popupComponent = new MessagePopupComponent(page);
    const genId = generationList[1].id;
    const sizelist = await staticData.getUniformSizelist('Liste2');

    await generationComponent.btn_gen_edit(genId).click();
    await editGenerationPopup.txt_name.fill('testGeneration');
    await editGenerationPopup.sel_sizeList.selectOption(sizelist!.id);
    await editGenerationPopup.sel_sizeList.selectOption(generationList[1].fk_sizeList);
    await editGenerationPopup.btn_save.click();
    await expect.soft(popupComponent.div_popup).not.toBeVisible();
});
