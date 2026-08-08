import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { CadetStatus } from "@/prisma/client";
import { completeChecklistItemSchema, CompleteChecklistItemInput, completeChecklistSchema, CompleteChecklistInput } from "@/zod/returnProcess";

/**
 * Marks a single checklist item as completed or uncompleted within a return process.
 * @param data returnProcessId, checklistItemId, completed flag
 */
export const completeChecklistItem = (data: CompleteChecklistItemInput) =>
    genericSAValidator(
        AuthRole.inspector,
        data,
        completeChecklistItemSchema,
        { returnProcessId: data.returnProcessId }
    ).then(([{ username, assosiation }, { returnProcessId, checklistItemId, completed }]) =>
        prisma.$transaction(async (client) => {
            const checklistItem = await client.returnChecklistTemplate.findFirst({
                where: { id: checklistItemId, fk_assosiation: assosiation },
            });
            if (!checklistItem) {
                throw new Error("Checklist item not found or does not belong to the organisation");
            }

            const updateResult = await client.returnChecklistItemStatus.updateMany({
                where: {
                    fk_returnProcess: returnProcessId,
                    fk_checklistItem: checklistItemId,
                    returnProcess: { fk_assosiation: assosiation },
                },
                data: {
                    completedAt: completed ? new Date() : null,
                    completedByUser: completed ? username : null,
                },
            });

            if (updateResult.count === 0) {
                throw new Error("Checklist item status not found");
            }

            await client.returnProcess.update({
                where: { id: returnProcessId, fk_assosiation: assosiation },
                data: { updatedAt: new Date() },
            });
        })
    );

/**
 * Finishes the return process without changing checklist item completion state.
 * Sets the cadet status to RETURNED and ensures return timestamps are set.
 * @param data returnProcessId
 */
export const completeProcess = (data: CompleteChecklistInput) =>
    genericSAValidator(
        AuthRole.inspector,
        data,
        completeChecklistSchema,
        { returnProcessId: data.returnProcessId }
    ).then(([{ assosiation }, { returnProcessId }]) =>
        prisma.$transaction(async (client) => {
            const now = new Date();

            const returnProcess = await client.returnProcess.findFirstOrThrow({
                where: { id: returnProcessId, fk_assosiation: assosiation },
                select: { fk_cadet: true },
            });

            await client.returnProcess.update({
                where: { id: returnProcessId, fk_assosiation: assosiation },
                data: { finished: true, updatedAt: now },
            });

            const cadet = await client.cadet.findUniqueOrThrow({
                where: { id: returnProcess.fk_cadet, fk_assosiation: assosiation, deletedAt: null },
                select: { returnStartedAt: true },
            });

            await client.cadet.update({
                where: { id: returnProcess.fk_cadet, fk_assosiation: assosiation, deletedAt: null },
                data: {
                    status: CadetStatus.RETURNED,
                    returnStartedAt: cadet.returnStartedAt ?? now,
                    returnEndedAt: now,
                },
            });
        })
    );
