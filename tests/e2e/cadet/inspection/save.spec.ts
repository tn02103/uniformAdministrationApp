import { prisma } from "@/lib/db";
import { Deficiency } from "@prisma/client";
import { expect } from "playwright/test";
import { CadetInspectionComponent } from "../../../_playwrightConfig/pages/cadet/cadetInspection.component";
import { adminTest } from "../../../_playwrightConfig/setup";
import { insertSvenKellerFirstInspection, startInspection, svenKellerFirstInspectionData, svenKellerSecondInspectionData } from "../../../_playwrightConfig/testData/dynamicData";

type Fixture = {
    inspectionComponent: CadetInspectionComponent;
    testData: {
        inspectionId: string;
        unresolvedIds: string[];
        newDefs: {
            [key in "cadet" | "cadetUniform" | "cadetMaterialIssued" | "cadetMaterialOther" | "uniform"]: {
                type: string;
                description: string;
                comment: string;
                uniform?: string;
                material?: string;
                materialType?: string;
                materialGroup?: string;
            }
        }

    }
};
const test = adminTest.extend<Fixture>({
    inspectionComponent: async ({ page }, use) => {
        const inspectionComponent = new CadetInspectionComponent(page);
        await use(inspectionComponent);
    },
    testData: async ({ staticData: { ids } }, use) => {
        const deficiencyIds = ids.deficiencyIds;
        use({
            inspectionId: ids.inspectionIds[4],
            unresolvedIds: [deficiencyIds[5], deficiencyIds[10], deficiencyIds[1], deficiencyIds[9], deficiencyIds[13]],
            newDefs: {
                cadet: {
                    type: ids.deficiencyTypeIds[1],
                    description: "New Deficiency",
                    comment: "Comment: CadetDeficiency",
                },
                cadetUniform: {
                    type: ids.deficiencyTypeIds[2],
                    uniform: ids.uniformIds[0][48],
                    description: "Typ1-1148",
                    comment: "Comment: CadetUniform",
                },
                cadetMaterialIssued: {
                    type: ids.deficiencyTypeIds[3],
                    material: ids.materialIds[4],
                    description: "Gruppe2-Typ2-1",
                    comment: "Comment: CadetMaterial issued",
                },
                cadetMaterialOther: {
                    type: ids.deficiencyTypeIds[3],
                    materialType: ids.materialIds[7],
                    materialGroup: ids.materialGroupIds[2],
                    description: "Gruppe3-Typ3-1",
                    comment: "Comment: CadetMaterial not issued"
                },
                uniform: {
                    type: ids.deficiencyTypeIds[0],
                    uniform: ids.uniformIds[0][46],
                    description: "Typ1-1146",
                    comment: "Comment: Uniform",
                }
            }
        })
    }
});
test.beforeEach(async ({ staticData: { index } }) => {
    await startInspection(index);
});
test.afterEach(async ({ staticData: { cleanup } }) => {
    await cleanup.inspection();
});

