import { genericSAValidator } from "@/actions/validations";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { Prisma } from "@/prisma/client";
import { changeReturnChecklistTemplateSortOrderSchema, ChangeReturnChecklistTemplateSortOrderInput } from "@/zod/returnProcess";

/**
 * Changes the sort order of a checklist item within its process template,
 * shifting other items as needed to keep sort orders sequential.
 * @param data checklistItemId and newPosition (0-based index within the template)
 * @returns the full updated list of ReturnChecklistTemplate for the same template
 */
export const changeSortOrder = (data: ChangeReturnChecklistTemplateSortOrderInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        changeReturnChecklistTemplateSortOrderSchema,
    ).then(([{ assosiation }, { checklistItemId, newPosition }]) =>
        prisma.$transaction(async (client) => {
            const item = await client.returnChecklistTemplate.findUniqueOrThrow({
                where: { id: checklistItemId, fk_assosiation: assosiation },
            });

            if (item.sortOrder === newPosition) {
                return getTemplateItems(item.fk_returnProcessTemplate, client);
            }

            const listSize = await client.returnChecklistTemplate.count({
                where: { fk_returnProcessTemplate: item.fk_returnProcessTemplate },
            });

            if (newPosition < 0 || newPosition >= listSize) {
                throw new SaveDataException("Invalid newPosition");
            }

            const up = newPosition < item.sortOrder;
            const upperLimit = up ? newPosition : (item.sortOrder + 1);
            const lowerLimit = up ? (item.sortOrder - 1) : newPosition;

            await client.returnChecklistTemplate.updateMany({
                where: {
                    fk_returnProcessTemplate: item.fk_returnProcessTemplate,
                    sortOrder: { gte: upperLimit, lte: lowerLimit },
                },
                data: {
                    sortOrder: up ? { increment: 1 } : { decrement: 1 },
                },
            });

            await client.returnChecklistTemplate.update({
                where: { id: checklistItemId },
                data: { sortOrder: newPosition },
            });

            return getTemplateItems(item.fk_returnProcessTemplate, client);
        })
    );

const getTemplateItems = (fk_returnProcessTemplate: string, client: Prisma.TransactionClient) =>
    client.returnChecklistTemplate.findMany({
        where: { fk_returnProcessTemplate },
        orderBy: { sortOrder: "asc" },
    });
