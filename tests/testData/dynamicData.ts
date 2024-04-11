import { prisma } from "../../src/lib/db";
import { testAssosiation, testDeficiencyTypes, testMaterials, testUniformItems } from "./staticData";

export const testActiveInspection = {
    id: "855823c4-5478-11ee-b196-0068eb8ba754",
    fk_assosiation: testAssosiation.id,
    active: true
}

export const startInspection = async () =>
    await prisma.inspection.create({
        data: testActiveInspection,
    });

export const removeInspection = async () =>
    prisma.inspection.delete({
        where: { id: testActiveInspection.id }
    });

const filterdTypes = testDeficiencyTypes.filter(t => t.fk_assosiation === testAssosiation.id && t.recdelete === null);
const svenKellerId = 'c4d33a71-3c11-11ee-8084-0068eb8ba754';
export const svenKellerFirstInspectionData = {
    cadetInspectionId: 'c4d33a71-9283-11ee-8084-0068eb8ba754',
    fk_cadet: 'c4d33a71-3c11-11ee-8084-0068eb8ba754',
    fk_inspection: testActiveInspection.id,
    uniformComplete: false,
    newDeficiencyList: [
        {
            id: 'c4d33a71-1334-11ee-8084-0068eb8ba754',
            fk_deficiencyType: filterdTypes.find(t => t.dependend === "cadet" && t.relation === null)!.id,
            description: 'new Deficiency1',
            comment: 'cadet deficiency',
            userCreated: 'test3',
            userUpdated: 'test3',
            fk_inspection_created: testActiveInspection.id,
            DeficiencyCadet: {
                create: {
                    fk_cadet: svenKellerId
                }
            }
        },
        {
            id: 'fs223523-1334-11ee-8084-0068eb8ba754',
            fk_deficiencyType: filterdTypes.find(t => t.dependend === "uniform" && t.relation === null)!.id,
            description: 'Typ1-1146',
            comment: 'uniform deficiency',
            userCreated: 'test3',
            userUpdated: 'test3',
            fk_inspection_created: testActiveInspection.id,
            DeficiencyUniform: {
                create: {
                    fk_uniform: testUniformItems.find(i => i.number === 1146)!.id,
                }
            }
        },
        {
            id: '4c9f3d6f-a757-489b-ae97-f88dc39e74aa',
            fk_deficiencyType: filterdTypes.find(t => t.dependend === "cadet" && t.relation === "material")!.id,
            description: 'Gruppe3-Typ3-3',
            comment: 'cadetMaterial deficiency not issued',
            userCreated: 'test3',
            userUpdated: 'test3',
            fk_inspection_created: testActiveInspection.id,
            DeficiencyCadet: {
                create: {
                    fk_cadet: svenKellerId,
                    fk_material: testMaterials.find(m => m.typename === "Typ3-3")!.id,
                }
            }
        },
        {
            id: '0b95b1c4-3672-4955-98c4-fe578607d6e8',
            fk_deficiencyType: filterdTypes.find(t => t.dependend === "cadet" && t.relation === "material")!.id,
            description: 'Gruppe2-Typ2-1',
            comment: 'cadetMaterial deficiency issued',
            userCreated: 'test3',
            userUpdated: 'test3',
            fk_inspection_created: testActiveInspection.id,
            DeficiencyCadet: {
                create: {
                    fk_cadet: svenKellerId,
                    fk_material: testMaterials.find(m => m.typename === "Typ2-1")!.id,
                }
            }
        },
        {
            id: '7624af40-0f9d-43c6-8db5-23da1447a06b',
            fk_deficiencyType: filterdTypes.find(t => t.dependend === "cadet" && t.relation === "uniform")!.id,
            description: 'Typ1-1148',
            comment: 'cadetUniform deficiency',
            userCreated: 'test3',
            userUpdated: 'test3',
            fk_inspection_created: testActiveInspection.id,
            DeficiencyCadet: {
                create: {
                    fk_cadet: svenKellerId,
                    fk_uniform: testUniformItems.find(i => i.number === 1148)!.id,
                }
            }
        }
    ],
    oldDefIdsToResolve: [
        'ccffb98b-3dcf-11ee-ac41-0068eb8ba754',
        '09868976-3dcf-11ee-ac41-0068eb8ba754'
    ],

}

