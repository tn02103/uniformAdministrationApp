import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/db";
import { Deficiency } from "@/types/deficiencyTypes";
import { CadetInspectionFormSchema } from "@/zod/deficiency";
import { z } from "zod";

/**
 * Fetches the inspection form data for a cadet.
 * 
 * @param props - The cadet ID.
 * @returns A promise that resolves to the inspection form data for the cadet.
 * @throws Will throw an error if no active inspection is found for today.
 */
export const getCadetInspectionFormData = async (props: string) => genericSAValidator(
    AuthRole.inspector,
    props,
    z.string().uuid(),
    { cadetId: props }
).then(async ([{ organisationId }, cadetId]) => {
    const activeInspection = await unsecuredGetActiveInspection(cadetId, organisationId);

    if (!activeInspection) {
        throw new Error("No active inspection found for today.");
    }

    const oldDeficiencies = await unsecuredGetPreviouslyUnresolvedDeficiencies(
        cadetId,
        activeInspection.organisationId,
        activeInspection.id
    )

    const [issuedMaterials, issuedCounts, uniformTypes] = await prisma.$transaction([
        prisma.material.findMany({
            where: {
                issuedEntries: {
                    some: {
                        fk_cadet: cadetId,
                        dateReturned: null,
                    },
                },
            },
        }),
        prisma.uniform.groupBy({
            by: ['fk_uniformType'],
            where: {
                issuedEntries: {
                    some: {
                        fk_cadet: cadetId,
                        dateReturned: null,
                    },
                },
            },
            _count: true,
            orderBy: {
                fk_uniformType: 'asc',
            }
        }),
        prisma.uniformType.findMany({
            where: {
                organisationId,
                recdelete: null,
            }
        }),
    ]);
    const uniformComplete = uniformTypes.every(type => {
        const count = issuedCounts.find(count => count.fk_uniformType === type.id);
        if (!count || typeof count._count !== 'number')
            return false;

        return count._count >= type.issuedDefault;
    });

    return {
        cadetId,
        uniformComplete,
        oldDeficiencyList: oldDeficiencies.map(def => ({
            id: def.id,
            typeId: def.type.id,
            typeName: def.type.name,
            description: def.description,
            comment: def.comment,
            dateCreated: def.dateCreated,
            resolved: def.dateResolved !== null,
        })),
        newDeficiencyList: activeInspection.deficiencyCreated.map(def => {
            const isIssued = def.cadetDeficiency?.fk_material && issuedMaterials.some(mat => mat.id === def.cadetDeficiency?.fk_material);

            return {
                id: def.id,
                typeId: def.type.id,
                description: def.description,
                comment: def.comment,
                uniformId: def.uniformDeficiency?.fk_uniform ?? def.cadetDeficiency?.fk_uniform ?? null,
                materialId: (isIssued ? def.cadetDeficiency?.fk_material : "other") ?? null,
                otherMaterialId: isIssued ? null : def.cadetDeficiency?.fk_material ?? null,
                otherMaterialGroupId: isIssued ? null : def.cadetDeficiency?.material?.fk_materialGroup ?? null,
                dateCreated: dayjs(def.dateCreated).format("YYYY-MM-DDTHH:mm:ss"),
            }
        }),
    } satisfies CadetInspectionFormSchema;
});

export const getUnresolvedByCadet = async (props: string): Promise<Deficiency[]> => genericSAValidator(
    AuthRole.inspector,
    props,
    z.string().uuid(),
    { cadetId: props }
).then(([, cadetId]) => {
    return prisma.$queryRaw`
            SELECT * FROM inspection.v_deficiency_by_cadet 
             WHERE fk_cadet = ${cadetId}
             AND "dateResolved" IS NULL
          ORDER BY "dateCreated"
        `;
});

// -----------  UNSECURED -------------
export const unsecuredGetPreviouslyUnresolvedDeficiencies = async (cadetId: string, organisationId: string, activeInspectionId: string) => {
    return prisma.deficiency.findMany({
        where: {
            type: { organisationId },
            AND: [
                {
                    OR: [
                        { fk_inspection_created: null },
                        { fk_inspection_created: { not: activeInspectionId } }
                    ]
                },
                {
                    OR: [
                        { cadetDeficiency: { fk_cadet: cadetId } },
                        {
                            uniformDeficiency: {
                                uniform: {
                                    issuedEntries: {
                                        some: {
                                            fk_cadet: cadetId,
                                            dateReturned: null,
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
                {
                    OR: [
                        { dateResolved: null },
                        { dateResolved: { not: null }, fk_inspection_resolved: activeInspectionId },
                    ],
                },
            ],
        },
        include: {
            type: true,
            cadetDeficiency: true,
            uniformDeficiency: true,
        },
        orderBy: [
            { dateCreated: 'asc' },
            { description: 'asc' }
        ]
    });
}

export const unsecuredGetActiveInspection = async (cadetId: string, organisationId: string) => {
    return await prisma.inspection.findFirst({
        where: {
            organisationId,
            date: dayjs().format("YYYY-MM-DD"),
            timeStart: { not: null },
            timeEnd: null,
        },
        include: {
            cadetInspection: {
                where: {
                    fk_cadet: cadetId,
                },
            },
            deficiencyCreated: {
                where: {
                    OR: [
                        { cadetDeficiency: { fk_cadet: cadetId } },
                        {
                            uniformDeficiency: {
                                uniform: {
                                    issuedEntries: {
                                        some: {
                                            fk_cadet: cadetId,
                                            dateReturned: null,
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
                include: {
                    type: true,
                    cadetDeficiency: {
                        include: {
                            material: true,
                        },
                    },
                    uniformDeficiency: true,
                },
                orderBy: {
                    type: {name: "asc"},
                }
            },
        },
    });
}
