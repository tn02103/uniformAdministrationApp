import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { CadetInspectionFormSchema, cadetInspectionFormSchema } from "@/zod/deficiency";
import { PrismaPromise } from "@prisma/client";
import { unsecuredGetActiveInspection } from "./get";


export const saveCadetInspection = async (props: CadetInspectionFormSchema) => genericSAValidator(
    AuthRole.inspector,
    props,
    cadetInspectionFormSchema,
    { cadetId: props.cadetId }
).then(async ([{ assosiation, username }, { cadetId, newDeficiencyList, oldDeficiencyList, uniformComplete }]) => {
    // Check if Inspection is active
    const inspection = await unsecuredGetActiveInspection(cadetId, assosiation);
    if (!inspection) {
        throw new Error("Could not save CadetInspection since no inspection is active");
    }

    await prisma.$transaction(async (client) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbPromises: PrismaPromise<any>[] = [];
        // DEREGISTRATIONS
        dbPromises.push(
            client.deregistration.deleteMany({
                where: {
                    fk_cadet: cadetId,
                    fk_inspection: inspection.id,
                },
            })
        );

        // INSERT | UPDATE cadet_inspection
        dbPromises.push(
            client.cadetInspection.upsert({
                where: {
                    fk_inspection_fk_cadet: {
                        fk_inspection: inspection.id,
                        fk_cadet: cadetId,
                    }
                },
                update: {
                    uniformComplete: uniformComplete,
                    inspector: username,
                },
                create: {
                    fk_cadet: cadetId,
                    fk_inspection: inspection.id,
                    uniformComplete: uniformComplete,
                    inspector: username,
                },
            })
        );

        // RESOLVING OLD DEFICIENCIES
        if (oldDeficiencyList) {
            // -- resolving & unresolving deficiencies
            const resolvedOldDefIds = oldDeficiencyList.filter(d => d.resolved).map(d => d.id);
            if (resolvedOldDefIds.length > 0) {
                dbPromises.push(
                    client.deficiency.updateMany({
                        where: {
                            id: { in: resolvedOldDefIds },
                            type: { fk_assosiation: assosiation },
                            dateResolved: null,
                        },
                        data: {
                            dateResolved: new Date(),
                            userResolved: username,
                            fk_inspection_resolved: inspection.id,
                        },
                    })
                );
            }
            const unresolvedOldDefIds = oldDeficiencyList.filter(d => !d.resolved).map(d => d.id);
            if (unresolvedOldDefIds.length > 0) {
                dbPromises.push(
                    client.deficiency.updateMany({
                        where: {
                            id: { in: unresolvedOldDefIds },
                            type: { fk_assosiation: assosiation },
                            dateResolved: { not: null },
                        },
                        data: {
                            dateResolved: null,
                            userResolved: null,
                            fk_inspection_resolved: null,
                        },
                    })
                );
            }
        }

        // UPDATE AND CREATE NEW DEFICIENCIES
        await Promise.all(newDeficiencyList.map(async (def) => {
            // -- get data
            const type = await prisma.deficiencyType.findUniqueOrThrow({
                where: {
                    id: def.typeId,
                    AND: {
                        fk_assosiation: assosiation,
                    }
                }
            });
            // -- prepare data
            if (type.dependent === "uniform" || type.relation === "uniform") {
                if (!def.uniformId) throw Error("Could not save new Deficiency fk_uniform is missing");
                const uniform = await prisma.uniform.findUniqueOrThrow({
                    where: {
                        id: def.uniformId,
                        type: { fk_assosiation: assosiation }
                    },
                    include: {
                        type: true
                    }
                });

                def.description = `${uniform.type.name}-${uniform.number}`;
            }

            const materialId = (def.materialId === "other") ? def.otherMaterialId : def.materialId;
            if (type.relation === "material") {
                if (!materialId) throw Error("Could not save new Deficiency fk_material is missing");

                const material = await prisma.material.findUniqueOrThrow({
                    where: {
                        id: materialId,
                        AND: { materialGroup: { fk_assosiation: assosiation } },
                    },
                    include: { materialGroup: true }
                });
                def.description = `${material.materialGroup.description}-${material.typename}`;
            }

            if (!def.description) throw new Error("Could not save Deficiency description is missing");

            // -- save data
            const dbDeficiency = await client.deficiency.upsert({
                where: {
                    id: def.id ?? undefined,
                    AND: { type: { fk_assosiation: assosiation } }
                },
                create: {
                    fk_deficiencyType: def.typeId,
                    description: def.description,
                    comment: def.comment,
                    userCreated: username,
                    userUpdated: username,
                    fk_inspection_created: inspection.id,
                },
                update: {
                    description: def.description,
                    comment: def.comment,
                    userUpdated: username,
                    dateUpdated: new Date(),
                }
            });

            if (type.dependent === "uniform") {
                dbPromises.push(
                    client.uniformDeficiency.upsert({
                        where: { deficiencyId: dbDeficiency.id },
                        create: {
                            deficiencyId: dbDeficiency.id,
                            fk_uniform: def.uniformId!,
                        },
                        update: {
                            fk_uniform: def.uniformId!,
                        },
                    })
                );
            } else {
                dbPromises.push(
                    client.cadetDeficiency.upsert({
                        where: { deficiencyId: dbDeficiency.id },
                        create: {
                            deficiencyId: dbDeficiency.id,
                            fk_cadet: cadetId,
                            fk_material: (type.relation === "material") ? materialId : undefined,
                            fk_uniform: (type.relation === "uniform") ? def.uniformId : undefined
                        },
                        update: {
                            fk_material: (type.relation === "material") ? materialId : undefined,
                            fk_uniform: (type.relation === "uniform") ? def.uniformId : undefined,
                        }
                    })
                )
            }

            // -- remove from list
            if (inspection.deficiencyCreated) {
                inspection.deficiencyCreated = inspection.deficiencyCreated.filter(d => d.id !== dbDeficiency.id);
            }
        }));

        // DELETE deficiencies not removed from list
        if (inspection.deficiencyCreated.length > 0) {
            dbPromises.push(
                client.deficiency.deleteMany({
                    where: {
                        id: {
                            in: inspection.deficiencyCreated.map(d => d.id!)
                        },
                        type: { fk_assosiation: assosiation }
                    },
                })
            );
        }

        await Promise.all(dbPromises);
    });
});
