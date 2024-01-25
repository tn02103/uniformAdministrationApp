import { Prisma } from "@prisma/client";
import { prisma } from "../../src/lib/db";
import { testAssosiation, testCadetDeficiencyTypes } from "./staticData";

export const testActiveInspection = {
    id: "855823c4-5478-11ee-b196-0068eb8ba754",
    fk_assosiation: testAssosiation.id,
}

export const startInspection = async () =>
    await prisma.inspection.create({
        data: testActiveInspection,
    });

export const svenKellerFirstInspectionData = {
    cadetInspectionId: 'c4d33a71-9283-11ee-8084-0068eb8ba754',
    fk_cadet: 'c4d33a71-3c11-11ee-8084-0068eb8ba754',
    fk_inspection: testActiveInspection.id,
    uniformComplete: false,
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
            id: 'fs223523-1334-11ee-8084-0068eb8ba754',
            deficiencyType: { id: testCadetDeficiencyTypes.find(dt => (dt.dependsOnUniformitem && !dt.addCommentToUniformitem))?.id },
            bodyDescription: 'new Deficiency2',
            actualDescription: 'Typ1-1148',
            comment: 'comment for def2',
            uniformId: "45f3337e-3c0d-11ee-8084-0068eb8ba754",
            dateCreated: null,
            dateResolved: null
        },
        {
            id: '63623474-1334-11ee-8084-0068eb8ba754',
            deficiencyType: { id: testCadetDeficiencyTypes.find(dt => (dt.dependsOnUniformitem && dt.addCommentToUniformitem))?.id },
            bodyDescription: 'new Deficiency3',
            actualDescription: 'Typ1-1146',
            comment: 'comment for def3',
            uniformId: "45f33205-3c0d-11ee-8084-0068eb8ba754",
            dateCreated: null,
            dateResolved: null
        }
    ],
    oldDeficiencyList: {
        '09868976-3dcf-11ee-ac41-0068eb8ba754': true,
        '345309ab-3dcf-11ee-ac41-0068eb8ba754': true,
        'ccffb98b-3dcf-11ee-ac41-0068eb8ba754': false,
        'ccff6a65-3dcf-11ee-ac41-0068eb8ba754': false
    }
}
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
}

export function getSvenKellerFistInspectionBody(firstInspection: boolean) {
    const data = firstInspection ? svenKellerFirstInspectionData : svenKellerSecondInspectionData;
    return {
        cadetInspectionId: firstInspection ? null : data.cadetInspectionId,
        uniformComplete: data.uniformComplete,
        newDeficiencyList: data.newDeficiencyList.map((def) => {
            return {
                id: firstInspection ? null : def.id,
                deficiencyType: def.deficiencyType,
                description: def.bodyDescription,
                uniformId: def.uniformId,
                comment: def.comment,
            }
        }),
        oldDeficiencyList: data.oldDeficiencyList,
    }
}

export async function insertSvenKellerFirstInspection() {
    await prisma.cadetDeficiency.updateMany({
        where: {
            id: { in: Object.entries(svenKellerFirstInspectionData.oldDeficiencyList).filter(([key, value]) => (value === true)).map(([key]) => key) }
        },
        data: {
            dateResolved: new Date(),
        }
    });

    await prisma.cadetInspection.create({
        data: {
            id: svenKellerFirstInspectionData.cadetInspectionId,
            uniformComplete: svenKellerFirstInspectionData.uniformComplete,
            fk_cadet: svenKellerFirstInspectionData.fk_cadet,
            fk_inspection: testActiveInspection.id,
            cadetDeficiency: {
                createMany: {
                    data: svenKellerFirstInspectionData.newDeficiencyList.map((def) => {
                        return {
                            id: def.id,
                            fk_deficiencyType: def.deficiencyType.id as string,
                            description: def.actualDescription,
                            comment: def.comment,
                            fk_cadet: svenKellerFirstInspectionData.fk_cadet
                        }
                    })
                }
            }
        }
    });
}
