import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { Prisma } from "@/prisma/client";
import { ReturnProcessTemplateWithItems, returnProcessTemplateWithItemsArgs } from "@/types/returnProcessTypes";

/**
 * Returns all return process templates for the caller's organisation,
 * including their checklist items ordered by sortOrder.
 * @returns list of ReturnProcessTemplate records
 */
export const getReturnProcessTemplateList = () =>
    genericSANoDataValidator(AuthRole.inspector)
        .then(([{ assosiation }]) =>
            __unsecuredGetReturnProcessTemplateList(assosiation)
        );

export const __unsecuredGetReturnProcessTemplateList = (
    fk_assosiation: string,
    client?: Prisma.TransactionClient
): Promise<ReturnProcessTemplateWithItems[]> => (client ?? prisma).returnProcessTemplate.findMany({
    ...returnProcessTemplateWithItemsArgs,
    where: { fk_assosiation },
});
