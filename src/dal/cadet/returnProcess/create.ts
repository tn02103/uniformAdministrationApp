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
    ).then(([{ assosiation }, { cadetId, returnProcessTemplateId, inspectorComment }]) =>
        prisma.$transaction(async (client) => {
            const cadet = await client.cadet.findUniqueOrThrow({
                where: { id: cadetId, fk_assosiation: assosiation },
            });

            if (cadet.status !== CadetStatus.ACTIVE) {
                throw new Error("Cadet is not ACTIVE");
            }

            let templateId = returnProcessTemplateId;
            if (!templateId) {
                const defaultTemplate = await client.returnProcessTemplate.findFirst({
                    where: { fk_assosiation: assosiation, defaultProcess: true },
                });
                if (!defaultTemplate) {
                    throw new Error("No default return process template found");
                }
                templateId = defaultTemplate.id;
            }

            const checklistItems = await client.returnChecklistTemplate.findMany({
                where: { fk_returnProcessTemplate: templateId, fk_assosiation: assosiation },
            });

            const returnProcess = await client.returnProcess.create({
                data: {
                    fk_cadet: cadetId,
                    fk_returnProcessTemplate: templateId,
                    fk_assosiation: assosiation,
                    inspectorComment: inspectorComment ?? null,
                    finished: false,
                    itemStatuses: {
                        createMany: {
                            data: checklistItems.map((item) => ({
                                fk_checklistItem: item.id,
                                completedAt: null,
                                completedByUser: null,
                            })),
                        },
                    },
                },
            });

            await client.cadet.update({
                where: { id: cadetId },
                data: { status: CadetStatus.RETURNING },
            });

            return returnProcess;
        })
    );
