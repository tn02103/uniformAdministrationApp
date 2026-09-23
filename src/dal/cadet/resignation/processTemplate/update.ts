import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { updateResignationProcessTemplateSchema, UpdateResignationProcessTemplateInput } from "@/zod/resignationProcess";
import { __unsecuredGetResignationProcessTemplateList } from "./get";

/**
 * Updates a return process template's name and/or defaultProcess flag.
 * If defaultProcess is set to true, clears the flag on all other templates.
 * @param data id, optional name and defaultProcess
 * @returns the updated list of ResignationProcessTemplates with checklist items
 */
export const update = (data: UpdateResignationProcessTemplateInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        updateResignationProcessTemplateSchema,
        { resignationProcessTemplateId: data.id }
    ).then(([{ assosiation }, { id, name, defaultProcess }]) =>
        prisma.$transaction(async (client) => {
            if (defaultProcess) {
                await client.resignationProcessTemplate.updateMany({
                    where: { fk_assosiation: assosiation, defaultProcess: true, id: { not: id } },
                    data: { defaultProcess: false },
                });
            }

            await client.resignationProcessTemplate.update({
                where: { id },
                data: {
                    ...(name !== undefined && { name }),
                    ...(defaultProcess !== undefined && { defaultProcess }),
                },
            });
            return __unsecuredGetResignationProcessTemplateList(assosiation, client);
        })
    );
