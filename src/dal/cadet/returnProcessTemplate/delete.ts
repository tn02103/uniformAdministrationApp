import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { deleteReturnProcessTemplateSchema, DeleteReturnProcessTemplateInput } from "@/zod/returnProcess";

/**
 * Deletes a return process template and all associated processes and checklist items.
 * Throws if the template has any active (unfinished) return processes.
 * @param data id of the template to delete
 */
export const deleteTemplate = (data: DeleteReturnProcessTemplateInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        deleteReturnProcessTemplateSchema,
        { returnProcessTemplateId: data.id }
    ).then(([, { id }]) =>
        prisma.$transaction(async (client) => {
            const activeProcessCount = await client.returnProcess.count({
                where: { fk_returnProcessTemplate: id, finished: false },
            });

            if (activeProcessCount > 0) {
                throw new Error("Cannot delete template with active return processes");
            }

            // Delete item statuses for all (finished) processes using this template
            await client.returnChecklistItemStatus.deleteMany({
                where: { returnProcess: { fk_returnProcessTemplate: id } },
            });

            // Delete all (finished) processes using this template
            await client.returnProcess.deleteMany({
                where: { fk_returnProcessTemplate: id },
            });

            // Delete checklist items of this template
            await client.returnChecklistTemplate.deleteMany({
                where: { fk_returnProcessTemplate: id },
            });

            return client.returnProcessTemplate.delete({
                where: { id },
            });
        })
    );
