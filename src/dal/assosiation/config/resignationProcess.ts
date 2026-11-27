import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { ResignationProcessConfig, resignationProcessTemplateWithItemsArgs } from "@/types/resignationProcessTypes";

/**
 * Returns return-process configuration and all checklist templates for the caller organisation.
 * @returns The return process enabled flag, anonymization mode, and organisation-scoped templates with ordered checklist items.
 */
export const getResignationProcessConfig = (): Promise<ResignationProcessConfig> =>
    genericSANoDataValidator(AuthRole.inspector)
        .then(async ([{ assosiation }]) => {
            const [config, templates] = await Promise.all([
                prisma.assosiationConfiguration.findUniqueOrThrow({
                    where: { assosiationId: assosiation },
                    select: { resignationProcessEnabled: true, anonymizationMode: true },
                }),
                prisma.resignationProcessTemplate.findMany({
                    where: { fk_assosiation: assosiation },
                    ...resignationProcessTemplateWithItemsArgs,
                }),
            ]);

            return {
                resignationProcessEnabled: config.resignationProcessEnabled,
                anonymizationMode: config.anonymizationMode,
                templates,
            };
        });