test('E2E0275: initalInspection', async ({ page, inspectionComponent, testData: { unresolvedIds, newDefs, inspectionId }, staticData: { ids } }) => {
    await test.step('setup', async () => {
        await page.goto(`/de/app/cadet/${ids.cadetIds[2]}`);
        await inspectionComponent.div_step0_loading.isHidden();
    });

    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    await test.step('initialize', async () => {
        await test.step('step1', async () => {
            await inspectionComponent.btn_inspect.click();
            await inspectionComponent.chk_olddef_resolved(unresolvedIds[0]).setChecked(true);
            await inspectionComponent.chk_olddef_resolved(unresolvedIds[1]).setChecked(true);
            await inspectionComponent.btn_step1_continue.click();
        });

        await test.step('newDef 0 cadet', async () => {
            await inspectionComponent.btn_step2_newDef.click();
            await inspectionComponent.sel_newDef_type(0).selectOption(newDefs.cadet.type);
            await inspectionComponent.txt_newDef_description(0).fill(newDefs.cadet.description);
            await inspectionComponent.txt_newDef_comment(0).fill(newDefs.cadet.comment);
        });

        await test.step('newDef 1 cadetUniform', async () => {
            await inspectionComponent.btn_step2_newDef.click();
            await inspectionComponent.sel_newDef_type(1).selectOption(newDefs.cadetUniform.type);
            await inspectionComponent.sel_newDef_uniform(1).selectOption(newDefs.cadetUniform.uniform!);
            await inspectionComponent.txt_newDef_comment(1).fill(newDefs.cadetUniform.comment);
        });

        await test.step('newDef 2 cadetMaterial issued', async () => {
            await inspectionComponent.btn_step2_newDef.click();
            await inspectionComponent.sel_newDef_type(2).selectOption(newDefs.cadetMaterialIssued.type);
            await inspectionComponent.sel_newDef_material(2).selectOption(newDefs.cadetMaterialIssued.material!);
            await inspectionComponent.txt_newDef_comment(2).fill(newDefs.cadetMaterialIssued.comment);
        });

        await test.step('newDef 3 cadetMaterial other', async () => {
            await inspectionComponent.btn_step2_newDef.click();
            await inspectionComponent.sel_newDef_type(3).selectOption(newDefs.cadetMaterialOther.type);
            await inspectionComponent.sel_newDef_material(3).selectOption('others');
            await inspectionComponent.sel_newDef_materialGroup(3).selectOption(newDefs.cadetMaterialOther.materialGroup!);
            await inspectionComponent.sel_newDef_materialType(3).selectOption(newDefs.cadetMaterialOther.materialType!);
            await inspectionComponent.txt_newDef_comment(3).fill(newDefs.cadetMaterialOther.comment);
        });

        await test.step('newDef 4 uniform', async () => {
            await inspectionComponent.btn_step2_newDef.click();
            await inspectionComponent.sel_newDef_type(4).selectOption(newDefs.uniform.type);
            await inspectionComponent.sel_newDef_uniform(4).selectOption(newDefs.uniform.uniform!);
            await inspectionComponent.txt_newDef_comment(4).fill(newDefs.uniform.comment);
        });
    });

    await test.step('save and validate navigation', async () => {
        await inspectionComponent.btn_step2_submit.click();

        await Promise.all([
            expect.soft(inspectionComponent.btn_inspect).toBeVisible(),
            expect.soft(inspectionComponent.btn_step1_back).toBeHidden(),
            expect.soft(inspectionComponent.btn_step1_continue).toBeHidden(),
            expect.soft(inspectionComponent.btn_step2_back).toBeHidden(),
            expect.soft(inspectionComponent.btn_step2_submit).toBeHidden(),
        ]);
    });
    await page.waitForTimeout(2000);
    await Promise.all([
        test.step('validate cadetInspection', async () => {
            const cadetI = await prisma.cadetInspection.findUnique({
                where: {
                    fk_inspection_fk_cadet: {
                        fk_cadet: ids.cadetIds[2],
                        fk_inspection: inspectionId,
                    },
                },
            });

            expect(cadetI).toBeDefined();
            expect(cadetI?.uniformComplete).toBeFalsy();
        }),
        test.step('validate Resolved', async () => {
            const resolved: Deficiency[] = await prisma.deficiency.findMany({
                where: {
                    fk_inspection_resolved: inspectionId,
                }
            });

            expect(resolved).toHaveLength(2);
            expect(resolved.map(r => r.id)).toStrictEqual(expect.arrayContaining(unresolvedIds.slice(0, 2)));
            resolved.map((res) => {
                expect(res).toMatchObject({
                    fk_inspection_resolved: inspectionId,
                    userResolved: 'test4',
                    dateResolved: date,
                });
            });
        }),
        test.step('validate newDef', async () => {
            const defList = await prisma.deficiency.findMany({
                where: {
                    fk_inspection_created: inspectionId,
                },
                include: {
                    cadetDeficiency: true,
                    uniformDeficiency: true,
                }
            });

            expect(defList).toHaveLength(5);

            await test.step('0: Cadet', async () => {
                const def = defList.find(d => d.fk_deficiencyType === newDefs.cadet.type);
                
                expect(def).toBeDefined();
                expect.soft(def).toMatchObject({
                    id: expect.any(String),
                    description: newDefs.cadet.description,
                    comment: newDefs.cadet.comment,
                    userCreated: 'test4',
                    userUpdated: 'test4',
                    userResolved: null,
                    dateCreated: date,
                    dateUpdated: date,
                    dateResolved: null,
                    fk_inspection_resolved: null,
                    cadetDeficiency: expect.objectContaining({
                        fk_cadet: ids.cadetIds[2],
                        fk_uniform: null,
                        fk_material: null,
                    }),
                    uniformDeficiency: null,
                });
            });
            await test.step('1: cadetUniform', async () => {
                const def = defList.find(d => d.fk_deficiencyType === newDefs.cadetUniform.type);
                
                expect(def).toBeDefined();
                expect.soft(def).toMatchObject({
                    description: newDefs.cadetUniform.description,
                    id: expect.any(String),
                    uniformDeficiency: null,
                    cadetDeficiency: expect.objectContaining({
                        fk_cadet: ids.cadetIds[2],
                        fk_uniform: newDefs.cadetUniform.uniform,
                        fk_material: null,
                    }),
                });
            });
            await test.step('2: cadetMaterial issued', async () => {
                const def = defList.find(d => d.comment === newDefs.cadetMaterialIssued.comment);

                expect(def).toBeDefined();
                expect.soft(def).toMatchObject({
                    description: newDefs.cadetMaterialIssued.description,
                    id: expect.any(String),
                    fk_deficiencyType: newDefs.cadetMaterialIssued.type,
                    uniformDeficiency: null,
                    cadetDeficiency: expect.objectContaining({
                        fk_cadet: ids.cadetIds[2],
                        fk_uniform: null,
                        fk_material: newDefs.cadetMaterialIssued.material
                    }),
                });
            });
            await test.step('3: cadetMaterial other', async () => {
                const def = defList.find(d => d.comment === newDefs.cadetMaterialOther.comment);

                expect(def).toBeDefined();
                expect.soft(def).toMatchObject({
                    id: expect.any(String),
                    fk_deficiencyType: newDefs.cadetMaterialOther.type,
                    description: newDefs.cadetMaterialOther.description,
                    uniformDeficiency: null,
                    cadetDeficiency: expect.objectContaining({
                        fk_cadet: ids.cadetIds[2],
                        fk_uniform: null,
                        fk_material: newDefs.cadetMaterialOther.materialType
                    }),
                });
            });
            await test.step('4: uniform', async () => {
                const def = defList.find(d => d.fk_deficiencyType === newDefs.uniform.type);

                expect(def).toBeDefined();
                expect.soft(def).toMatchObject({
                    id: expect.any(String),
                    description: newDefs.uniform.description,
                    uniformDeficiency: expect.objectContaining({
                        fk_uniform: newDefs.uniform.uniform,
                    }),
                    cadetDeficiency: null,
                });
            });
        }),
    ]);
});

