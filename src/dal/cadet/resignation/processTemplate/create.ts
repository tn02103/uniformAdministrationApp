import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { createResignationProcessTemplateSchema, CreateResignationProcessTemplateInput } from "@/zod/resignationProcess";
import { __unsecuredGetResignationProcessTemplateList } from "./get";

/**
 * Creates a new return process template. If defaultProcess is true,
 * clears the defaultProcess flag on any existing default template.
 * @param data name, optional defaultProcess flag
 * @returns the updated list of ResignationProcessTemplates with checklist items
 */
export const create = (data: CreateResignationProcessTemplateInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        createResignationProcessTemplateSchema,
    ).then(([{ assosiation }, { name, defaultProcess }]) =>
        prisma.$transaction(async (client) => {
            if (defaultProcess) {
                await client.resignationProcessTemplate.updateMany({
                    where: { fk_assosiation: assosiation, defaultProcess: true },
                    data: { defaultProcess: false },
                });
            }

            await client.resignationProcessTemplate.create({
                data: {
                    name,
                    defaultProcess: defaultProcess ?? false,
                    fk_assosiation: assosiation,
                },
            });

            return __unsecuredGetResignationProcessTemplateList(assosiation, client);
        })
    );
