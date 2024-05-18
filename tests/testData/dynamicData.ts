import { prisma } from "../../src/lib/db";
import { StaticDataIds } from "./staticDataIds";

export const dynamicDataIds: {
    inspectionId: string;
    firstInspection: {
        id: string;
        newDefIds: string[]
    };
    seccondInspection: {
        newDefId: string;
    }
}[] = [{
    inspectionId: "bbcea624-b6e0-4113-b870-2b9a7d4e80d1",
    firstInspection: {
        id: '8394f9cb-0acf-471c-827e-0f52539d21af',
        newDefIds: [
            '004774a8-a63c-4899-ba1d-9976cfc80352',
            '7ddc0958-24bb-4c30-8f81-01cc609a5c65',
            'f19b8b1f-372f-448f-ab61-648d6f980565',
            '488ac991-002f-4ba4-a8ed-e28bc3ad70f1',
            '1cb7f57b-269e-43a3-9c4a-b1962f8504b1'
        ]
    },
    seccondInspection: {
        newDefId: "b90045d8-a686-43cf-aea6-878edde2271e"
    }
}, {
    inspectionId: "d0d77a69-550b-4ff7-8d6c-c5742750abf7",
    firstInspection: {
        id: 'f5cd254f-eaf0-42c6-bfb0-0c862ea67e56',
        newDefIds: [
            '83ea3f04-4159-4d66-a831-3b35833e1a0b',
            '057379d0-40a3-4b4d-9b62-8229834e0a91',
            'ae8aec49-485c-47c2-b2fe-b8827d10b450',
            '9d9568d1-40e3-42f3-8429-5a8cb537b7ea',
            '275e03df-5cd5-41b9-a936-eb2953c7b946'
        ]
    },
    seccondInspection: {
        newDefId: "211cd3ef-4672-4714-9c3e-dc6dce757f26"
    }
}, {
    inspectionId: "684783a1-adae-4491-a0f6-1952e655908d",
    firstInspection: {
        id: 'ef09e450-75c2-4342-a758-7d9ea30b748c',
        newDefIds: [
            '3a99556f-f925-42cc-8cde-9ec5979115d7',
            '6e1dba5c-c2bb-4696-b15e-aa29988b0586',
            'd713118f-c9d0-4c7e-be64-e80cbcaedc2e',
            'de75bf5e-ead9-4a71-aaab-4e0081887af4',
            '2db20a86-742d-4a9c-9858-683743b9ccd3'
        ]
    },
    seccondInspection: {
        newDefId: "11cd1b95-f9ad-4290-80cf-336ea509a6a6"
    }
}, {
    inspectionId: "14e53a16-9819-415c-b22f-588ef408dd0d",
    firstInspection: {
        id: 'e72fcf2e-a712-4329-9d15-ac855aca148d',
        newDefIds: [
            '333fc3e2-0a10-4530-b158-c55086a9bfec',
            '4ca2024c-5510-495e-b5b8-f50927b05bff',
            'e25d9f8d-07a2-483a-a3dc-24e01fe25a2e',
            '2cd7f2ee-86ae-439d-ac8d-77288b850bda',
            'ac388c14-e06b-4bca-aa05-815eb9a47095'
        ]
    },
    seccondInspection: {
        newDefId: "f612b658-57c6-4625-aa27-748d86350ed5"
    }
}, {
    inspectionId: "0bdbccf2-033e-405e-9538-e0fbf8ac0d53",
    firstInspection: {
        id: '6f6ca125-9bad-4117-ba49-fa7dcb7d844c',
        newDefIds: [
            '65279bd6-7da9-45b7-93ac-4321098a876f',
            '0417a8b8-08a5-4045-abb1-841e6f1c258b',
            '3d27e261-2b82-4101-9240-fed253c1d0b5',
            'c46e8eda-64ef-49ed-a51b-74d483381f0c',
            '19a1263c-e8de-444c-95bd-dee063577286'
        ]
    },
    seccondInspection: {
        newDefId: "d3403dce-90a8-4fc7-ba73-c3e9956276b9"
    }
}];