test('E2E0281: validate updated inspection', async ({ page, inspectionComponent, testData: { inspectionId }, staticData: { index, ids } }) => {
    await test.step('setup', async () => {
        await insertSvenKellerFirstInspection(index);
        await page.goto(`/de/app/cadet/${ids.cadetIds[2]}`);
        await inspectionComponent.div_step0_loading.isHidden();
    });

    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    await test.step('setupData', async () => {
        await test.step('step1', async () => {
            await inspectionComponent.btn_inspect.click();
            await inspectionComponent.chk_olddef_resolved(svenKellerSecondInspectionData(index).oldDefIdToUnsolve).setChecked(false);
            await inspectionComponent.chk_olddef_resolved(svenKellerSecondInspectionData(index).oldDefIdToSolve).setChecked(true);
            await inspectionComponent.btn_step1_continue.click();
        });

        const newDefs = svenKellerFirstInspectionData(index).newDeficiencyList;
        const commentList = new Array(newDefs.length);
        for (let i = 0; i < newDefs.length; i++) {
            const comment = await inspectionComponent.txt_newDef_comment(i).inputValue();
            commentList[i] = comment;
        }

        await test.step('newDef update', async () => {
            const updateData = svenKellerSecondInspectionData(index).newDefUpdated;
            const i = commentList.findIndex(id => id == updateData.comment);

            await inspectionComponent.sel_newDef_uniform(i).selectOption(updateData.fk_uniform);
            await inspectionComponent.txt_newDef_comment(i).fill(updateData.newComment);
        });
        await test.step('newDef add', async () => {
            const addData = svenKellerSecondInspectionData(index).newDefAdded;
            const i = newDefs.length;
            await inspectionComponent.btn_step2_newDef.click();

            await inspectionComponent.sel_newDef_type(i).selectOption(addData.fk_deficiencyType);
            await inspectionComponent.sel_newDef_uniform(i).selectOption(addData.fk_uniform);
            await inspectionComponent.txt_newDef_comment(i).fill(addData.comment);
        });
        await test.step('newDef delete', async () => {
            const i = commentList.findIndex(id => id == svenKellerSecondInspectionData(index).newDefToDelete.comment);
            await inspectionComponent.btn_newDef_delete(i).click();
        });
        await inspectionComponent.btn_step2_submit.click();
        await expect.soft(inspectionComponent.btn_step2_submit).toBeHidden();
    });
    await test.step('validate data', async () => {
        await Promise.all([
            test.step('resolved', async () => {
                const resolved: Deficiency[] = await prisma.deficiency.findMany({
                    where: {
                        fk_inspection_resolved: inspectionId
                    }
                });

                expect(resolved).toHaveLength(2);
                const idArray = [svenKellerFirstInspectionData(index).oldDefIdsToResolve[1], svenKellerSecondInspectionData(index).oldDefIdToSolve];
                expect.soft(resolved.map(r => r.id)).toEqual(expect.arrayContaining(idArray));

                const newResolved = resolved.find(r => r.id === idArray[1]);
                expect.soft(newResolved!.dateResolved).toEqual(date);
                expect.soft(newResolved!.userResolved).toEqual('test4');
                expect.soft(newResolved!.fk_inspection_resolved).toEqual(inspectionId);
                const oldResolved = resolved.find(r => r.id === svenKellerFirstInspectionData(index).oldDefIdsToResolve[1]);

                expect.soft(oldResolved!.dateResolved).toEqual(date);
                expect.soft(oldResolved!.userResolved).toEqual('test3');
                expect.soft(oldResolved!.fk_inspection_resolved).toEqual(inspectionId);
            }),
            test.step('unresolved', async () => {
                const def = await prisma.deficiency.findUnique({
                    where: { id: svenKellerSecondInspectionData(index).oldDefIdToUnsolve }
                });

                expect.soft(def).toMatchObject({
                    fk_inspection_resolved: null,
                    dateResolved: null,
                    userResolved: null,
                });
            }),
            test.step('newDef update', async () => {
                const compare = svenKellerSecondInspectionData(index).newDefUpdated;
                const def = await prisma.deficiency.findUnique({
                    where: {
                        id: compare.id,
                    },
                    include: {
                        cadetDeficiency: true,
                        uniformDeficiency: true,
                    }
                });

                expect(def).toBeDefined();
                expect.soft(def).toMatchObject({
                    description: compare.description,
                    comment: compare.newComment,
                    userCreated: 'test3',
                    userUpdated: 'test4',
                    userResolved: null,
                    dateCreated: date,
                    dateUpdated: date,
                    dateResolved: null,
                    fk_inspection_created: inspectionId,
                    fk_inspection_resolved: null,
                    uniformDeficiency: expect.objectContaining({
                        fk_uniform: compare.fk_uniform,
                    }),
                    cadetDeficiency: null,
                });
            }),
            test.step('newDef created', async () => {
                const compare = svenKellerSecondInspectionData(index).newDefAdded;
                const def = await prisma.deficiency.findFirst({
                    where: {
                        comment: compare.comment,
                        fk_inspection_created: inspectionId
                    },
                    include: {
                        cadetDeficiency: true,
                        uniformDeficiency: true,
                    }
                });

                expect(def).toBeDefined();
                expect.soft(def).toMatchObject({
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
                    fk_inspection_created: inspectionId,
                    cadetDeficiency: expect.objectContaining({
                        deficiencyId: expect.any(String),
                        fk_cadet: ids.cadetIds[2],
                        fk_uniform: compare.fk_uniform,
                        fk_material: null,
                    }),
                });
            }),
            test.step('newDef deleted', async () => {
                const def = await prisma.deficiency.findUnique({
                    where: {
                        id: svenKellerSecondInspectionData(index).newDefToDelete.id,
                    }
                });
                expect.soft(def).toBeNull();
            }),
        ])
    });
});
