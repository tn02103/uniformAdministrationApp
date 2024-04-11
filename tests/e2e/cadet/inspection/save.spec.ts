import { prisma } from "@/lib/db";
import { Deficiency } from "@prisma/client";
import test, { Page, expect } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { CadetInspectionComponent } from "../../../pages/cadet/cadetInspection.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { insertSvenKellerFirstInspection, startInspection, svenKellerFirstInspectionData, svenKellerSecondInspectionData, testActiveInspection } from "../../../testData/dynamicData";
import { testAssosiation, testDeficiencies, testDeficiencyTypes, testMaterialGroups, testMaterials, testUniformItems } from "../../../testData/staticData";

const typeList = testDeficiencyTypes.filter(t => t.fk_assosiation === testAssosiation.id && t.recdelete === null);
const testDef = {
    cadet: {
        type: typeList.find(t => t.dependend === "cadet" && t.relation === null)!.id,
        description: "New Deficiency",
        comment: "Comment: CadetDeficiency",
    },
    cadetUniform: {
        type: typeList.find(t => t.dependend === "cadet" && t.relation === "uniform")!.id,
        uniform: testUniformItems.find(i => i.number === 1148)!.id,
        description: "Typ1-1148",
        comment: "Comment: CadetUniform",
    },
    cadetMaterialIssued: {
        type: typeList.find(t => t.dependend === "cadet" && t.relation === "material")!.id,
        material: testMaterials.find(i => i.typename === "Typ2-1")!.id,
        description: "Gruppe2-Typ2-1",
        comment: "Comment: CadetMaterial issued",
    },
    cadetMaterialOther: {
        type: typeList.find(t => t.dependend === "cadet" && t.relation === "material")!.id,
        materialType: testMaterials.find(i => i.typename === "Typ3-1")!.id,
        materialGroup: testMaterialGroups.find(i => i.description === "Gruppe3")!.id,
        description: "Gruppe3-Typ3-1",
        comment: "Comment: CadetMaterial not issued"
    },
    uniform: {
        type: typeList.find(t => t.dependend === "uniform" && t.relation === null)!.id,
        uniform: "45f33205-3c0d-11ee-8084-0068eb8ba754",
        description: "Typ1-1146",
        comment: "Comment: Uniform",
    }
}

