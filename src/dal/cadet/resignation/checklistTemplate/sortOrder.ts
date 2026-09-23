import { genericSAValidator } from "@/actions/validations";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { ChangeReturnChecklistTemplateSortOrderInput, changeReturnChecklistTemplateSortOrderSchema } from "@/zod/resignationProcess";
import { __unsecuredGetResignationProcessTemplateList } from "../processTemplate/get";

/**
 * Changes the sort order of a checklist item within its process template,
 * shifting other items as needed to keep sort orders sequential.
 * @param data checklistItemId and newPosition (0-based index within the template)
 * @returns the updated list of ResignationProcessTemplates with checklist items
 */
export const changeSortOrder = (data: ChangeReturnChecklistTemplateSortOrderInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        changeReturnChecklistTemplateSortOrderSchema,
    ).then(([{ assosiation }, { checklistItemId, newPosition }]) =>
        prisma.$transaction(async (client) => {
            const item = await client.resignationChecklistItemTemplate.findUniqueOrThrow({
                where: { id: checklistItemId, fk_assosiation: assosiation },
            });

            if (item.sortOrder === newPosition) {
                return __unsecuredGetResignationProcessTemplateList(item.processTemplateId, client);
            }

            const listSize = await client.resignationChecklistItemTemplate.count({
                where: { processTemplateId: item.processTemplateId },
            });

            if (newPosition < 0 || newPosition >= listSize) {
                throw new SaveDataException("Invalid newPosition");
            }

            const up = newPosition < item.sortOrder;
            const upperLimit = up ? newPosition : (item.sortOrder + 1);
            const lowerLimit = up ? (item.sortOrder - 1) : newPosition;

            await client.resignationChecklistItemTemplate.updateMany({
                where: {
                    processTemplateId: item.processTemplateId,
                    sortOrder: { gte: upperLimit, lte: lowerLimit },
                },
                data: {
                    sortOrder: up ? { increment: 1 } : { decrement: 1 },
                },
            });

            await client.resignationChecklistItemTemplate.update({
                where: { id: checklistItemId },
                data: { sortOrder: newPosition },
            });

            return __unsecuredGetResignationProcessTemplateList(assosiation, client);
        })
    );
