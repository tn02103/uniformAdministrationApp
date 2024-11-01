import { prisma } from "../../src/lib/db";
import { StaticData } from "./staticDataLoader";

export const startInspection = async (i: number) => {
    const ids = new StaticData(i).ids;
    await prisma.inspection.create({
        data: {
            id: ids.dynamic.inspectionId,
            fk_assosiation: ids.fk_assosiation,
            active: true,
        },
    });
}

export const removeInspection = async (i: number) => {
    const ids = new StaticData(i).ids;
    const insp = await prisma.inspection.findUnique({ where: { id: ids.dynamic.inspectionId } });
    if (insp !== null) {
        await prisma.inspection.delete({
            where: { id: ids.dynamic.inspectionId }
        });
    }
}

export const svenKellerFirstInspectionData = (i: number) => {
    const ids = new StaticData(i).ids;

    return ({
        id: ids.dynamic.firstInspection.id,
        fk_cadet: ids.cadetIds[2],
        fk_inspection: ids.dynamic.inspectionId,
        uniformComplete: false,
        newDeficiencyList: [
            {
                id: ids.dynamic.firstInspection.newDefIds[0],
                fk_deficiencyType: ids.deficiencyTypeIds[1],
                description: 'new Deficiency1',
                comment: 'newDef cadet deficiency',
                userCreated: 'test3',
                userUpdated: 'test3',
                fk_inspection_created: ids.dynamic.inspectionId,
                cadetDeficiency: {
                    create: {
                        fk_cadet: ids.cadetIds[2]
                    }
                }
            },
            {
                id: ids.dynamic.firstInspection.newDefIds[1],
                fk_deficiencyType: ids.deficiencyTypeIds[0],
                description: 'Typ1-1146',
                comment: 'newDef uniform deficiency',
                userCreated: 'test3',
                userUpdated: 'test3',
                fk_inspection_created: ids.dynamic.inspectionId,
                uniformDeficiency: {
                    create: {
                        fk_uniform: ids.uniformIds[0][46],
                    }
                }
            },
            {
                id: ids.dynamic.firstInspection.newDefIds[2],
                fk_deficiencyType: ids.deficiencyTypeIds[3],
                description: 'Gruppe3-Typ3-3',
                comment: 'newDef cadetMaterial deficiency not issued',
                userCreated: 'test3',
                userUpdated: 'test3',
                fk_inspection_created: ids.dynamic.inspectionId,
                cadetDeficiency: {
                    create: {
                        fk_cadet: ids.cadetIds[2],
                        fk_material: ids.materialIds[9],
                    }
                }
            },
            {
                id: ids.dynamic.firstInspection.newDefIds[3],
                fk_deficiencyType: ids.deficiencyTypeIds[3],
                description: 'Gruppe2-Typ2-1',
                comment: 'newDef cadetMaterial deficiency issued',
                userCreated: 'test3',
                userUpdated: 'test3',
                fk_inspection_created: ids.dynamic.inspectionId,
                cadetDeficiency: {
                    create: {
                        fk_cadet: ids.cadetIds[2],
                        fk_material: ids.materialIds[4],
                    }
                }
            },
            {
                id: ids.dynamic.firstInspection.newDefIds[4],
                fk_deficiencyType: ids.deficiencyTypeIds[2],
                description: 'Typ1-1148',
                comment: 'newDef cadetUniform deficiency',
                userCreated: 'test3',
                userUpdated: 'test3',
                fk_inspection_created: ids.dynamic.inspectionId,
                cadetDeficiency: {
                    create: {
                        fk_cadet: ids.cadetIds[2],
                        fk_uniform: ids.uniformIds[0][48],
                    }
                }
            }
        ],
        oldDefIdsToResolve: [
            ids.deficiencyIds[1],
            ids.deficiencyIds[5],
        ],
    });
}

export const svenKellerSecondInspectionData = (i: number) => {
    const ids = new StaticData(i).ids;
    return ({
        fk_cadet: svenKellerFirstInspectionData(i).fk_cadet,
        oldDefIdToUnsolve: svenKellerFirstInspectionData(i).oldDefIdsToResolve[0],
        oldDefIdToSolve: ids.deficiencyIds[9],
        newDefToDelete: {
            id: svenKellerFirstInspectionData(i).newDeficiencyList[4].id,
            comment: svenKellerFirstInspectionData(i).newDeficiencyList[4].comment,
        },
        newDefUpdated: {
            ...svenKellerFirstInspectionData(i).newDeficiencyList[1],
            description: 'Typ1-1148',
            newComment: 'uniform deficiency Updated comment',
            fk_uniform: ids.uniformIds[0][48],
        },
        newDefAdded: {
            id: ids.dynamic.seccondInspection.newDefId,
            fk_deficiencyType: ids.deficiencyTypeIds[2],
            description: 'Typ1-1146',
            comment: 'cadetUniform deficiency newly created',
            fk_uniform: ids.uniformIds[0][46],
        }
    });
}
export async function insertSvenKellerFirstInspection(i: number) {
    const ids = new StaticData(i).ids;

    await prisma.deficiency.updateMany({
        where: {
            id: { in: svenKellerFirstInspectionData(i).oldDefIdsToResolve }
        },
        data: {
            dateResolved: new Date(),
            userResolved: 'test3',
            fk_inspection_resolved: ids.dynamic.inspectionId,
        }
    });

    await prisma.cadetInspection.create({
        data: {
            id: svenKellerFirstInspectionData(i).id,
            uniformComplete: svenKellerFirstInspectionData(i).uniformComplete,
            fk_cadet: svenKellerFirstInspectionData(i).fk_cadet,
            fk_inspection: ids.dynamic.inspectionId,
            inspector: 'test3'
        }
    });

    await Promise.all(
        svenKellerFirstInspectionData(i).newDeficiencyList.map(async (data) =>
            prisma.deficiency.create({ data })
        )
    );
}
