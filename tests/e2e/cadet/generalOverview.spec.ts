import { expect } from "playwright/test";
import { CadetListPage } from "../../_playwrightConfig/pages/cadet/cadetList.page";
import { adminTest, inspectorTest, userTest } from "../../_playwrightConfig/setup";

type Fixture = {
    cadetListPage: CadetListPage;
}
const test = adminTest.extend<Fixture>({
    cadetListPage: async ({ page }, use) => use(new CadetListPage(page)),
});

test.beforeEach(async ({ page }) => { await page.goto('/de/app/cadet'); })

test('E2E0101: validate Data', async ({ cadetListPage, staticData: { ids } }) => {
    await expect(cadetListPage.div_cadet_list).toHaveCount(9);

    await Promise.all([
        expect.soft(cadetListPage.div_cadet_lastInspection(ids.cadetIds[1]))
            .toHaveText('13.08.2023'),//Marie Becker
        expect.soft(cadetListPage.div_cadet_lastInspection(ids.cadetIds[0]))
            .toHaveText('-'), //Fried Antje
        expect.soft(cadetListPage.div_cadet_lastInspection(ids.cadetIds[2]))
            .toHaveText('18.06.2023'), // Sven Keller
        expect.soft(cadetListPage.div_cadet_uniformComplete(ids.cadetIds[1]))
            .toHaveText('Ja'),//Marie Becker
        expect.soft(cadetListPage.div_cadet_uniformComplete(ids.cadetIds[0]))
            .toHaveText('-'), //Fried Antje
        expect.soft(cadetListPage.div_cadet_uniformComplete(ids.cadetIds[2]))
            .toHaveText('Nein'), //Sven Keller
        expect.soft(cadetListPage.div_cadet_activeDeficiencyCount(ids.cadetIds[1]))
            .toHaveText('0'), //Marie Becker
        expect.soft(cadetListPage.div_cadet_activeDeficiencyCount(ids.cadetIds[0]))
            .toHaveText('0'), //Fried Antje
        expect.soft(cadetListPage.div_cadet_activeDeficiencyCount(ids.cadetIds[2]))
            .toHaveText('6'), //Sven Keller
    ]);
});

test('E2E0102: validate sortOrder', async ({ page, cadetListPage, staticData: { ids } }) => {
    await test.step('default', async () => {
        await Promise.all([
            expect.soft(cadetListPage.div_cadet_list.nth(0)).toHaveAttribute('data-testid', `div_cadet_${ids.cadetIds[1]}`), //Marie Becker
            expect.soft(cadetListPage.div_cadet_list.nth(3)).toHaveAttribute('data-testid', `div_cadet_${ids.cadetIds[0]}`), //Fried Antje
            expect.soft(cadetListPage.div_cadet_list.nth(8)).toHaveAttribute('data-testid', `div_cadet_${ids.cadetIds[6]}`), //Tim weissmüller
        ]);
    });

    await test.step('lastname desc', async () => {
        await page.goto('/de/app/cadet?orderBy=lastname&asc=false');

        await Promise.all([
            expect.soft(cadetListPage.div_cadet_list.nth(8)).toHaveAttribute('data-testid', `div_cadet_${ids.cadetIds[1]}`), //Marie Becker
            expect.soft(cadetListPage.div_cadet_list.nth(5)).toHaveAttribute('data-testid', `div_cadet_${ids.cadetIds[0]}`), //Fried Antje
            expect.soft(cadetListPage.div_cadet_list.nth(0)).toHaveAttribute('data-testid', `div_cadet_${ids.cadetIds[6]}`), //Tim weissmüller
        ]);
    });

    await test.step('firstname asc', async () => {
        await page.goto('/de/app/cadet?orderBy=firstname&asc=true');

        await Promise.all([
            expect.soft(cadetListPage.div_cadet_list.nth(5)).toHaveAttribute('data-testid', `div_cadet_${ids.cadetIds[1]}`), //Marie Becker
            expect.soft(cadetListPage.div_cadet_list.nth(0)).toHaveAttribute('data-testid', `div_cadet_${ids.cadetIds[0]}`), //Fried Antje
            expect.soft(cadetListPage.div_cadet_list.nth(7)).toHaveAttribute('data-testid', `div_cadet_${ids.cadetIds[6]}`), //Tim weissmüller
        ]);
    });

    await test.step('firstname desc', async () => {
        await page.goto('/de/app/cadet?orderBy=firstname&asc=false');

        await Promise.all([
            expect.soft(cadetListPage.div_cadet_list.nth(3)).toHaveAttribute('data-testid', `div_cadet_${ids.cadetIds[1]}`), //Marie Becker
            expect.soft(cadetListPage.div_cadet_list.nth(8)).toHaveAttribute('data-testid', `div_cadet_${ids.cadetIds[0]}`), //Fried Antje
            expect.soft(cadetListPage.div_cadet_list.nth(1)).toHaveAttribute('data-testid', `div_cadet_${ids.cadetIds[6]}`), //Tim weissmüller
        ]);
    });
});

test('E2E0103: validate headerButton', async ({ page, cadetListPage }) => {
    await cadetListPage.btn_hdr_lastname.click();
    await expect(page).toHaveURL(/orderBy=lastname/);
    await expect(page).toHaveURL(/asc=false/);
    
    await cadetListPage.btn_hdr_lastname.click();
    await expect(page).toHaveURL(/orderBy=lastname/);
    await expect(page).toHaveURL(/asc=true/);
    
    await cadetListPage.btn_hdr_firstname.click();
    await expect(page).toHaveURL(/orderBy=firstname/);
    await expect(page).toHaveURL(/asc=true/);
    
    await cadetListPage.btn_hdr_firstname.click();
    await expect(page).toHaveURL(/orderBy=firstname/);
    await expect(page).toHaveURL(/asc=false/);
    
    await cadetListPage.btn_hdr_lastname.click();
    await expect(page).toHaveURL(/orderBy=lastname/);
    await expect(page).toHaveURL(/asc=true/);
});