test.use({ storageState: adminAuthFile });
test.describe('', async () => {
    let page: Page;
    let inspectionComponent: CadetInspectionComponent;
    const cadetId = 'c4d33a71-3c11-11ee-8084-0068eb8ba754'; // Sven Keller

    const unresolvedDefIds = testDeficiencies
        .filter(def => /Sven Keller Unresolved/.test(def.comment))
        .sort((a, b) => a.dateCreated.getTime() - b.dateCreated.getTime())
        .map(cd => cd.id);

    // SETUPS
    test.beforeAll(async ({ browser }) => {
        page = await (await browser.newContext()).newPage();
        inspectionComponent = new CadetInspectionComponent(page);
        await page.goto(`/de/app/cadet/${cadetId}`)
    });
    test.afterAll(() => page.close());
    test.beforeEach(async () => {
        await cleanupData();
        await startInspection();
        await page.reload();
    });

    test('E2E0275: initalInspection', async () => {
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);
        await test.step('initialize', async () => {
            await test.step('step1', async () => {
                await inspectionComponent.btn_inspect.click();
                await inspectionComponent.chk_olddef_resolved(unresolvedDefIds[0]).setChecked(true);
                await inspectionComponent.chk_olddef_resolved(unresolvedDefIds[1]).setChecked(true);
                await inspectionComponent.btn_step1_continue.click();
            });

            await test.step('newDef 0 cadet', async () => {
                await inspectionComponent.btn_step2_newDef.click();
                await inspectionComponent.sel_newDef_type(0).selectOption(testDef.cadet.type);
                await inspectionComponent.txt_newDef_description(0).fill(testDef.cadet.description);
                await inspectionComponent.txt_newDef_comment(0).fill(testDef.cadet.comment);
            });

            await test.step('newDef 1 cadetUniform', async () => {
                await inspectionComponent.btn_step2_newDef.click();
                await inspectionComponent.sel_newDef_type(1).selectOption(testDef.cadetUniform.type);
                await inspectionComponent.sel_newDef_uniform(1).selectOption(testDef.cadetUniform.uniform);
                await inspectionComponent.txt_newDef_comment(1).fill(testDef.cadetUniform.comment);
            });

            await test.step('newDef 2 cadetMaterial issued', async () => {
                await inspectionComponent.btn_step2_newDef.click();
                await inspectionComponent.sel_newDef_type(2).selectOption(testDef.cadetMaterialIssued.type);
                await inspectionComponent.sel_newDef_material(2).selectOption(testDef.cadetMaterialIssued.material);
                await inspectionComponent.txt_newDef_comment(2).fill(testDef.cadetMaterialIssued.comment);
            });

            await test.step('newDef 3 cadetMaterial other', async () => {
                await inspectionComponent.btn_step2_newDef.click();
                await inspectionComponent.sel_newDef_type(3).selectOption(testDef.cadetMaterialOther.type);
                await inspectionComponent.sel_newDef_material(3).selectOption('others');
                await inspectionComponent.sel_newDef_materialGroup(3).selectOption(testDef.cadetMaterialOther.materialGroup);
                await inspectionComponent.sel_newDef_materialType(3).selectOption(testDef.cadetMaterialOther.materialType);
                await inspectionComponent.txt_newDef_comment(3).fill(testDef.cadetMaterialOther.comment);
            });

            await test.step('newDef 4 uniform', async () => {
                await inspectionComponent.btn_step2_newDef.click();
                await inspectionComponent.sel_newDef_type(4).selectOption(testDef.uniform.type);
                await inspectionComponent.sel_newDef_uniform(4).selectOption(testDef.uniform.uniform);
                await inspectionComponent.txt_newDef_comment(4).fill(testDef.uniform.comment);
            });
        });

        await test.step('save and validate navigation', async () => {
            await inspectionComponent.btn_step2_submit.click();

            await Promise.all([
                expect.soft(inspectionComponent.btn_inspect).toBeVisible(),
                expect.soft(inspectionComponent.btn_step1_back).not.toBeVisible(),
                expect.soft(inspectionComponent.btn_step1_continue).not.toBeVisible(),
                expect.soft(inspectionComponent.btn_step2_back).not.toBeVisible(),
                expect.soft(inspectionComponent.btn_step2_submit).not.toBeVisible(),
            ]);
        });
        await page.waitForTimeout(2000);
        await Promise.all([
            test.step('validate cadetInspection', async () => {
                const cadetI = await prisma.cadetInspection.findUnique({
                    where: {
                        fk_inspection_fk_cadet: {
                            fk_cadet: cadetId,
                            fk_inspection: testActiveInspection.id,
                        },
                    },
                });

                expect(cadetI).toBeDefined();
                expect(cadetI?.uniformComplete).toBeFalsy();
            }),
            test.step('validate Resolved', async () => {
                const resolved: Deficiency[] = await prisma.deficiency.findMany({
                    where: {
                        fk_inspection_resolved: testActiveInspection.id
                    }
                });

                expect(resolved.length).toBe(2);
                expect(resolved.map(r => r.id)).toStrictEqual(expect.arrayContaining(unresolvedDefIds.slice(0, 2)));
                resolved.map((res) => {
                    expect(res).toEqual(expect.objectContaining({
                        fk_inspection_resolved: testActiveInspection.id,
                        userResolved: 'test4',
                        dateResolved: date,
                    }))
                });
            }),
            test.step('validate newDef', async () => {
                const defList = await prisma.deficiency.findMany({
                    where: {
                        fk_inspection_created: testActiveInspection.id,
                    },
                    include: {
                        DeficiencyCadet: true,
                        DeficiencyUniform: true,
                    }
                });

                expect(defList.length).toBe(5);

                await test.step('0: Cadet', async () => {
                    const def = defList.find(d => d.fk_deficiencyType === testDef.cadet.type);

                    expect(def).toBeDefined();
                    expect.soft(def).toEqual(expect.objectContaining({
                        id: expect.any(String),
                        description: testDef.cadet.description,
                        comment: testDef.cadet.comment,
                        userCreated: 'test4',
                        userUpdated: 'test4',
                        userResolved: null,
                        dateCreated: date,
                        dateUpdated: date,
                        dateResolved: null,
                        fk_inspection_resolved: null,
                        DeficiencyCadet: expect.objectContaining({
                            fk_cadet: cadetId,
                            fk_uniform: null,
                            fk_material: null,
                        }),
                        DeficiencyUniform: null,
                    }));
                });
                await test.step('1: cadetUniform', async () => {
                    const def = defList.find(d => d.fk_deficiencyType === testDef.cadetUniform.type);

                    expect(def).toBeDefined();
                    expect.soft(def).toEqual(expect.objectContaining({
                        description: testDef.cadetUniform.description,
                        id: expect.any(String),
                        DeficiencyUniform: null,
                        DeficiencyCadet: expect.objectContaining({
                            fk_cadet: cadetId,
                            fk_uniform: testDef.cadetUniform.uniform,
                            fk_material: null,
                        }),
                    }));
                });
                await test.step('2: cadetMaterial issued', async () => {
                    const def = defList.find(d => d.comment === testDef.cadetMaterialIssued.comment);

                    expect(def).toBeDefined();
                    expect.soft(def).toEqual(expect.objectContaining({
                        description: testDef.cadetMaterialIssued.description,
                        id: expect.any(String),
                        fk_deficiencyType: testDef.cadetMaterialIssued.type,
                        DeficiencyUniform: null,
                        DeficiencyCadet: expect.objectContaining({
                            fk_cadet: cadetId,
                            fk_uniform: null,
                            fk_material: testDef.cadetMaterialIssued.material
                        }),
                    }));
                });
                await test.step('3: cadetMaterial other', async () => {
                    const def = defList.find(d => d.comment === testDef.cadetMaterialOther.comment);

                    expect(def).toBeDefined();
                    expect.soft(def).toEqual(expect.objectContaining({
                        id: expect.any(String),
                        fk_deficiencyType: testDef.cadetMaterialOther.type,
                        description: testDef.cadetMaterialOther.description,
                        DeficiencyUniform: null,
                        DeficiencyCadet: expect.objectContaining({
                            fk_cadet: cadetId,
                            fk_uniform: null,
                            fk_material: testDef.cadetMaterialOther.materialType
                        }),
                    }));
                });
                await test.step('4: uniform', async () => {
                    const def = defList.find(d => d.fk_deficiencyType === testDef.uniform.type);

                    expect(def).toBeDefined();
                    expect.soft(def).toEqual(expect.objectContaining({
                        id: expect.any(String),
                        description: testDef.uniform.description,
                        DeficiencyUniform: expect.objectContaining({
                            fk_uniform: testDef.uniform.uniform,
                        }),
                        DeficiencyCadet: null,
                    }));
                });
            }),
        ]);
    });

    test('E2E0281: validate updated inspection', async () => {
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);
        await test.step('setupData', async () => {
            await test.step('prepare DB', async () => {
                await insertSvenKellerFirstInspection();
                await page.reload();
                const resolved: Deficiency[] = await prisma.deficiency.findMany({
                    where: {
                        fk_inspection_resolved: testActiveInspection.id
                    }
                });
                const oldResolved = resolved.find(r => r.id !== svenKellerFirstInspectionData.oldDefIdsToResolve[1]);
                expect.soft(oldResolved!.dateResolved).toEqual(date);
                expect.soft(oldResolved!.userResolved).toEqual('test3');
            })

            await test.step('step1', async () => {
                await inspectionComponent.btn_inspect.click();
                await inspectionComponent.chk_olddef_resolved(svenKellerSecondInspectionData.oldDefIdToUnsolve).setChecked(false);
                await inspectionComponent.chk_olddef_resolved(svenKellerSecondInspectionData.oldDefIdToSolve).setChecked(true);
                await inspectionComponent.btn_step1_continue.click();
            });

            const newDefs = svenKellerFirstInspectionData.newDeficiencyList;
            const commentList = new Array(newDefs.length);
            for (let i = 0; i < newDefs.length; i++) {
                const comment = await inspectionComponent.txt_newDef_comment(i).inputValue();
                commentList[i] = comment;
            }

            await test.step('newDef update', async () => {
                const updateData = svenKellerSecondInspectionData.newDefUpdated;
                const i = commentList.findIndex(id => id == updateData.comment);

                await inspectionComponent.sel_newDef_uniform(i).selectOption(updateData.fk_uniform);
                await inspectionComponent.txt_newDef_comment(i).fill(updateData.newComment);
            });
            await test.step('newDef add', async () => {
                const addData = svenKellerSecondInspectionData.newDefAdded;
                const i = newDefs.length;
                await inspectionComponent.btn_step2_newDef.click();

                await inspectionComponent.sel_newDef_type(i).selectOption(addData.fk_deficiencyType);
                await inspectionComponent.sel_newDef_uniform(i).selectOption(addData.fk_uniform);
                await inspectionComponent.txt_newDef_comment(i).fill(addData.comment);
            });
            await test.step('newDef delete', async () => {
                const i = commentList.findIndex(id => id == svenKellerSecondInspectionData.newDefToDelete.comment);
                await inspectionComponent.btn_newDef_delete(i).click();
            });
            await inspectionComponent.btn_step2_submit.click();
            await expect.soft(inspectionComponent.btn_step2_submit).not.toBeVisible();
        });
        await test.step('validate data', async () => {
            await Promise.all([
                test.step('resolved', async () => {
                    const resolved: Deficiency[] = await prisma.deficiency.findMany({
                        where: {
                            fk_inspection_resolved: testActiveInspection.id
                        }
                    });

                    expect(resolved.length).toBe(2);
                    const idArray = [svenKellerFirstInspectionData.oldDefIdsToResolve[1], svenKellerSecondInspectionData.oldDefIdToSolve];
                    expect.soft(resolved.map(r => r.id)).toEqual(expect.arrayContaining(idArray));

                    const newResolved = resolved.find(r => r.id === idArray[1]);
                    expect.soft(newResolved!.dateResolved).toEqual(date);
                    expect.soft(newResolved!.userResolved).toEqual('test4');
                    expect.soft(newResolved!.fk_inspection_resolved).toEqual(testActiveInspection.id);
                    const oldResolved = resolved.find(r => r.id === svenKellerFirstInspectionData.oldDefIdsToResolve[1]);

                    expect.soft(oldResolved!.dateResolved).toEqual(date);
                    expect.soft(oldResolved!.userResolved).toEqual('test3');
                    expect.soft(oldResolved!.fk_inspection_resolved).toEqual(testActiveInspection.id);
                }),
                test.step('unresolved', async () => {
                    const def = await prisma.deficiency.findUnique({
                        where: { id: svenKellerSecondInspectionData.oldDefIdToUnsolve }
                    });

                    expect.soft(def).toEqual(expect.objectContaining({
                        fk_inspection_resolved: null,
                        dateResolved: null,
                        userResolved: null,
                    }));
                }),
                test.step('newDef update', async () => {
                    const compare = svenKellerSecondInspectionData.newDefUpdated;
                    const def = await prisma.deficiency.findUnique({
                        where: {
                            id: compare.id,
                        },
                        include: {
                            DeficiencyCadet: true,
                            DeficiencyUniform: true,
                        }
                    });

                    expect(def).toBeDefined();
                    expect.soft(def).toEqual(expect.objectContaining({
                        description: compare.description,
                        comment: compare.newComment,
                        userCreated: 'test3',
                        userUpdated: 'test4',
                        userResolved: null,
                        dateCreated: date,
                        dateUpdated: date,
                        dateResolved: null,
                        fk_inspection_created: testActiveInspection.id,
                        fk_inspection_resolved: null,
                        DeficiencyUniform: expect.objectContaining({
                            fk_uniform: compare.fk_uniform,
                        }),
                        DeficiencyCadet: null,
                    }));
                }),
                test.step('newDef created', async () => {
                    const compare = svenKellerSecondInspectionData.newDefAdded;
                    const def = await prisma.deficiency.findFirst({
                        where: {
                            comment: compare.comment,
                            fk_inspection_created: testActiveInspection.id
                        },
                        include: {
                            DeficiencyCadet: true,
                            DeficiencyUniform: true,
                        }
                    });

                    expect(def).toBeDefined();
                    expect.soft(def).toEqual(expect.objectContaining({
                        id: expect.any(String),
                        description: compare.description,
                        comment: compare.comment,
                        fk_deficiencyType: compare.fk_deficiencyType,
                        userCreated: 'test4',
                        userUpdated: 'test4',
                        userResolved: null,
                        dateCreated: date,
                        dateUpdated: date,
                        dateResolved: null,
                        fk_inspection_resolved: null,
                        fk_inspection_created: testActiveInspection.id,
                        DeficiencyCadet: expect.objectContaining({
                            deficiencyId: expect.any(String),
                            fk_cadet: cadetId,
                            fk_uniform: compare.fk_uniform,
                            fk_material: null,
                        }),
                    }));
                }),
                test.step('newDef deleted', async () => {
                    const def = await prisma.deficiency.findUnique({
                        where: {
                            id: svenKellerSecondInspectionData.newDefToDelete.id,
                        }
                    });
                    expect.soft(def).toBeNull();
                }),
            ])
        });
    });
});
