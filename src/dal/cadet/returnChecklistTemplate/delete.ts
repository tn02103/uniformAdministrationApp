import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { deleteReturnChecklistTemplateSchema, DeleteReturnChecklistTemplateInput } from "@/zod/returnProcess";

/**
 * Deletes a checklist template item.
 * Verifies the item belongs to the caller's organisation before deleting.
 * @param data id of the checklist template item to delete
 */
export const deleteChecklistTemplate = (data: DeleteReturnChecklistTemplateInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        deleteReturnChecklistTemplateSchema,
    ).then(([{ assosiation }, { id }]) =>
        prisma.$transaction(async (client) => {
            await client.returnChecklistTemplate.findUniqueOrThrow({
                where: { id, fk_assosiation: assosiation },
            });

            return client.returnChecklistTemplate.delete({
                where: { id },
            });
        })
    );
