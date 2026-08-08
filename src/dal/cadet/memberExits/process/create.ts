import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { CadetStatus, Prisma } from "@/prisma/client";
import { createReturnProcessSchema, CreateReturnProcessInput } from "@/zod/returnProcess";

/**
 * Returns selected uniform items and materials for a cadet, and resolves all open deficiencies.
 * Used as part of the Vereinsaustritt flow within an existing transaction.
 */
export const __unsecuredProcessCadetEquipmentReturn = async (
    client: Prisma.TransactionClient,
    cadetId: string,
    assosiation: string,
    username: string,
    selectedUniformIds: string[],
    selectedMaterialIds: string[],
) => {
    const now = new Date();

    // Return selected uniform items
    if (selectedUniformIds.length > 0) {
        await client.uniformIssued.updateMany({
            where: {
                uniform: {
                    is: {
                        id: { in: selectedUniformIds },
                        type: { fk_assosiation: assosiation },
                        recdelete: null,
                    },
                },
                fk_cadet: cadetId,
                dateReturned: null,
            },
            data: { dateReturned: now },
        });
    }

    // Return selected materials (by material type ID)
    if (selectedMaterialIds.length > 0) {
        await client.materialIssued.updateMany({
            where: {
                material: {
                    is: {
                        id: { in: selectedMaterialIds },
                        materialGroup: { fk_assosiation: assosiation },
                    },
                },
                fk_cadet: cadetId,
                dateReturned: null,
            },
            data: { dateReturned: now },
        });
    }

    // Resolve all open deficiencies for the cadet
    await client.deficiency.updateMany({
        where: {
            fk_cadet: cadetId,
            dateResolved: null,
            type: { fk_assosiation: assosiation },
        },
        data: {
            dateResolved: now,
            userResolved: username,
        },
    });
};

/**
 * Creates a new return process for a cadet, generating checklist item statuses from the template.
 * Also returns selected uniform items/materials and resolves all open deficiencies.
 * Sets the cadet status to RETURNING or RETURNED depending on the finished flag.
 * @param data cadetId, returnProcessTemplateId, and optional fields
 * @returns the created ReturnProcess
 */
export const create = (data: CreateReturnProcessInput) =>
    genericSAValidator(
        AuthRole.inspector,
        data,
        createReturnProcessSchema,
        {
            cadetId: data.cadetId,
            returnProcessTemplateId: data.returnProcessTemplateId,
        }
    ).then(([{ assosiation, username }, { cadetId, returnProcessTemplateId, inspectorComment, preCheckedItemIds, finished, selectedUniformIds, selectedMaterialIds }]) =>
        prisma.$transaction(async (client) => {
            const now = new Date();
            const cadet = await client.cadet.findUniqueOrThrow({
                where: { id: cadetId, fk_assosiation: assosiation, deletedAt: null },
            });

            if (cadet.status !== CadetStatus.ACTIVE) {
                throw new Error("Cadet is not ACTIVE");
            }

            const checklistItems = await client.returnChecklistTemplate.findMany({
                where: { fk_returnProcessTemplate: returnProcessTemplateId, fk_assosiation: assosiation },
            });

            const validPreCheckedItemIds = (preCheckedItemIds ?? []).filter((id) =>
                checklistItems.some((item) => item.id === id)
            );

            const isFinished = finished ?? false;

            // Return equipment and resolve deficiencies
            await __unsecuredProcessCadetEquipmentReturn(
                client,
                cadetId,
                assosiation,
                username,
                selectedUniformIds ?? [],
                selectedMaterialIds ?? [],
            );

            const returnProcess = await client.returnProcess.create({
                data: {
                    fk_cadet: cadetId,
                    fk_returnProcessTemplate: returnProcessTemplateId,
                    fk_assosiation: assosiation,
                    inspectorComment: inspectorComment ?? null,
                    finished: isFinished,
                    itemStatuses: {
                        createMany: {
                            data: checklistItems.map((item) => {
                                const isPreChecked = validPreCheckedItemIds.includes(item.id);
                                return {
                                    fk_checklistItem: item.id,
                                    completedAt: isPreChecked ? new Date() : null,
                                    completedByUser: isPreChecked ? username : null,
                                };
                            }),
                        },
                    },
                },
            });

            await client.cadet.update({
                where: { id: cadetId, fk_assosiation: assosiation, deletedAt: null },
                data: {
                    status: isFinished ? CadetStatus.RETURNED : CadetStatus.RETURNING,
                    returnStartedAt: cadet.returnStartedAt ?? now,
                    returnEndedAt: isFinished ? now : null,
                },
            });

            return returnProcess;
        })
    );
