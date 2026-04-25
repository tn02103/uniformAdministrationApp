import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { updateReturnChecklistTemplateSchema, UpdateReturnChecklistTemplateInput } from "@/zod/returnProcess";
import { __unsecuredGetReturnProcessTemplateList } from "../returnProcessTemplate/get";

/**
 * Updates a checklist template item's label.
 * Use changeReturnChecklistTemplateSortOrder to change sort order.
 * Verifies the item belongs to the caller's organisation before updating.
 * @param data id, label
 * @returns the updated list of ReturnProcessTemplates with checklist items
 */
export const update = (data: UpdateReturnChecklistTemplateInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        updateReturnChecklistTemplateSchema,
    ).then(([{ assosiation }, { id, label }]) =>
        prisma.$transaction(async (client) => {
            await client.returnChecklistTemplate.findUniqueOrThrow({
                where: { id, fk_assosiation: assosiation },
            });

            await client.returnChecklistTemplate.update({
                where: { id },
                data: {
                    label,
                },
            });

            return __unsecuredGetReturnProcessTemplateList(assosiation, client);
        })
    );
