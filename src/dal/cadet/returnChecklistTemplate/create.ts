import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { createReturnChecklistTemplateSchema, CreateReturnChecklistTemplateInput } from "@/zod/returnProcess";

/**
 * Creates a new checklist item for a return process template.
 * @param data returnProcessTemplateId, label, optional sortOrder
 * @returns the created ReturnChecklistTemplate
 */
export const create = (data: CreateReturnChecklistTemplateInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        createReturnChecklistTemplateSchema,
        { returnProcessTemplateId: data.returnProcessTemplateId }
    ).then(([{ assosiation }, { returnProcessTemplateId, label, sortOrder }]) =>
        prisma.returnChecklistTemplate.create({
            data: {
                fk_returnProcessTemplate: returnProcessTemplateId,
                fk_assosiation: assosiation,
                label,
                sortOrder: sortOrder ?? 0,
            },
        })
    );
