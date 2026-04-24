import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { createReturnChecklistTemplateSchema, CreateReturnChecklistTemplateInput } from "@/zod/returnProcess";

/**
 * Creates a new checklist item for a return process template.
 * sortOrder is auto-calculated as MAX(existing) + 1 (or 0 if no items exist).
 * @param data returnProcessTemplateId, label
 * @returns the created ReturnChecklistTemplate
 */
export const create = (data: CreateReturnChecklistTemplateInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        createReturnChecklistTemplateSchema,
        { returnProcessTemplateId: data.returnProcessTemplateId }
    ).then(([{ assosiation }, { returnProcessTemplateId, label }]) =>
        prisma.$transaction(async (client) => {
            const aggregate = await client.returnChecklistTemplate.aggregate({
                where: { fk_returnProcessTemplate: returnProcessTemplateId },
                _max: { sortOrder: true },
            });
            const sortOrder = aggregate._max.sortOrder !== null ? aggregate._max.sortOrder + 1 : 0;

            return client.returnChecklistTemplate.create({
                data: {
                    fk_returnProcessTemplate: returnProcessTemplateId,
                    fk_assosiation: assosiation,
                    label,
                    sortOrder,
                },
            });
        })
    );
