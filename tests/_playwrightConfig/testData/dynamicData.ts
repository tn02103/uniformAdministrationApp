import { prisma } from "../../../src/lib/db";
import { StaticData } from "./staticDataLoader";

export async function startInspection(i: number) {
    const staticData = new StaticData(i);
    await prisma.inspection.update({
        where: { id: staticData.ids.inspectionIds[4] },
        data: { timeStart: new Date() }
    });
}
export async function finishInspection(i: number) {
    const staticData = new StaticData(i);
    await prisma.inspection.update({
        where: { id: staticData.ids.inspectionIds[4] },
        data: { timeEnd: new Date() }
    });
}
export const svenKellerFirstInspectionData = (i: number) => {
    const staticData = new StaticData(i);
    return {
        id: staticData.ids.dynamic.firstInspection.id,
        fk_cadet: staticData.ids.cadetIds[2],
        fk_inspection: staticData.ids.inspectionIds[4],
        uniformComplete: false,
        newDeficiencyList: [
            {
                id: staticData.ids.dynamic.firstInspection.newDefIds[0],
                fk_deficiencyType: staticData.ids.deficiencyTypeIds[1],
                description: 'new Deficiency1',
                comment: 'newDef cadet deficiency',
                userCreated: 'test3',
                userUpdated: 'test3',
                fk_inspection_created: staticData.ids.inspectionIds[4],
                cadetDeficiency: {
                    create: {
                        fk_cadet: staticData.ids.cadetIds[2]
                    }
                }
            },
            {
                id: staticData.ids.dynamic.firstInspection.newDefIds[1],
                fk_deficiencyType: staticData.ids.deficiencyTypeIds[0],
                description: 'Typ1-1146',
                comment: 'newDef uniform deficiency',
                userCreated: 'test3',
                userUpdated: 'test3',
                fk_inspection_created: staticData.ids.inspectionIds[4],
                uniformDeficiency: {
                    create: {
                        fk_uniform: staticData.ids.uniformIds[0][46],
                    }
                }
            },
            {
                id: staticData.ids.dynamic.firstInspection.newDefIds[2],
                fk_deficiencyType: staticData.ids.deficiencyTypeIds[3],
                description: 'Gruppe3-Typ3-3',
                comment: 'newDef cadetMaterial deficiency not issued',
                userCreated: 'test3',
                userUpdated: 'test3',
                fk_inspection_created: staticData.ids.inspectionIds[4],
                cadetDeficiency: {
                    create: {
                        fk_cadet: staticData.ids.cadetIds[2],
                        fk_material: staticData.ids.materialIds[9],
                    }
                }
            },
            {
                id: staticData.ids.dynamic.firstInspection.newDefIds[3],
                fk_deficiencyType: staticData.ids.deficiencyTypeIds[3],
                description: 'Gruppe2-Typ2-1',
                comment: 'newDef cadetMaterial deficiency issued',
                userCreated: 'test3',
                userUpdated: 'test3',
                fk_inspection_created: staticData.ids.inspectionIds[4],
                cadetDeficiency: {
                    create: {
                        fk_cadet: staticData.ids.cadetIds[2],
                        fk_material: staticData.ids.materialIds[4],
                    }
                }
            },
            {
                id: staticData.ids.dynamic.firstInspection.newDefIds[4],
                fk_deficiencyType: staticData.ids.deficiencyTypeIds[2],
                description: 'Typ1-1148',
                comment: 'newDef cadetUniform deficiency',
                userCreated: 'test3',
                userUpdated: 'test3',
                fk_inspection_created: staticData.ids.inspectionIds[4],
                cadetDeficiency: {
                    create: {
                        fk_cadet: staticData.ids.cadetIds[2],
                        fk_uniform: staticData.ids.uniformIds[0][48],
                    }
                }
            }
        ],
        oldDefIdsToResolve: [
            staticData.ids.deficiencyIds[1],
            staticData.ids.deficiencyIds[5],
        ],
    }
}

export const svenKellerSecondInspectionData = (i: number) => {
    const staticData = new StaticData(i);
    return {
        fk_cadet: svenKellerFirstInspectionData(i).fk_cadet,
        oldDefIdToUnsolve: svenKellerFirstInspectionData(i).oldDefIdsToResolve[0],
        oldDefIdToSolve: staticData.ids.deficiencyIds[9],
        newDefToDelete: {
            id: svenKellerFirstInspectionData(i).newDeficiencyList[4].id,
            comment: svenKellerFirstInspectionData(i).newDeficiencyList[4].comment,
        },
        newDefUpdated: {
            ...svenKellerFirstInspectionData(i).newDeficiencyList[1],
            description: 'Typ1-1148',
            newComment: 'uniform deficiency Updated comment',
            fk_uniform: staticData.ids.uniformIds[0][48],
        },
        newDefAdded: {
            id: staticData.ids.dynamic.seccondInspection.newDefId,
            fk_deficiencyType: staticData.ids.deficiencyTypeIds[2],
            description: 'Typ1-1146',
            comment: 'cadetUniform deficiency newly created',
            fk_uniform: staticData.ids.uniformIds[0][46],
        }
    }
}

export async function insertSvenKellerFirstInspection(i: number) {
    const staticData = new StaticData(i);
    await prisma.deficiency.updateMany({
        where: {
            id: { in: svenKellerFirstInspectionData(i).oldDefIdsToResolve }
        },
        data: {
            dateResolved: new Date(),
            userResolved: 'test3',
            fk_inspection_resolved: staticData.ids.inspectionIds[4],
        }
    });

    await prisma.cadetInspection.create({
        data: {
            id: svenKellerFirstInspectionData(i).id,
            uniformComplete: svenKellerFirstInspectionData(i).uniformComplete,
            fk_cadet: svenKellerFirstInspectionData(i).fk_cadet,
            fk_inspection: staticData.ids.inspectionIds[4],
            inspector: 'test3'
        }
    });

    await Promise.all(
        svenKellerFirstInspectionData(i).newDeficiencyList.map(async (data) =>
            prisma.deficiency.create({ data })
        )
    );
}