export const startInspection = async (i: number) =>
    await prisma.inspection.create({
        data: {
            id: dynamicDataIds[i].inspectionId,
            fk_assosiation: StaticDataIds[i].fk_assosiation,
            active: true,
        },
    });

export const removeInspection = async (i: number) => {
    const insp = await prisma.inspection.findUnique({where: {id: dynamicDataIds[i].inspectionId}});
    if (insp !== null) {
        await prisma.inspection.delete({
            where: { id: dynamicDataIds[i].inspectionId }
        });
    }
}

export const svenKellerFirstInspectionData = (i: number) => ({
    id: dynamicDataIds[i].firstInspection.id,
    fk_cadet: StaticDataIds[i].cadetIds[2],
    fk_inspection: dynamicDataIds[i].inspectionId,
    uniformComplete: false,
    newDeficiencyList: [
        {
            id: dynamicDataIds[i].firstInspection.newDefIds[0],
            fk_deficiencyType: StaticDataIds[i].deficiencyTypeIds[1],
            description: 'new Deficiency1',
            comment: 'newDef cadet deficiency',
            userCreated: 'test3',
            userUpdated: 'test3',
            fk_inspection_created: dynamicDataIds[i].inspectionId,
            DeficiencyCadet: {
                create: {
                    fk_cadet: StaticDataIds[i].cadetIds[2]
                }
            }
        },
        {
            id: dynamicDataIds[i].firstInspection.newDefIds[1],
            fk_deficiencyType: StaticDataIds[i].deficiencyTypeIds[0],
            description: 'Typ1-1146',
            comment: 'newDef uniform deficiency',
            userCreated: 'test3',
            userUpdated: 'test3',
            fk_inspection_created: dynamicDataIds[i].inspectionId,
            DeficiencyUniform: {
                create: {
                    fk_uniform: StaticDataIds[i].uniformIds[0][46],
                }
            }
        },
        {
            id: dynamicDataIds[i].firstInspection.newDefIds[2],
            fk_deficiencyType: StaticDataIds[i].deficiencyTypeIds[3],
            description: 'Gruppe3-Typ3-3',
            comment: 'newDef cadetMaterial deficiency not issued',
            userCreated: 'test3',
            userUpdated: 'test3',
            fk_inspection_created: dynamicDataIds[i].inspectionId,
            DeficiencyCadet: {
                create: {
                    fk_cadet: StaticDataIds[i].cadetIds[2],
                    fk_material: StaticDataIds[i].materialIds[9],
                }
            }
        },
        {
            id: dynamicDataIds[i].firstInspection.newDefIds[3],
            fk_deficiencyType: StaticDataIds[i].deficiencyTypeIds[3],
            description: 'Gruppe2-Typ2-1',
            comment: 'newDef cadetMaterial deficiency issued',
            userCreated: 'test3',
            userUpdated: 'test3',
            fk_inspection_created: dynamicDataIds[i].inspectionId,
            DeficiencyCadet: {
                create: {
                    fk_cadet: StaticDataIds[i].cadetIds[2],
                    fk_material: StaticDataIds[i].materialIds[4],
                }
            }
        },
        {
            id: dynamicDataIds[i].firstInspection.newDefIds[4],
            fk_deficiencyType: StaticDataIds[i].deficiencyTypeIds[2],
            description: 'Typ1-1148',
            comment: 'newDef cadetUniform deficiency',
            userCreated: 'test3',
            userUpdated: 'test3',
            fk_inspection_created: dynamicDataIds[i].inspectionId,
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
        id: dynamicDataIds[i].seccondInspection.newDefId,
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
            fk_inspection_resolved: dynamicDataIds[i].inspectionId,
        }
    });

    await prisma.cadetInspection.create({
        data: {
            id: svenKellerFirstInspectionData(i).id,
            uniformComplete: svenKellerFirstInspectionData(i).uniformComplete,
            fk_cadet: svenKellerFirstInspectionData(i).fk_cadet,
            fk_inspection: dynamicDataIds[i].inspectionId,
        }
    });

    await Promise.all(
        svenKellerFirstInspectionData(i).newDeficiencyList.map(async (data) =>
            prisma.deficiency.create({ data })
        )
    );
}
