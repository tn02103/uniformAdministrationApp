import germ from "@/../public/locales/de";
import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import { CadetDataComponent } from "../../_playwrightConfig/pages/cadet/cadetData.component";
import { CadetDetailPage } from "../../_playwrightConfig/pages/cadet/cadetDetail.page";
import { SidebarPage } from "../../_playwrightConfig/pages/global/Sidebar.component";
import { adminTest } from "../../_playwrightConfig/setup";

type Fixture = {
    dataComponent: CadetDataComponent;
    pageComponent: CadetDetailPage;
}
const test = adminTest.extend<Fixture>({
    dataComponent: async ({ page }, use) => use(new CadetDataComponent(page)),
    pageComponent: async ({ page }, use) => use(new CadetDetailPage(page)),
});

test.afterEach(async ({ staticData }) => {
    await staticData.cleanup.cadet();
});

test('E2E0283: validate cancel function', async ({ page, dataComponent }) => {
    await page.goto('/de/app/admin/users');
    await page.goto('/de/app/cadet/new');

    await dataComponent.btn_cancel.click();
    await expect(page).toHaveURL('/de/app/admin/users');
});

test('E2E0284: validate initialState and save', async ({ page, dataComponent, pageComponent, staticData: { organisationId } }, workerInfo) => {
    if (workerInfo.project.name === "webkit")
        test.fixme();
    await page.goto('/de/app/cadet/new');

    await test.step('hidden cards', async () => {
        await expect(dataComponent.div_card).toBeVisible();
        await expect(pageComponent.btn_menu).toBeHidden();
        await expect(pageComponent.cadetInspectionComponent.div_ci).toBeHidden();
        await expect(pageComponent.cadetMaterialComponent.div_groupList).toBeHidden();
        await expect(pageComponent.cadetUniformComponent.div_typeList).toBeHidden();
    });

    await test.step('initial dataComponent state', async () => {
        await expect(dataComponent.txt_firstname).toBeEditable();
        await expect(dataComponent.txt_lastname).toBeEditable();
        await expect(dataComponent.btn_cancel).toBeVisible();
        await expect(dataComponent.btn_save).toBeVisible();
        await expect(dataComponent.btn_edit).toBeHidden();
        await expect(dataComponent.div_lastInspection).toBeHidden();
    });

    await test.step('fill data and save', async () => {
        await dataComponent.txt_firstname.fill('Bob');
        await dataComponent.txt_lastname.fill('Beispiel');
        await dataComponent.txt_comment.fill('Dies ist ein Kommentar');
        await dataComponent.btn_save.click();
        await page.waitForURL(/\/de\/app\/cadet\/[\w\d-]{30,36}$/);
    });

    await test.step('validate ui', async () => {
        await expect(dataComponent.div_card).toBeVisible();
        await expect(pageComponent.btn_menu).toBeVisible();
        await expect(pageComponent.cadetInspectionComponent.div_ci).toBeVisible();
        await expect(pageComponent.cadetMaterialComponent.div_groupList).toBeVisible();
        await expect(pageComponent.cadetUniformComponent.div_typeList).toBeVisible();

        await expect(dataComponent.txt_firstname).not.toBeEditable();
        await expect(dataComponent.txt_comment).not.toBeEditable();
        await expect(dataComponent.btn_edit).toBeVisible();

        await expect(dataComponent.txt_firstname).toHaveValue('Bob');
        await expect(dataComponent.txt_lastname).toHaveValue('Beispiel');
        await expect(dataComponent.txt_comment).toHaveValue('Dies ist ein Kommentar');
        await expect(dataComponent.div_active).toHaveText(germ.common.active.true);
        await expect(dataComponent.div_lastInspection).toHaveText(germ.common.cadet.notInspected);
    });

    await test.step('validate db', async () => {
        const dbCadet = await prisma.cadet.findFirst({
            where: {
                firstname: 'Bob',
                lastname: 'Beispiel',
                organisationId
            }
        });

        expect(dbCadet).not.toBeNull();
        expect(dbCadet).toMatchObject({
            firstname: 'Bob',
            lastname: 'Beispiel',
            active: true,
            recdelete: null,
            recdeleteUser: null,
        });
    });
});

test('E2E0285: validate navigation', async ({ page, dataComponent, staticData: { ids, data } }) => {
    const sidebar = new SidebarPage(page)
    await page.goto(`/de/app/cadet/${ids.cadetIds[0]}`);

    await dataComponent.btn_edit.click();
    await dataComponent.txt_comment.fill('some comment to check');

    await sidebar.btn_createGroup.click();
    await sidebar.lnk_createCadetPage.click();

    await expect(page).toHaveURL('/de/app/cadet/new');
    await expect(dataComponent.txt_firstname).toBeEditable();
    await expect(dataComponent.txt_firstname).toHaveValue('');
    await expect(dataComponent.txt_comment).toHaveValue('');

    await page.goBack();
    await expect(page).toHaveURL(`/de/app/cadet/${ids.cadetIds[0]}`);
    await expect(dataComponent.txt_firstname).not.toBeEditable();
    await expect(dataComponent.txt_firstname).toHaveValue(data.cadets[0].firstname);
});
