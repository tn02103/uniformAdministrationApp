import { prisma } from "@/lib/db";
import { expect } from "playwright/test";
import german from "../../../public/locales/de";
import { adminTest as test } from "../../_playwrightConfig/setup";

test.beforeEach(async ({ page }) => {
    await page.goto('/de/app/redirects');
})

test.afterEach(async ({ staticData: { cleanup } }) => {
    await cleanup.redirects();
});

test.describe('Redirects Configuration', () => {
    const getSourceURL = (code: string, baseURL?: string) => {
        return `${baseURL}/api/redirects?code=${code}`;
    }

    test('should create a new redirect', async ({ page, staticData: { }, baseURL }) => {
        await test.step('Create a new redirect', async () => {
            await page.getByRole('button', { name: /create/i }).click();
            const createRow = page.getByRole('row', { name: /new/i });
            await createRow.getByLabel(/Code/i).fill('test-e2e-create');
            await createRow.getByLabel(/Ziel/i).fill('https://example.com/e2e/create-redirect');
            await createRow.getByRole('button', { name: /Anlegen/i }).click();
            await expect(createRow).toBeHidden();
        });

        await Promise.all([
            test.step('validate ui', async () => {
                const row = page.getByRole('row', { name: /test-e2e-create/i });
                await expect(row).toBeVisible();
                await expect(row.getByLabel(/Code/i)).toHaveValue('test-e2e-create');
                await expect(row.getByLabel(/Ziel/i)).toHaveValue('https://example.com/e2e/create-redirect');
                await expect(row.getByText(german.redirects["activeLabel.true"])).toBeVisible();
                await expect(row.getByText(german.redirects["activeLabel.false"])).toBeHidden();
            }),
            test.step('validate db', async () => {
                await expect(async () => {
                    const redirect = await prisma.redirect.findFirst({
                        where: {
                            code: 'test-e2e-create',
                        },
                    });
                    expect(redirect).toBeDefined();
                    expect(redirect?.code).toBe('test-e2e-create');
                    expect(redirect?.target).toBe('https://example.com/e2e/create-redirect');
                    expect(redirect?.active).toBe(true);
                }).toPass();
            }),
            test.step('validate api', async () => {
                await expect(async () => {
                    const response = await page.request.get(getSourceURL('test-e2e-create', baseURL), { maxRedirects: 0 });
                    expect(response.status()).toBe(302);
                    expect(response.headers()['location']).toBe('https://example.com/e2e/create-redirect');
                }).toPass();
            }),
        ]);
    });

    test('should edit an existing redirect', async ({ page, baseURL, staticData: { ids, data } }) => {
        await test.step('Edit an existing redirect', async () => {
            const row = page.getByRole('row', { name: data.redirects[0].code });
            await row.getByRole('button', { name: /edit/i }).click();

            await expect(row.getByLabel(/Code/i)).toBeEnabled();
            await expect(row.getByLabel(/Ziel/i)).toBeEnabled();
            await expect(row.getByLabel(/Status/i)).toBeEnabled();
            await expect(row.getByRole('button', { name: /Speichern/i })).toBeEnabled();

            await row.getByLabel(/Code/i).fill('test-e2e-edit');
            await row.getByLabel(/Ziel/i).fill('https://example.com/e2e/edit-redirect');
            await row.getByRole('button', { name: /Speichern/i }).click();

            await expect(row).toBeHidden();
        });

        await Promise.all([
            test.step('validate ui', async () => {
                const row = page.getByRole('row', { name: /test-e2e-edit/i });
                await expect(row).toBeVisible();
                await expect(row.getByLabel(/Code/i)).toHaveValue('test-e2e-edit');
                await expect(row.getByLabel(/Ziel/i)).toHaveValue('https://example.com/e2e/edit-redirect');
                await expect(row.getByText(german.redirects["activeLabel.true"])).toBeVisible();
                await expect(row.getByText(german.redirects["activeLabel.false"])).toBeHidden();
            }),
            test.step('validate db', async () => {
                await expect(async () => {
                    const redirect = await prisma.redirect.findUnique({
                        where: {
                            id: ids.redirectIds[0],
                        },
                    });
                    expect(redirect).toBeDefined();
                    expect(redirect?.code).toBe('test-e2e-edit');
                    expect(redirect?.target).toBe('https://example.com/e2e/edit-redirect');
                    expect(redirect?.active).toBe(true);
                }).toPass();
            }),
            test.step('validate api', async () => {
                await expect(async () => {
                    const response = await page.request.get(getSourceURL('test-e2e-edit', baseURL), { maxRedirects: 0 });
                    expect(response.status()).toBe(302);
                    expect(response.headers()['location']).toBe('https://example.com/e2e/edit-redirect');
                }).toPass();

                await expect(async () => {
                    const response2 = await page.request.get('http://localhost:3021/api/redirects?code=' + data.redirects[0].code, { maxRedirects: 0 });
                    if (process.env.DEFAULT_REDIRECT_URL) {
                        expect(response2.status()).toBe(302);
                        expect(response2.headers()['location']).toBe(new URL(process.env.DEFAULT_REDIRECT_URL).toString());
                    } else {
                        expect(response2.status()).toBe(404);
                        const data = await response2.json();
                        expect(data).toStrictEqual({ "message": "No redirect found" });
                    }
                }).toPass();
            }),
        ]);
    });

    test('should deactivate an existing redirect', async ({ page, baseURL, staticData: { ids, data } }) => {
        await test.step('Deactivate an existing redirect', async () => {
            const row = page.getByRole('row', { name: data.redirects[0].code });
            await row.getByRole('button', { name: /edit/i }).click();
            await row.getByLabel(/Status/i).uncheck();
            await row.getByRole('button', { name: /Speichern/i }).click();
            await expect(row.getByRole('checkbox', { name: /Status/i })).toBeHidden();
        });

        await Promise.all([
            test.step('validate ui', async () => {
                const row = page.getByRole('row', { name: data.redirects[0].code });
                await expect(row).toBeVisible();
                await expect(row.getByText(german.redirects["activeLabel.false"])).toBeVisible();
                // Its not possible to check if activelabel.true is not visible, because the translations overlap
            }),
            test.step('validate db', async () => {
                await expect(async () => {
                    const redirect = await prisma.redirect.findUnique({
                        where: {
                            id: ids.redirectIds[0],
                        },
                    });
                    expect(redirect).toBeDefined();
                    expect(redirect?.active).toBe(false);
                    expect(redirect?.code).toBe(data.redirects[0].code);
                }).toPass();
            }),
            test.step('validate api', async () => {
                await expect(async () => {
                    const response = await page.request.get(getSourceURL(data.redirects[0].code, baseURL), { maxRedirects: 0 });
                    if (process.env.DEFAULT_REDIRECT_URL) {
                        expect(response.status()).toBe(302);
                        expect(response.headers()['location']).toBe(new URL(process.env.DEFAULT_REDIRECT_URL).toString());
                    } else {
                        expect(response.status()).toBe(404);
                        const data = await response.json();
                        expect(data).toStrictEqual({ "message": "No redirect found" });
                    }
                }).toPass();
            }),
        ]);
    });

    test("should delete an existing redirect", async ({ page, baseURL, staticData: { ids, data } }) => {
        await test.step('Delete an existing redirect', async () => {
            const row = page.getByRole('row', { name: data.redirects[0].code });
            await row.getByRole('button', { name: /delete/i }).click();
            await expect(row).toBeHidden();
        });

        await Promise.all([
            test.step('validate db', async () => {
                await expect(async () => {
                    const redirect = await prisma.redirect.findUnique({
                        where: {
                            id: ids.redirectIds[0],
                        },
                    });
                    expect(redirect).toBeNull();
                }).toPass();
            }),
            test.step('validate api', async () => {
                await expect(async () => {
                    const response = await page.request.get(getSourceURL(data.redirects[0].code, baseURL), { maxRedirects: 0 });
                    if (process.env.DEFAULT_REDIRECT_URL) {
                        expect(response.status()).toBe(302);
                        expect(response.headers()['location']).toBe(new URL(process.env.DEFAULT_REDIRECT_URL).toString());
                    } else {
                        expect(response.status()).toBe(404);
                        const data = await response.json();
                        expect(data).toStrictEqual({ "message": "No redirect found" });
                    }
                }).toPass();
            }),
        ]);
    });
});
