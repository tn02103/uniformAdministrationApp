import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { deleteResignationProcessTemplateSchema, DeleteResignationProcessTemplateInput } from "@/zod/resignationProcess";
import { __unsecuredGetResignationProcessTemplateList } from "./get";

/**
 * Deletes a return process template and all associated processes and checklist items.
 * Throws if the template has any active (unfinished) return processes.
 * @param data id of the template to delete
 * @return the remaining ResignationProcessTemplates with checklist items
 */
export const deleteTemplate = (data: DeleteResignationProcessTemplateInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        deleteResignationProcessTemplateSchema,
        { resignationProcessTemplateId: data.id }
    ).then(([{assosiation}, { id }]) =>
        prisma.$transaction(async (client) => {
            const activeProcessCount = await client.resignationProcess.count({
                where: { templateId: id, finished: false },
            });

            if (activeProcessCount > 0) {
                throw new Error("Cannot delete template with active return processes");
            }

            // Delete item statuses for all (finished) processes using this template
            await client.resignationChecklistItem.deleteMany({
                where: { process: { templateId: id } },
            });

            // Delete all (finished) processes using this template
            await client.resignationProcess.deleteMany({
                where: { templateId: id },
            });

            // Delete checklist items of this template
            await client.resignationChecklistItemTemplate.deleteMany({
                where: { processTemplateId: id },
            });

            await client.resignationProcessTemplate.delete({
                where: { id },
            });
            return __unsecuredGetResignationProcessTemplateList(assosiation, client);
        })
    );
