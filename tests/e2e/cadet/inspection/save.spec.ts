import { prisma } from "@/lib/db";
import { Deficiency } from "@prisma/client";
import test, { Page, expect } from "playwright/test";
import { adminAuthFile } from "../../../auth.setup";
import { CadetInspectionComponent } from "../../../pages/cadet/cadetInspection.component";
import { cleanupData } from "../../../testData/cleanupStatic";
import { startInspection, testActiveInspection } from "../../../testData/dynamicData";
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
        material: testMaterials.find(i => i.typename === "Type2-1")!.id,
        description: "Gruppe2-Typ2-1",
        comment: "Comment: CadetMaterial issued",
    },
    cadetMaterialOther: {
        type: typeList.find(t => t.dependend === "cadet" && t.relation === "material")!.id,
        materialType: testMaterials.find(i => i.typename === "Typ3-1")!.id,
        materialGroup: testMaterialGroups.find(i => i.description === "Gruppe3")!.id,
        description: "Gruppe3-Typ3-1",
        Comment: "Comment: CadetMaterial not issued"
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

    // E2E0275
    test('initalInspection', async () => {
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
                await inspectionComponent.txt_newDef_comment(3).fill(testDef.cadetMaterialOther.Comment);
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
                expect(resolved.map(r => r.id)).toBe(expect.arrayContaining(unresolvedDefIds.slice(0, 2)));
                resolved.map((res) => {
                    expect(res).toBe(expect.objectContaining({
                        fk_inspection_resolved: testActiveInspection.id,
                        userResolved: 'test4',
                        dateResolved: new Date(),
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
                    expect.soft(def!.DeficiencyCadet).toBeDefined();
                    expect.soft(def!.DeficiencyUniform).toBeUndefined();
                    expect.soft(def).toBe(expect.objectContaining({
                        id: expect.any(String),
                        description: testDef.cadet.description,
                        comment: testDef.cadet.comment,
                        userCreated: 'test4',
                        userUpdated: 'test4',
                        userResolved: null,
                        dateCreated: new Date(),
                        dateUpdated: new Date(),
                        dateResolved: null,
                        fk_inspection_resolved: null,
                        DeficiencyCadet: expect.objectContaining({
                            fk_cadet: cadetId,
                            fk_uniform: null,
                            fk_material: null,
                        }),
                    }));
                });
                await test.step('1: cadetUniform', async () => {
                    const def = defList.find(d => d.fk_deficiencyType === testDef.cadetUniform.type);

                    expect(def).toBeDefined();
                    expect.soft(def!.DeficiencyCadet).toBeDefined();
                    expect.soft(def!.DeficiencyUniform).toBeUndefined();
                    expect.soft(def).toBe(expect.objectContaining({
                        description: testDef.cadetUniform.description,
                        id: expect.any(String),
                        DeficiencyCadet: expect.objectContaining({
                            fk_cadet: cadetId,
                            fk_uniform: testDef.cadetUniform.uniform,
                            fk_material: null,
                        }),
                    }));
                });
                await test.step('2: cadetMaterial issued', async () => {
                    const def = defList.find(d => d.fk_deficiencyType === testDef.cadetMaterialIssued.type);

                    expect(def).toBeDefined();
                    expect.soft(def!.DeficiencyCadet).toBeDefined();
                    expect.soft(def!.DeficiencyUniform).toBeUndefined();
                    expect.soft(def).toBe(expect.objectContaining({
                        description: testDef.cadetMaterialIssued.description,
                        id: expect.any(String),
                        DeficiencyCadet: expect.objectContaining({
                            fk_cadet: cadetId,
                            fk_uniform: null,
                            fk_material: testDef.cadetMaterialIssued.material
                        }),
                    }));
                });
                await test.step('3: cadetMaterial other', async () => {
                    const def = defList.find(d => d.fk_deficiencyType === testDef.cadetMaterialOther.type);

                    expect(def).toBeDefined();
                    expect.soft(def!.DeficiencyCadet).toBeDefined();
                    expect.soft(def!.DeficiencyUniform).toBeUndefined();
                    expect.soft(def).toBe(expect.objectContaining({
                        id: expect.any(String),
                        description: testDef.cadetMaterialOther.description,
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
                    expect.soft(def!.DeficiencyCadet).toBeUndefined();
                    expect.soft(def!.DeficiencyUniform).toBeDefined();
                    expect.soft(def).toBe(expect.objectContaining({
                        id: expect.any(String),
                        description: testDef.uniform.description,
                        DeficiencyUniform: expect.objectContaining({
                            fk_uniform: testDef.uniform.uniform,
                        }),
                    }));
                });
            }),
        ]);
    });
    // E2E0281
    test('validate updated inspection', async () => {
        // TODO create Test
    });
});
