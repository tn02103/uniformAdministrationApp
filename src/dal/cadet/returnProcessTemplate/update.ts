import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { updateReturnProcessTemplateSchema, UpdateReturnProcessTemplateInput } from "@/zod/returnProcess";

/**
 * Updates a return process template's name and/or defaultProcess flag.
 * If defaultProcess is set to true, clears the flag on all other templates.
 * @param data id, optional name and defaultProcess
 * @returns the updated ReturnProcessTemplate with checklist items
 */
export const update = (data: UpdateReturnProcessTemplateInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        updateReturnProcessTemplateSchema,
        { returnProcessTemplateId: data.id }
    ).then(([{ assosiation }, { id, name, defaultProcess }]) =>
        prisma.$transaction(async (client) => {
            if (defaultProcess) {
                await client.returnProcessTemplate.updateMany({
                    where: { fk_assosiation: assosiation, defaultProcess: true, id: { not: id } },
                    data: { defaultProcess: false },
                });
            }

            return client.returnProcessTemplate.update({
                where: { id },
                data: {
                    ...(name !== undefined && { name }),
                    ...(defaultProcess !== undefined && { defaultProcess }),
                },
                include: {
                    checklistItems: {
                        orderBy: { sortOrder: 'asc' },
                    },
                },
            });
        })
    );