export const svenKellerSecondInspectionData = {
    fk_cadet: svenKellerFirstInspectionData.fk_cadet,
    oldDefIdToUnsolve: svenKellerFirstInspectionData.oldDefIdsToResolve[0],
    oldDefIdToSolve: 'ccff6a65-3dcf-11ee-ac41-0068eb8ba754',
    newDefToDelete: {
        id: svenKellerFirstInspectionData.newDeficiencyList[4].id,
        comment: svenKellerFirstInspectionData.newDeficiencyList[4].comment,
    },
    newDefUpdated: {
        ...svenKellerFirstInspectionData.newDeficiencyList[1],
        description: 'Typ1-1148',
        newComment: 'uniform deficiency Updated comment',
        fk_uniform: testUniformItems.find(i => i.number === 1148)!.id,
    },
    newDefAdded: {
        id: '98723938-0f9d-43c6-8db5-23da1447a06b',
        fk_deficiencyType: filterdTypes.find(t => t.dependend === "cadet" && t.relation === "uniform")!.id,
        description: 'Typ1-1146',
        comment: 'cadetUniform deficiency newly created',
        fk_uniform: testUniformItems.find(i => i.number === 1146)!.id,
    }
}
/*
export const svenKellerSecondInspectionData = {
    cadetInspectionId: 'c4d33a71-9283-11ee-8084-0068eb8ba754',
    fk_cadet: 'c4d33a71-3c11-11ee-8084-0068eb8ba754',
    fk_inspection: testActiveInspection.id,
    uniformComplete: true,
    newDeficiencyList: [
        {
            id: 'c4d33a71-1334-11ee-8084-0068eb8ba754',
            deficiencyType: { id: testCadetDeficiencyTypes.find(dt => !dt.dependsOnUniformitem)?.id },
            bodyDescription: 'new Deficiency1',
            actualDescription: 'new Deficiency1',
            comment: 'comment for def1',
            dateCreated: null,
            dateResolved: null
        },
        {
            id: '63623474-1334-11ee-8084-0068eb8ba754',
            deficiencyType: { id: testCadetDeficiencyTypes.find(dt => (dt.dependsOnUniformitem && dt.addCommentToUniformitem))?.id },
            bodyDescription: 'new Deficiency3',
            actualDescription: 'Typ1-1148',
            comment: 'comment for def3 updated version',
            uniformId: "45f3337e-3c0d-11ee-8084-0068eb8ba754",
            dateCreated: null,
            dateResolved: null
        },
        {
            deficiencyType: { id: testCadetDeficiencyTypes.find(dt => (dt.dependsOnUniformitem && dt.addCommentToUniformitem))?.id },
            bodyDescription: 'new Deficiency4',
            actualDescription: 'Typ1-1148',
            comment: 'comment for def4',
            uniformId: "45f3337e-3c0d-11ee-8084-0068eb8ba754",
            dateCreated: null,
            dateResolved: null
        },
    ],
    oldDeficiencyList: {
        '09868976-3dcf-11ee-ac41-0068eb8ba754': true,
        '345309ab-3dcf-11ee-ac41-0068eb8ba754': false,
        'ccffb98b-3dcf-11ee-ac41-0068eb8ba754': true,
        'ccff6a65-3dcf-11ee-ac41-0068eb8ba754': false
    }
}*/

export async function insertSvenKellerFirstInspection() {
    await prisma.deficiency.updateMany({
        where: {
            id: { in: svenKellerFirstInspectionData.oldDefIdsToResolve }
        },
        data: {
            dateResolved: new Date(),
            userResolved: 'test3',
            fk_inspection_resolved: testActiveInspection.id,
        }
    });

    await prisma.cadetInspection.create({
        data: {
            id: svenKellerFirstInspectionData.cadetInspectionId,
            uniformComplete: svenKellerFirstInspectionData.uniformComplete,
            fk_cadet: svenKellerFirstInspectionData.fk_cadet,
            fk_inspection: testActiveInspection.id,
        }
    });

    await Promise.all(
        svenKellerFirstInspectionData.newDeficiencyList.map(async (data) =>
            prisma.deficiency.create({ data })
        )
    );
}
