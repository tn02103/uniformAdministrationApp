import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { CadetStatus } from "@/prisma/client";
import { completeChecklistItemSchema, CompleteChecklistItemInput, completeChecklistSchema, CompleteChecklistInput } from "@/zod/resignationProcess";

/**
 * Marks a single checklist item as completed or uncompleted within a resignation process.
 * @param data resignationProcessId, checklistItemId, completed flag
 */
export const completeChecklistItem = (data: CompleteChecklistItemInput) =>
    genericSAValidator(
        AuthRole.inspector,
        data,
        completeChecklistItemSchema,
        { resignationProcessId: data.resignationProcessId }
    ).then(([{ username, assosiation }, { resignationProcessId, checklistItemId, completed }]) =>
        prisma.$transaction(async (client) => {
            const checklistItem = await client.resignationChecklistItemTemplate.findFirst({
                where: { id: checklistItemId, fk_assosiation: assosiation },
            });
            if (!checklistItem) {
                throw new Error("Checklist item not found or does not belong to the organisation");
            }

            const updateResult = await client.resignationChecklistItem.updateMany({
                where: {
                    processId: resignationProcessId,
                    checklistTemplateId: checklistItemId,
                    process: { fk_assosiation: assosiation },
                },
                data: {
                    completedAt: completed ? new Date() : null,
                    completedByUser: completed ? username : null,
                },
            });

            if (updateResult.count === 0) {
                throw new Error("Checklist item status not found");
            }

            await client.resignationProcess.update({
                where: { id: resignationProcessId, fk_assosiation: assosiation },
                data: { updatedAt: new Date() },
            });
        })
    );

/**
 * Finishes the resignation process without changing checklist item completion state.
 * Sets the cadet status to RESIGNED and ensures exit timestamps are set.
 * @param data resignationProcessId
 */
export const completeProcess = (data: CompleteChecklistInput) =>
    genericSAValidator(
        AuthRole.inspector,
        data,
        completeChecklistSchema,
        { resignationProcessId: data.resignationProcessId }
    ).then(([{ assosiation }, { resignationProcessId }]) =>
        prisma.$transaction(async (client) => {
            const now = new Date();

            await client.resignationProcess.update({
                where: { id: resignationProcessId, fk_assosiation: assosiation },
                data: { 
                    finished: true, 
                    updatedAt: now,
                    cadet: {
                        update: {
                            status: CadetStatus.RESIGNED,
                        }
                    }
                },
            });
        })
    );
