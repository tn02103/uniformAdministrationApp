import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { Prisma } from "@/prisma/client";
import { ResignationProcessTemplateWithItems, resignationProcessTemplateWithItemsArgs } from "@/types/resignationProcessTypes";

/**
 * Returns all return process templates for the caller's organisation,
 * including their checklist items ordered by sortOrder.
 * @returns list of ResignationProcessTemplate records
 */
export const getResignationProcessTemplateList = () =>
    genericSANoDataValidator(AuthRole.inspector)
        .then(([{ assosiation }]) =>
            __unsecuredGetResignationProcessTemplateList(assosiation)
        );

export const __unsecuredGetResignationProcessTemplateList = (
    fk_assosiation: string,
    client?: Prisma.TransactionClient
): Promise<ResignationProcessTemplateWithItems[]> => (client ?? prisma).resignationProcessTemplate.findMany({
    ...resignationProcessTemplateWithItemsArgs,
    where: { fk_assosiation },
});
