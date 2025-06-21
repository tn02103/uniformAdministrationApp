import { prisma } from "@/lib/db";
import { adminTest as test } from "../../_playwrightConfig/setup";
import { expect, Locator, Page } from "playwright/test";



test.describe('Offcanvas - CadetOverview', () => {

    test.afterEach(async ({ staticData: { cleanup } }) => {
        await cleanup.uniform();
    });

    const openOffcanvas = async (page: Page, uniformId: string, number: number): Promise<Locator> => {
        const cadetUniformRow = page.getByTestId(`div_uniform_typeList`).getByTestId(`div_uitem_${uniformId}`);
        await cadetUniformRow.getByRole('button', { name: /open/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();

        return page.getByRole('dialog', { name: new RegExp(String(number)) })
    }

    test.describe('detail and history rows', () => {
        test.beforeEach(async ({ page, staticData: { ids } }) => {
            await page.goto(`/de/app/cadet/${ids.cadetIds[1]}`);
        });

        test('should open and close offcanvas', async ({ page, staticData: { ids } }) => {
            const cadetUniformRow = page.getByTestId(`div_uniform_typeList`).getByTestId(`div_uitem_${ids.uniformIds[0][84]}`)
            await cadetUniformRow.getByRole('button', { name: /open/i }).click();
            await expect(page.getByRole('dialog')).toBeVisible();

            const offcanvas = page.getByRole('dialog');
            await expect(offcanvas).toBeVisible();
            await offcanvas.getByRole('button', { name: /close/i }).click();
            await expect(offcanvas).toBeHidden();
        });

        test('should allow to edit and save uniform', async ({ page, staticData: { ids } }) => {
            const cadetUniformRow = page.getByTestId(`div_uniform_typeList`).getByTestId(`div_uitem_${ids.uniformIds[0][84]}`);
            const dialog = await openOffcanvas(page, ids.uniformIds[0][84], 1184);
            const activeField = dialog.getByLabel(/Status/i);
            const generationField = dialog.getByLabel(/Generation/i);
            const sizeField = dialog.getByLabel(/Größe/i);
            const commentField = dialog.getByLabel(/Kommentar/i);

            await test.step('Edit and save uniform', async () => {
                const editButton = dialog.getByRole('button', { name: /Bearbeiten/i });
                await editButton.click();

                await activeField.uncheck();
                await generationField.selectOption({ label: 'Generation1-1' });
                await sizeField.selectOption({ label: '1' });
                await commentField.fill('Test comment');

                const saveButton = dialog.getByRole('button', { name: /Speichern/i });
                await saveButton.click();
                await expect(commentField).toBeDisabled();
            });
            await expect(cadetUniformRow).toBeVisible();
            await Promise.all([
                test.step('validate dialog', async () => Promise.all([
                    expect(activeField).toHaveText('Reserve'),
                    expect(generationField).toHaveText('Generation1-1'),
                    expect(sizeField).toHaveText('1'),
                    expect(commentField).toHaveText('Test comment'),
                ])),
                test.step('validate cadetUniformRow', async () => Promise.all([
                    expect(cadetUniformRow.getByTestId('div_number')).toHaveText('1184'),
                    expect(cadetUniformRow.getByTestId('div_generation')).toHaveText('Generation1-1'),
                    expect(cadetUniformRow.getByTestId('div_size')).toHaveText('1'),
                    expect(cadetUniformRow.getByTestId('div_comment')).toHaveText('Test comment'),
                    expect(cadetUniformRow.getByTestId('div_number')).toHaveClass(/text-danger/),
                ])),
                test.step('validate db', async () => {
                    const cadetUniform = await prisma.uniform.findFirst({
                        where: {
                            id: ids.uniformIds[0][84],
                        },
                    });
                    expect(cadetUniform).toBeDefined();
                    expect(cadetUniform).toEqual(expect.objectContaining({
                        id: ids.uniformIds[0][84],
                        number: 1184,
                        fk_size: ids.sizeIds[1],
                        fk_generation: ids.uniformGenerationIds[0],
                        comment: 'Test comment',
                        active: false,
                        recdelete: null,
                        recdeleteUser: null
                    }));
                }),
            ]);
        });

        test('should allow to edit and save uniform without generation and size', async ({ page, staticData: { ids } }) => {
            const uniformId = ids.uniformIds[3][3];
            const cadetUniformRow = page.getByTestId(`div_uniform_typeList`).getByTestId(`div_uitem_${uniformId}`);
            const dialog = await openOffcanvas(page, uniformId, 1403);
            const activeField = dialog.getByLabel(/Status/i);
            const generationField = dialog.getByLabel(/Generation/i);
            const sizeField = dialog.getByLabel(/Größe/i);
            const commentField = dialog.getByLabel(/Kommentar/i);

            await test.step('Edit and save uniform', async () => {
                await expect(generationField).toBeHidden();
                await expect(sizeField).toBeHidden();

                const editButton = dialog.getByRole('button', { name: /Bearbeiten/i });
                await editButton.click();
                await activeField.uncheck();
                await commentField.fill('Test comment');

                const saveButton = dialog.getByRole('button', { name: /Speichern/i });
                await saveButton.click();
                await expect(commentField).toBeDisabled();
            });
            await expect(cadetUniformRow).toBeVisible();
            await Promise.all([
                test.step('validate dialog', async () => Promise.all([
                    expect(activeField).toHaveText('Reserve'),
                    expect(commentField).toHaveText('Test comment'),
                ])),
                test.step('validate cadetUniformRow', async () => Promise.all([
                    expect(cadetUniformRow.getByTestId('div_number')).toHaveText('1403'),
                    expect(cadetUniformRow.getByTestId('div_generation')).toHaveText('---'),
                    expect(cadetUniformRow.getByTestId('div_size')).toHaveText('---'),
                    expect(cadetUniformRow.getByTestId('div_comment')).toHaveText('Test comment'),
                    expect(cadetUniformRow.getByTestId('div_number')).toHaveClass(/text-danger/),
                ])),
                test.step('validate db', async () => {
                    const cadetUniform = await prisma.uniform.findFirst({
                        where: {
                            id: uniformId,
                        },
                    });
                    expect(cadetUniform).toBeDefined();
                    expect(cadetUniform).toEqual(expect.objectContaining({
                        id: uniformId,
                        number: 1403,
                        fk_size: null,
                        fk_generation: null,
                        comment: 'Test comment',
                        active: false,
                        recdelete: null,
                        recdeleteUser: null
                    }));
                }),
            ]);
        });

        test('should allow to delete uniform', async ({ page, staticData: { ids } }) => {
            const cadetUniformRow = page.getByTestId(`div_uniform_typeList`).getByTestId(`div_uitem_${ids.uniformIds[0][84]}`);
            const dialog = await openOffcanvas(page, ids.uniformIds[0][84], 1184);
            await test.step('delete item', async () => {
                const deleteButton = dialog.getByRole('button', { name: /Löschen/i });
                await deleteButton.click();
                const warningModal = page.getByRole('dialog', { name: /Warnung/i });
                await expect(warningModal).toBeVisible();
                await warningModal.getByRole('button', { name: /Löschen/i }).click();
                await expect(warningModal).toBeHidden();
            });

            await test.step('validate ui', async () => {
                await expect(dialog).toBeHidden();
                await expect(cadetUniformRow).toBeHidden();
            });

            await test.step('validate db', async () => {
                const cadetUniform = await prisma.uniform.findFirst({
                    where: {
                        id: ids.uniformIds[0][84],
                    },
                });
                expect(cadetUniform).toBeDefined();
                expect(cadetUniform).toEqual(expect.objectContaining({
                    recdelete: expect.any(Date),
                    recdeleteUser: 'test4'
                }));
            });
        });

        test('history should be visible', async ({ page, staticData: { ids } }) => {
            const history = [
                { dateIssued: "16.08.2023", cadet: "Marie Becker", dateReturned: '' },
                { dateIssued: "11.08.2023", cadet: "Antje Fried", dateReturned: "15.08.2023" },
                { dateIssued: "06.08.2023", cadet: "Christina Faber", dateReturned: "10.08.2023" },
                { dateIssued: "01.08.2023", cadet: "Simone Osterhagen", dateReturned: "05.08.2023" },
            ];

            const dialog = await openOffcanvas(page, ids.uniformIds[0][86], 1186);
            const historyList = dialog.getByRole('list', { name: /Historie/i });
            await expect(historyList).toBeVisible();

            await expect(historyList.getByRole('listitem').nth(0)).toBeVisible();// wait for the history to load
            await expect(historyList.getByRole('listitem')).toHaveCount(4);

            await Promise.all(
                history.map(async (item, index) => {
                    await expect(historyList.getByRole('listitem').nth(index).getByLabel('dateIssued')).toHaveText(item.dateIssued);
                    await expect(historyList.getByRole('listitem').nth(index).getByLabel('dateReturned')).toHaveText(item.dateReturned);
                    await expect(historyList.getByRole('listitem').nth(index).getByLabel('person')).toHaveText(item.cadet);
                })
            );
        });

    })

    test.describe('deficiencies', () => {
        test.beforeEach(async ({ page, staticData: { ids } }) => {
            await page.goto(`/de/app/cadet/${ids.cadetIds[2]}`);
            await expect(page.getByTestId(`div_uitem_${ids.uniformIds[0][46]}`)).toBeVisible();
        });

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        test('should toggle show resolved', async ({ page, staticData: { ids, data } }) => {
            const deficiencies = [
                data.deficiencies[1],
                data.deficiencies[2],
                data.deficiencies[14],
                data.deficiencies[15],
            ]

            const dialog = await openOffcanvas(page, ids.uniformIds[0][46], 1146);
            const showRewolvedToggle = dialog.getByRole('checkbox', { name: /Behobene Mängel anzeigen/i });

            const deficiencyList = dialog.getByRole('list', { name: /Deficiency list/i });
            const deficiencyItems = deficiencyList.getByRole('listitem');
            await expect(deficiencyList).toBeVisible();
            await expect(deficiencyList.getByRole('listitem').nth(0)).toBeVisible();// wait for the deficiency to load
            await expect(deficiencyList.getByRole('listitem')).toHaveCount(2);
            await Promise.all([
                expect(deficiencyItems.nth(0).getByText('Uniform', { exact: true })).toBeVisible(),
                expect(deficiencyItems.nth(0).locator('p[class="card-text"]')).toHaveText(deficiencies[0].comment),
                expect(deficiencyItems.nth(1).getByText('Uniform Broken', { exact: true })).toBeVisible(),
                expect(deficiencyItems.nth(1).locator('p[class="card-text"]')).toHaveText(deficiencies[3].comment),
            ]);

            await showRewolvedToggle.check();
            await expect(deficiencyList.getByRole('listitem').nth(0)).toBeVisible();// wait for the deficiency to load
            await expect(deficiencyList.getByRole('listitem')).toHaveCount(4);
            await Promise.all([
                expect(deficiencyItems.nth(0).locator('p[class="card-text"]')).toHaveText(deficiencies[0].comment),
                expect(deficiencyItems.nth(0).getByText('Gelöst')).toBeHidden(),
                expect(deficiencyItems.nth(0).getByText('Uniform', { exact: true })).toBeVisible(),
                expect(deficiencyItems.nth(1).locator('p[class="card-text"]')).toHaveText(deficiencies[1].comment),
                expect(deficiencyItems.nth(1).getByText('Gelöst')).toBeVisible(),
                expect(deficiencyItems.nth(1).getByText('Uniform Gelöst', { exact: true })).toBeVisible(),
                expect(deficiencyItems.nth(2).locator('p[class="card-text"]')).toHaveText(deficiencies[2].comment),
                expect(deficiencyItems.nth(2).getByText('Gelöst')).toBeVisible(),
                expect(deficiencyItems.nth(2).getByText('Uniform Broken Gelöst', { exact: true })).toBeVisible(),
                expect(deficiencyItems.nth(3).locator('p[class="card-text"]')).toHaveText(deficiencies[3].comment),
                expect(deficiencyItems.nth(3).getByText('Gelöst')).toBeHidden(),
                expect(deficiencyItems.nth(3).getByText('Uniform Broken', { exact: true })).toBeVisible(),
            ]);
        });

        test('should show no deficiencies Message', async ({ page, staticData: { ids } }) => {
            const dialog = await openOffcanvas(page, ids.uniformIds[0][48], 1148);

            const deficiencyList = dialog.getByRole('list', { name: /Deficiency list/i });
            await expect(deficiencyList).toBeVisible();
            await expect(deficiencyList.getByRole('listitem')).toHaveCount(0);
            await expect(deficiencyList.getByText(/keine Mängel/i)).toBeVisible();
        });

        test('edit and save deficiency', async ({ page, staticData: { ids, data } }) => {
            const dialog = await openOffcanvas(page, ids.uniformIds[0][46], 1146);
            const deficiency = data.deficiencies[1];
            const deficiencyList = dialog.getByRole('list', { name: /Deficiency list/i });
            const firstItem = deficiencyList.getByRole('listitem').nth(0);
            const actionMenu = firstItem.getByRole('button', { name: /Aktionen/i });
            const editButton = firstItem.getByRole('button', { name: /Bearbeiten/i });
            const commentField = firstItem.getByLabel(/Kommentar/i);
            const typeField = firstItem.getByLabel(/Art/i);

            await test.step('Edit and save deficiency', async () => {
                await expect(deficiencyList).toBeVisible();
                await expect(firstItem).toBeVisible();
                await actionMenu.click();
                await expect(editButton).toBeVisible();
                await editButton.click();

                await expect(commentField).toBeEditable();
                await expect(typeField).toBeEditable();
                await expect(typeField.getByRole('option')).toHaveCount(2);
                expect(typeField.getByRole('option', { name: "Uniform" })).toBeDefined();
                expect(typeField.getByRole('option', { name: "Uniform Broken" })).toBeDefined();
                await expect(commentField).toHaveValue(deficiency.comment);
                await expect(typeField).toHaveValue(data.deficiencyTypes[0].id);
                await commentField.fill('Test comment');
                await typeField.selectOption({ label: 'Uniform Broken' });

                const saveButton = firstItem.getByRole('button', { name: /Speichern/i });
                await saveButton.click();
                await expect(commentField).not.toHaveRole('textbox');
            });
            await test.step('validate ui', async () => {
                await expect(deficiencyList).toBeVisible();
                await expect(firstItem).toBeVisible();
                await expect(firstItem.getByText('Test comment')).toBeVisible();
                await expect(firstItem.getByText('Uniform')).toBeVisible();
            });
            await test.step('validate db', async () => {
                const dbDeficiency = await prisma.deficiency.findUnique({
                    where: {
                        id: deficiency.id,
                    },
                });
                expect(dbDeficiency).toBeDefined();
                expect(dbDeficiency).toEqual(expect.objectContaining({
                    id: deficiency.id,
                    comment: 'Test comment',
                    fk_deficiencyType: ids.deficiencyTypeIds[7],
                    dateResolved: null,
                    dateUpdated: expect.any(Date),
                    dateCreated: expect.any(Date),
                    userResolved: null,
                    userCreated: 'test2',
                    userUpdated: 'test4',
                }));
                expect(dbDeficiency?.dateUpdated.getTime()).toEqual(today.getTime());
                expect(dbDeficiency?.dateCreated.getTime()).toBeLessThan(today.getTime());
            });
        });

        test('resolve deficiency', async ({ page, staticData: { ids } }) => {
            const dialog = await openOffcanvas(page, ids.uniformIds[0][46], 1146);
            const deficiencyList = dialog.getByRole('list', { name: /Deficiency list/i });
            const firstItem = deficiencyList.getByRole('listitem').nth(0);
            const actionMenu = firstItem.getByRole('button', { name: /Aktionen/i });
            const resolveButton = firstItem.getByRole('button', { name: /Beheben/i });
            const showResolvedToggle = dialog.getByRole('checkbox', { name: /Behobene Mängel anzeigen/i });

            await test.step('Resolve deficiency', async () => {
                await expect(deficiencyList).toBeVisible();
                await expect(firstItem).toBeVisible();
                await actionMenu.click();
                await expect(resolveButton).toBeVisible();
                await resolveButton.click();
            });
            await test.step('validate ui', async () => {
                await expect(deficiencyList.getByRole('listitem')).toHaveCount(1);
                await showResolvedToggle.check();
                await expect(deficiencyList.getByRole('listitem').nth(0)).toBeVisible();// wait for the deficiency to load
                await expect(deficiencyList.getByRole('listitem')).toHaveCount(4);

                await expect(firstItem).toBeVisible();
                await expect(firstItem.getByText('Gelöst')).toBeVisible();
                await expect(firstItem.getByText('Uniform Gelöst')).toBeVisible();
            });
            await test.step('validate db', async () => {
                const dbDeficiency = await prisma.deficiency.findUnique({
                    where: {
                        id: ids.deficiencyIds[1],
                    },
                });
                expect(dbDeficiency).toBeDefined();
                expect(dbDeficiency).toEqual(expect.objectContaining({
                    id: ids.deficiencyIds[1],
                    dateCreated: expect.any(Date),
                    dateUpdated: expect.any(Date),
                    dateResolved: expect.any(Date),
                    userCreated: 'test2',
                    userUpdated: 'test3',
                    userResolved: 'test4',
                }));

                expect(dbDeficiency!.dateCreated.getTime()).toBeLessThan(today.getTime());
                expect(dbDeficiency!.dateUpdated.getTime()).toBeLessThan(today.getTime());
                expect(dbDeficiency!.dateResolved!.getTime()).toEqual(today.getTime());
            });
        });

        test('create deficiency', async ({ page, staticData: { ids } }) => {
            const dialog = await openOffcanvas(page, ids.uniformIds[0][46], 1146);
            const deficiencyList = dialog.getByRole('list', { name: /Deficiency list/i });
            const addButton = dialog.getByRole('button', { name: /Anlegen/i });
            const newDeficiencyRow = deficiencyList.getByRole('listitem', { name: /Neu/i });
            const commentField = newDeficiencyRow.getByLabel(/Kommentar/i);
            const typeField = newDeficiencyRow.getByLabel(/Art/i);
            const saveButton = newDeficiencyRow.getByRole('button', { name: /Anlegen/i });

            await test.step('Create deficiency', async () => {
                await expect(deficiencyList).toBeVisible();
                await expect(deficiencyList.getByRole('listitem')).toHaveCount(2);
                await addButton.click();
                await expect(newDeficiencyRow).toBeVisible();
                await expect(commentField).toBeEditable();
                await expect(typeField).toBeEditable();
                await expect(typeField.getByRole('option')).toHaveCount(2);
                expect(typeField.getByRole('option', { name: "Uniform" })).toBeDefined();
                expect(typeField.getByRole('option', { name: "Uniform Broken" })).toBeDefined();

                await commentField.fill('Test new comment');
                await typeField.selectOption({ label: 'Uniform' });
                await saveButton.click();
            });

            await test.step('validate ui', async () => {
                await expect(deficiencyList).toBeVisible();
                await expect(newDeficiencyRow).toBeHidden();
                await expect(deficiencyList.getByRole('listitem', { name: /Mangel/i })).toHaveCount(3);
                const thirdItem = deficiencyList.getByRole('listitem').nth(2);
                await expect(thirdItem.getByText('Test new comment')).toBeVisible();
                await expect(thirdItem.getByText('Uniform')).toBeVisible();
            });
            await test.step('validate db', async () => {
                const dbDeficiency = await prisma.deficiency.findFirst({
                    where: {
                        comment: 'Test new comment',
                    },
                });
                expect(dbDeficiency).toBeDefined();
                expect(dbDeficiency).toEqual(expect.objectContaining({
                    id: expect.any(String),
                    comment: 'Test new comment',
                    fk_deficiencyType: ids.deficiencyTypeIds[0],
                    dateResolved: null,
                    dateCreated: expect.any(Date),
                    dateUpdated: expect.any(Date),
                    userCreated: 'test4',
                    userUpdated: 'test4',
                    userResolved: null,
                }));
                expect(dbDeficiency?.dateCreated.getTime()).toEqual(today.getTime());
                expect(dbDeficiency?.dateUpdated.getTime()).toEqual(today.getTime());
            });
        });
    });
});