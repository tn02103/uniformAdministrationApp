import { prisma } from "../../src/lib/db";
import  StaticDataIds  from "./staticDataIds.json";

export const startInspection = async (i: number) =>
    await prisma.inspection.create({
        data: {
            id: StaticDataIds[i].dynamic.inspectionId,
            fk_assosiation: StaticDataIds[i].fk_assosiation,
            active: true,
        },
    });

export const removeInspection = async (i: number) => {
    const insp = await prisma.inspection.findUnique({where: {id: StaticDataIds[i].dynamic.inspectionId}});
    if (insp !== null) {
        await prisma.inspection.delete({
            where: { id: StaticDataIds[i].dynamic.inspectionId }
        });
    }
}

export const svenKellerFirstInspectionData = (i: number) => ({
    id: StaticDataIds[i].dynamic.firstInspection.id,
    fk_cadet: StaticDataIds[i].cadetIds[2],
    fk_inspection: StaticDataIds[i].dynamic.inspectionId,
    uniformComplete: false,
    newDeficiencyList: [
        {
            id: StaticDataIds[i].dynamic.firstInspection.newDefIds[0],
            fk_deficiencyType: StaticDataIds[i].deficiencyTypeIds[1],
            description: 'new Deficiency1',
            comment: 'newDef cadet deficiency',
            userCreated: 'test3',
            userUpdated: 'test3',
            fk_inspection_created: StaticDataIds[i].dynamic.inspectionId,
            DeficiencyCadet: {
                create: {
                    fk_cadet: StaticDataIds[i].cadetIds[2]
                }
            }
        },
        {
            id: StaticDataIds[i].dynamic.firstInspection.newDefIds[1],
            fk_deficiencyType: StaticDataIds[i].deficiencyTypeIds[0],
            description: 'Typ1-1146',
            comment: 'newDef uniform deficiency',
            userCreated: 'test3',
            userUpdated: 'test3',
            fk_inspection_created: StaticDataIds[i].dynamic.inspectionId,
            DeficiencyUniform: {
                create: {
                    fk_uniform: StaticDataIds[i].uniformIds[0][46],
                }
            }
        },
        {
            id: StaticDataIds[i].dynamic.firstInspection.newDefIds[2],
            fk_deficiencyType: StaticDataIds[i].deficiencyTypeIds[3],
            description: 'Gruppe3-Typ3-3',
            comment: 'newDef cadetMaterial deficiency not issued',
            userCreated: 'test3',
            userUpdated: 'test3',
            fk_inspection_created: StaticDataIds[i].dynamic.inspectionId,
            DeficiencyCadet: {
                create: {
                    fk_cadet: StaticDataIds[i].cadetIds[2],
                    fk_material: StaticDataIds[i].materialIds[9],
                }
            }
        },
        {
            id: StaticDataIds[i].dynamic.firstInspection.newDefIds[3],
            fk_deficiencyType: StaticDataIds[i].deficiencyTypeIds[3],
            description: 'Gruppe2-Typ2-1',
            comment: 'newDef cadetMaterial deficiency issued',
            userCreated: 'test3',
            userUpdated: 'test3',
            fk_inspection_created: StaticDataIds[i].dynamic.inspectionId,
            DeficiencyCadet: {
                create: {
                    fk_cadet: StaticDataIds[i].cadetIds[2],
                    fk_material: StaticDataIds[i].materialIds[4],
                }
            }
        },
        {
            id: StaticDataIds[i].dynamic.firstInspection.newDefIds[4],
            fk_deficiencyType: StaticDataIds[i].deficiencyTypeIds[2],
            description: 'Typ1-1148',
            comment: 'newDef cadetUniform deficiency',
            userCreated: 'test3',
            userUpdated: 'test3',
            fk_inspection_created: StaticDataIds[i].dynamic.inspectionId,
            DeficiencyCadet: {
                create: {
                    fk_cadet: StaticDataIds[i].cadetIds[2],
                    fk_uniform: StaticDataIds[i].uniformIds[0][48],
                }
            }
        }
    ],
    oldDefIdsToResolve: [
        StaticDataIds[i].deficiencyIds[1],
        StaticDataIds[i].deficiencyIds[5],
    ],
})

export const svenKellerSecondInspectionData = (i: number) => ({
    fk_cadet: svenKellerFirstInspectionData(i).fk_cadet,
    oldDefIdToUnsolve: svenKellerFirstInspectionData(i).oldDefIdsToResolve[0],
    oldDefIdToSolve: StaticDataIds[i].deficiencyIds[9],
    newDefToDelete: {
        id: svenKellerFirstInspectionData(i).newDeficiencyList[4].id,
        comment: svenKellerFirstInspectionData(i).newDeficiencyList[4].comment,
    },
    newDefUpdated: {
        ...svenKellerFirstInspectionData(i).newDeficiencyList[1],
        description: 'Typ1-1148',
        newComment: 'uniform deficiency Updated comment',
        fk_uniform: StaticDataIds[i].uniformIds[0][48],
    },
    newDefAdded: {
        id: StaticDataIds[i].dynamic.seccondInspection.newDefId,
        fk_deficiencyType: StaticDataIds[i].deficiencyTypeIds[2],
        description: 'Typ1-1146',
        comment: 'cadetUniform deficiency newly created',
        fk_uniform: StaticDataIds[i].uniformIds[0][46],
    }
})

export async function insertSvenKellerFirstInspection(i: number) {
    await prisma.deficiency.updateMany({
        where: {
            id: { in: svenKellerFirstInspectionData(i).oldDefIdsToResolve }
        },
        data: {
            dateResolved: new Date(),
            userResolved: 'test3',
            fk_inspection_resolved: StaticDataIds[i].dynamic.inspectionId,
        }
    });

    await prisma.cadetInspection.create({
        data: {
            id: svenKellerFirstInspectionData(i).id,
            uniformComplete: svenKellerFirstInspectionData(i).uniformComplete,
            fk_cadet: svenKellerFirstInspectionData(i).fk_cadet,
            fk_inspection: StaticDataIds[i].dynamic.inspectionId,
        }
    });

    await Promise.all(
        svenKellerFirstInspectionData(i).newDeficiencyList.map(async (data) =>
            prisma.deficiency.create({ data })
        )
    );
}
