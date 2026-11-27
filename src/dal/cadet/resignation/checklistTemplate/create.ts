import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { createReturnChecklistTemplateSchema, CreateReturnChecklistTemplateInput } from "@/zod/resignationProcess";
import { __unsecuredGetResignationProcessTemplateList } from "../processTemplate/get";

/**
 * Creates a new checklist item for a return process template.
 * sortOrder is auto-calculated as MAX(existing) + 1 (or 0 if no items exist).
 * @param data resignationProcessTemplateId, label
 * @returns the updated list of ResignationProcessTemplates with checklist items
 */
export const create = (data: CreateReturnChecklistTemplateInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        createReturnChecklistTemplateSchema,
        { resignationProcessTemplateId: data.resignationProcessTemplateId }
    ).then(([{ assosiation }, { resignationProcessTemplateId, label }]) =>
        prisma.$transaction(async (client) => {
            const aggregate = await client.resignationChecklistItemTemplate.aggregate({
                where: { processTemplateId: resignationProcessTemplateId },
                _max: { sortOrder: true },
            });
            const sortOrder = aggregate._max.sortOrder !== null ? aggregate._max.sortOrder + 1 : 0;

            await client.resignationChecklistItemTemplate.create({
                data: {
                    processTemplateId: resignationProcessTemplateId,
                    fk_assosiation: assosiation,
                    label,
                    sortOrder,
                },
            });
            return __unsecuredGetResignationProcessTemplateList(assosiation, client);
        })
    );
