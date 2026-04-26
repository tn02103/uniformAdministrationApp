import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { CadetStatus } from "@/prisma/client";
import { createReturnProcessSchema, CreateReturnProcessInput } from "@/zod/returnProcess";

/**
 * Creates a new return process for a cadet, generating checklist item statuses from the template.
 * Sets the cadet status to RETURNING.
 * @param data cadetId, optional returnProcessTemplateId and inspectorComment
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
    ).then(([{ assosiation, username }, { cadetId, returnProcessTemplateId, inspectorComment, preCheckedItemIds, finished }]) =>
        prisma.$transaction(async (client) => {
            const cadet = await client.cadet.findUniqueOrThrow({
                where: { id: cadetId, fk_assosiation: assosiation, deletedAt: null },
            });

            if (cadet.status !== CadetStatus.ACTIVE) {
                throw new Error("Cadet is not ACTIVE");
            }

            const checklistItems = await client.returnChecklistTemplate.findMany({
                where: { fk_returnProcessTemplate: returnProcessTemplateId, fk_assosiation: assosiation },
            });

            if (returnProcessTemplateId !== undefined && returnProcessTemplateId !== null) {
                const templateExists = await client.returnProcessTemplate.findFirst({
                    where: { id: returnProcessTemplateId, fk_assosiation: assosiation },
                    select: { id: true },
                });
                if (!templateExists) {
                    throw new Error("ReturnProcessTemplate not found or does not belong to organisation");
                }
            }

            const validPreCheckedItemIds = (preCheckedItemIds ?? []).filter((id) =>
                checklistItems.some((item) => item.id === id)
            );

            const isFinished = finished ?? false;

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
                data: { status: isFinished ? CadetStatus.RETURNED : CadetStatus.RETURNING },
            });

            return returnProcess;
        })
    );
