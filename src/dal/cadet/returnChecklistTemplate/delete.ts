import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { deleteReturnChecklistTemplateSchema, DeleteReturnChecklistTemplateInput } from "@/zod/returnProcess";

/**
 * Deletes a checklist template item and shifts the sortOrder of all following items down by 1.
 * Verifies the item belongs to the caller's organisation before deleting.
 * @param data id of the checklist template item to delete
 * @returns the deleted ReturnChecklistTemplate
 */
export const deleteChecklistTemplate = (data: DeleteReturnChecklistTemplateInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        deleteReturnChecklistTemplateSchema,
    ).then(([{ assosiation }, { id }]) =>
        prisma.$transaction(async (client) => {
            const item = await client.returnChecklistTemplate.findUniqueOrThrow({
                where: { id, fk_assosiation: assosiation },
            });

            await client.returnChecklistItemStatus.deleteMany({
                where: { fk_checklistItem: id },
            });

            const deleted = await client.returnChecklistTemplate.delete({
                where: { id },
            });

            await client.returnChecklistTemplate.updateMany({
                where: {
                    fk_returnProcessTemplate: item.fk_returnProcessTemplate,
                    sortOrder: { gt: item.sortOrder },
                },
                data: { sortOrder: { decrement: 1 } },
            });

            return deleted;
        })
    );
