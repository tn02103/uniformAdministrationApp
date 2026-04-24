import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { createReturnProcessTemplateSchema, CreateReturnProcessTemplateInput } from "@/zod/returnProcess";

/**
 * Creates a new return process template. If defaultProcess is true,
 * clears the defaultProcess flag on any existing default template.
 * @param data name, optional defaultProcess flag
 * @returns the created ReturnProcessTemplate with checklist items
 */
export const create = (data: CreateReturnProcessTemplateInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        createReturnProcessTemplateSchema,
    ).then(([{ assosiation }, { name, defaultProcess }]) =>
        prisma.$transaction(async (client) => {
            if (defaultProcess) {
                await client.returnProcessTemplate.updateMany({
                    where: { fk_assosiation: assosiation, defaultProcess: true },
                    data: { defaultProcess: false },
                });
            }

            return client.returnProcessTemplate.create({
                data: {
                    name,
                    defaultProcess: defaultProcess ?? false,
                    fk_assosiation: assosiation,
                },
                include: {
                    checklistItems: {
                        orderBy: { sortOrder: 'asc' },
                    },
                },
            });
        })
    );
