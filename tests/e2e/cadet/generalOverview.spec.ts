import test, { Page, expect } from "playwright/test";
import { adminAuthFile } from "../../auth.setup";
import { cleanupData } from "../../testData/cleanupStatic";
import { CadetListPage } from "../../pages/cadet/cadetList.page";

test.use({ storageState: adminAuthFile });
test.describe('', async () => {
    let page: Page;
    let cadetListPage: CadetListPage;


    test.beforeAll(async ({ browser }) => {
        const loadPage = async () => {
            page = await (await browser.newContext()).newPage();
            cadetListPage = new CadetListPage(page);
        }
        await Promise.all([loadPage(), cleanupData()]);
        await page.goto(`de/app/cadet`);
    });
    test.afterAll(async () => page.close());
    test('validate Data', async () => {
        await expect(await cadetListPage.div_cadet_list.count()).toBe(9);

        await Promise.all([
            expect.soft(cadetListPage.div_cadet_lastInspection('0d06427b-3c12-11ee-8084-0068eb8ba754'))
                .toHaveText('13.08.2023'),//Marie Ackermann
            expect.soft(cadetListPage.div_cadet_lastInspection('0692ae33-3c12-11ee-8084-0068eb8ba754'))
                .toHaveText('-'), //Fried Antje
            expect.soft(cadetListPage.div_cadet_lastInspection('c4d33a71-3c11-11ee-8084-0068eb8ba754'))
                .toHaveText('18.06.2023'), // Sven Keller
            expect.soft(cadetListPage.div_cadet_uniformComplete('0d06427b-3c12-11ee-8084-0068eb8ba754'))
                .toHaveText('Ja'),//Marie Ackermann
            expect.soft(cadetListPage.div_cadet_uniformComplete('0692ae33-3c12-11ee-8084-0068eb8ba754'))
                .toHaveText('-'), //Fried Antje
            expect.soft(cadetListPage.div_cadet_uniformComplete('c4d33a71-3c11-11ee-8084-0068eb8ba754'))
                .toHaveText('Nein'), //Sven Keller
            expect.soft(cadetListPage.div_cadet_activeDeficiencyCount('0d06427b-3c12-11ee-8084-0068eb8ba754'))
                .toHaveText('0'), //Marie Ackermann
            expect.soft(cadetListPage.div_cadet_activeDeficiencyCount('0692ae33-3c12-11ee-8084-0068eb8ba754'))
                .toHaveText('0'), //Fried Antje
            expect.soft(cadetListPage.div_cadet_activeDeficiencyCount('c4d33a71-3c11-11ee-8084-0068eb8ba754'))
                .toHaveText('4'), //Sven Keller
        ]);
    });
    test('validate sortOrder', async () => {
        await test.step('default', async () => {
            await Promise.all([
                expect.soft(cadetListPage.div_cadet_list.nth(0)).toHaveAttribute('data-testid', `div_cadet_0d06427b-3c12-11ee-8084-0068eb8ba754`), //Marie Ackermann
                expect.soft(cadetListPage.div_cadet_list.nth(3)).toHaveAttribute('data-testid', 'div_cadet_0692ae33-3c12-11ee-8084-0068eb8ba754'), //Fried Antje
                expect.soft(cadetListPage.div_cadet_list.nth(8)).toHaveAttribute('data-testid', 'div_cadet_e2061e21-3c11-11ee-8084-0068eb8ba754'), //Tim weissmüller
            ]);
        });
        await test.step('lastname desc', async () => {
            await page.goto('/de/app/cadet?orderBy=lastname&asc=false');

            await Promise.all([
                expect.soft(cadetListPage.div_cadet_list.nth(8)).toHaveAttribute('data-testid', `div_cadet_0d06427b-3c12-11ee-8084-0068eb8ba754`), //Marie Ackermann
                expect.soft(cadetListPage.div_cadet_list.nth(5)).toHaveAttribute('data-testid', 'div_cadet_0692ae33-3c12-11ee-8084-0068eb8ba754'), //Fried Antje
                expect.soft(cadetListPage.div_cadet_list.nth(0)).toHaveAttribute('data-testid', 'div_cadet_e2061e21-3c11-11ee-8084-0068eb8ba754'), //Tim weissmüller
            ]);
        });
        await test.step('firstname asc', async () => {
            await page.goto('/de/app/cadet?orderBy=firstname&asc=true');

            await Promise.all([
                expect.soft(cadetListPage.div_cadet_list.nth(5)).toHaveAttribute('data-testid', `div_cadet_0d06427b-3c12-11ee-8084-0068eb8ba754`), //Marie Ackermann
                expect.soft(cadetListPage.div_cadet_list.nth(0)).toHaveAttribute('data-testid', 'div_cadet_0692ae33-3c12-11ee-8084-0068eb8ba754'), //Fried Antje
                expect.soft(cadetListPage.div_cadet_list.nth(7)).toHaveAttribute('data-testid', 'div_cadet_e2061e21-3c11-11ee-8084-0068eb8ba754'), //Tim weissmüller
            ]);
        });
        await test.step('firstname desc', async () => {
            await page.goto('/de/app/cadet?orderBy=firstname&asc=false');

            await Promise.all([
                expect.soft(cadetListPage.div_cadet_list.nth(3)).toHaveAttribute('data-testid', `div_cadet_0d06427b-3c12-11ee-8084-0068eb8ba754`), //Marie Ackermann
                expect.soft(cadetListPage.div_cadet_list.nth(8)).toHaveAttribute('data-testid', 'div_cadet_0692ae33-3c12-11ee-8084-0068eb8ba754'), //Fried Antje
                expect.soft(cadetListPage.div_cadet_list.nth(1)).toHaveAttribute('data-testid', 'div_cadet_e2061e21-3c11-11ee-8084-0068eb8ba754'), //Tim weissmüller
            ]);
        });
        await page.goto('/de/app/cadet');
    });
    test('validate headerButton', async () => {
        await cadetListPage.btn_hdr_lastname.click();
        await expect(page).toHaveURL(/orderBy=lastname&asc=false/);

        await cadetListPage.btn_hdr_lastname.click();
        await expect(page).toHaveURL(/orderBy=lastname&asc=true/);

        await cadetListPage.btn_hdr_firstname.click();
        await expect(page).toHaveURL(/orderBy=firstname&asc=true/);

        await cadetListPage.btn_hdr_firstname.click();
        await expect(page).toHaveURL(/orderBy=firstname&asc=false/);

        await cadetListPage.btn_hdr_lastname.click();
        await expect(page).toHaveURL(/orderBy=lastname&asc=true/);
    });
    test('validate search', async () => {
        await test.step('normal', async () => {
            await cadetListPage.txt_searchField.fill('lU');
            expect(await cadetListPage.div_cadet_list.count()).toBe(2);
            await expect(cadetListPage.div_cadet('d468ac3c-3c11-11ee-8084-0068eb8ba754')).toBeVisible();
            await expect(cadetListPage.div_cadet('cbb69711-3c11-11ee-8084-0068eb8ba754')).toBeVisible();
        });

        await test.step('first->last', async () => {
            await cadetListPage.txt_searchField.fill('ea');
            expect(await cadetListPage.div_cadet_list.count()).toBe(1);
            await expect(cadetListPage.div_cadet('0d06427b-3c12-11ee-8084-0068eb8ba754')).toBeVisible();
        });

        await test.step('last->first', async () => {
            await cadetListPage.txt_searchField.fill('nm');
            expect(await cadetListPage.div_cadet_list.count()).toBe(1);
            await expect(cadetListPage.div_cadet('0d06427b-3c12-11ee-8084-0068eb8ba754')).toBeVisible();
        });

        await test.step('clear', async () => {
            await cadetListPage.btn_clearSerach.click();
            await expect(cadetListPage.txt_searchField).toHaveValue('');
            expect(await cadetListPage.div_cadet_list.count()).toBe(9);
        });
    });
    test('validate Links', async () => {
        await test.step('Marie Ackermann', async () => {
            await cadetListPage.lnk_cadet_firstname('0d06427b-3c12-11ee-8084-0068eb8ba754').click();
            await expect(page).toHaveURL('/de/app/cadet/0d06427b-3c12-11ee-8084-0068eb8ba754');
            await page.goBack();

            await cadetListPage.lnk_cadet_lastname('0d06427b-3c12-11ee-8084-0068eb8ba754').click();
            await expect(page).toHaveURL('/de/app/cadet/0d06427b-3c12-11ee-8084-0068eb8ba754');
            await page.goBack();
        });
        await test.step('Uwe Luft', async () => {
            await cadetListPage.lnk_cadet_firstname('d468ac3c-3c11-11ee-8084-0068eb8ba754').click();
            await expect(page).toHaveURL('/de/app/cadet/d468ac3c-3c11-11ee-8084-0068eb8ba754');
            await page.goBack();

            await cadetListPage.lnk_cadet_lastname('d468ac3c-3c11-11ee-8084-0068eb8ba754').click();
            await expect(page).toHaveURL('/de/app/cadet/d468ac3c-3c11-11ee-8084-0068eb8ba754');
            await page.goBack();
        });
    });
});
