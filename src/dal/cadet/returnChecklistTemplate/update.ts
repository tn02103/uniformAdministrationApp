import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { updateReturnChecklistTemplateSchema, UpdateReturnChecklistTemplateInput } from "@/zod/returnProcess";

/**
 * Updates a checklist template item's label and/or sortOrder.
 * Verifies the item belongs to the caller's organisation before updating.
 * @param data id, optional label and sortOrder
 * @returns the updated ReturnChecklistTemplate
 */
export const update = (data: UpdateReturnChecklistTemplateInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        updateReturnChecklistTemplateSchema,
    ).then(([{ assosiation }, { id, label, sortOrder }]) =>
        prisma.$transaction(async (client) => {
            await client.returnChecklistTemplate.findUniqueOrThrow({
                where: { id, fk_assosiation: assosiation },
            });

            return client.returnChecklistTemplate.update({
                where: { id },
                data: {
                    ...(label !== undefined && { label }),
                    ...(sortOrder !== undefined && { sortOrder }),
                },
            });
        })
    );
