import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { Prisma } from "@/prisma/client";

/**
 * Returns all unfinished return processes for the caller's organisation,
 * including cadet info, template info, and checklist item statuses.
 * @returns list of active ReturnProcess records
 */
export const getReturnProcessList = () =>
    genericSANoDataValidator(AuthRole.inspector)
        .then(([{ assosiation }]) =>
            __unsecuredGetReturnProcessList(assosiation)
        );

const __unsecuredGetReturnProcessList = (
    fk_assosiation: string,
    client?: Prisma.TransactionClient
) => (client ?? prisma).returnProcess.findMany({
    where: { fk_assosiation, finished: false },
    include: {
        cadet: {
            select: { id: true, firstname: true, lastname: true },
        },
        returnProcessTemplate: {
            select: { id: true, name: true },
        },
        itemStatuses: {
            include: {
                checklistItem: {
                    select: { id: true, label: true, sortOrder: true },
                },
            },
            orderBy: { checklistItem: { sortOrder: 'asc' } },
        },
    },
    orderBy: { updatedAt: 'desc' },
});
