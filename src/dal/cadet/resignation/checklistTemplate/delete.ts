import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { DeleteReturnChecklistTemplateInput, deleteReturnChecklistTemplateSchema } from "@/zod/resignationProcess";
import { __unsecuredGetResignationProcessTemplateList } from "../processTemplate/get";

/**
 * Deletes a checklist template item and shifts the sortOrder of all following items down by 1.
 * Verifies the item belongs to the caller's organisation before deleting.
 * @param data id of the checklist template item to delete
 * @returns the updated list of ResignationProcessTemplates with checklist items
 */
export const deleteChecklistTemplate = (data: DeleteReturnChecklistTemplateInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        deleteReturnChecklistTemplateSchema,
    ).then(([{ assosiation }, { id }]) =>
        prisma.$transaction(async (client) => {
            const item = await client.resignationChecklistItemTemplate.findUniqueOrThrow({
                where: { id, fk_assosiation: assosiation },
            });

            await client.resignationChecklistItem.deleteMany({
                where: { checklistTemplateId: id },
            });

            await client.resignationChecklistItemTemplate.delete({
                where: { id, fk_assosiation: assosiation },
            });

            await client.resignationChecklistItemTemplate.updateMany({
                where: {
                    processTemplateId: item.processTemplateId,
                    sortOrder: { gt: item.sortOrder },
                },
                data: { sortOrder: { decrement: 1 } },
            });

            return __unsecuredGetResignationProcessTemplateList(assosiation, client);
        })
    );