test('E2E0104: validate search', async ({ cadetListPage, staticData: { ids } }) => {
    await test.step('normal', async () => {
        await cadetListPage.txt_searchField.fill('lU');
        await expect(cadetListPage.div_cadet_list).toHaveCount(2);
        await expect(cadetListPage.div_cadet(ids.cadetIds[4])).toBeVisible();
        await expect(cadetListPage.div_cadet(ids.cadetIds[3])).toBeVisible();
    });

    await test.step('first->last', async () => {
        await cadetListPage.txt_searchField.fill('marieb');
        await expect(cadetListPage.div_cadet_list).toHaveCount(1);
        await expect(cadetListPage.div_cadet(ids.cadetIds[1])).toBeVisible();
    });

    await test.step('last->first', async () => {
        await cadetListPage.txt_searchField.fill('beckerm');
        await expect(cadetListPage.div_cadet_list).toHaveCount(1);
        await expect(cadetListPage.div_cadet(ids.cadetIds[1])).toBeVisible();
    });

    await test.step('with spaces', async () => {
        await cadetListPage.txt_searchField.fill('be cke rm');
        await expect(cadetListPage.div_cadet_list).toHaveCount(1);
        await expect(cadetListPage.div_cadet(ids.cadetIds[1])).toBeVisible();
    });

    await test.step('clear', async () => {
        await cadetListPage.btn_clearSerach.click();
        await expect(cadetListPage.txt_searchField).toHaveValue('');
        await expect(cadetListPage.div_cadet_list).toHaveCount(9);
    });
});

test('E2E0105: validate Links', async ({ page, cadetListPage, staticData: { ids } }) => {
    await test.step('Marie Becker', async () => {
        await cadetListPage.lnk_cadet_firstname(ids.cadetIds[1]).click();
        await expect(page).toHaveURL(`/de/app/cadet/${ids.cadetIds[1]}`);
        await page.goBack();

        await cadetListPage.lnk_cadet_lastname(ids.cadetIds[1]).click();
        await expect(page).toHaveURL(`/de/app/cadet/${ids.cadetIds[1]}`);
        await page.goBack();
    });

    await test.step('Uwe Luft', async () => {
        await cadetListPage.lnk_cadet_firstname(ids.cadetIds[4]).click();
        await expect(page).toHaveURL(`/de/app/cadet/${ids.cadetIds[4]}`);
        await page.goBack();

        await cadetListPage.lnk_cadet_lastname(ids.cadetIds[4]).click();
        await expect(page).toHaveURL(`/de/app/cadet/${ids.cadetIds[4]}`);
        await page.goBack();
    });
});

userTest('E2E0106: Authrole.User', async ({ page, staticData: { ids } }) => {
    const cadetListPage = new CadetListPage(page);
    await page.goto('/de/app/cadet');

    await Promise.all([
        expect.soft(cadetListPage.btn_hdr_firstname).toBeVisible(),
        expect.soft(cadetListPage.btn_hdr_lastname).toBeVisible(),
        expect.soft(cadetListPage.div_hdr_lastInspection).toBeHidden(),
        expect.soft(cadetListPage.div_hdr_uniformComplete).toBeHidden(),
        expect.soft(cadetListPage.div_hdr_activeDeficiencies).toBeHidden(),

        expect.soft(cadetListPage.lnk_cadet_firstname(ids.cadetIds[0])).toBeVisible(),
        expect.soft(cadetListPage.lnk_cadet_lastname(ids.cadetIds[0])).toBeVisible(),
        expect.soft(cadetListPage.div_cadet_lastInspection(ids.cadetIds[0])).toBeHidden(),
        expect.soft(cadetListPage.div_cadet_uniformComplete(ids.cadetIds[0])).toBeHidden(),
        expect.soft(cadetListPage.div_cadet_activeDeficiencyCount(ids.cadetIds[0])).toBeHidden(),

        expect.soft(cadetListPage.btn_clearSerach).toBeVisible(),
        expect.soft(cadetListPage.txt_searchField).toBeVisible(),
    ]);
});

inspectorTest('E2E0106: Authrole.Inspector', async ({ page, staticData: { ids } }) => {
    const cadetListPage = new CadetListPage(page);
    await page.goto('/de/app/cadet');

    await Promise.all([
        expect.soft(cadetListPage.btn_hdr_firstname).toBeVisible(),
        expect.soft(cadetListPage.btn_hdr_lastname).toBeVisible(),
        expect.soft(cadetListPage.div_hdr_lastInspection).toBeVisible(),
        expect.soft(cadetListPage.div_hdr_uniformComplete).toBeVisible(),
        expect.soft(cadetListPage.div_hdr_activeDeficiencies).toBeVisible(),

        expect.soft(cadetListPage.lnk_cadet_firstname(ids.cadetIds[0])).toBeVisible(),
        expect.soft(cadetListPage.lnk_cadet_lastname(ids.cadetIds[0])).toBeVisible(),
        expect.soft(cadetListPage.div_cadet_lastInspection(ids.cadetIds[0])).toBeVisible(),
        expect.soft(cadetListPage.div_cadet_uniformComplete(ids.cadetIds[0])).toBeVisible(),
        expect.soft(cadetListPage.div_cadet_activeDeficiencyCount(ids.cadetIds[0])).toBeVisible(),

        expect.soft(cadetListPage.btn_clearSerach).toBeVisible(),
        expect.soft(cadetListPage.txt_searchField).toBeVisible(),
    ]);
});
