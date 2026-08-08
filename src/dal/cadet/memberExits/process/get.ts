import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { Prisma } from "@/prisma/client";
import { memberExitProcess, memberExitProcessArgs } from "@/types/returnProcessTypes";

/**
 * Returns all unfinished return processes for the caller's organisation,
 * including cadet info, template info, and checklist item statuses.
 * @returns list of active ReturnProcess records
 */
export const getActiveReturnProcessList = (): Promise<memberExitProcess[]> => genericSANoDataValidator(AuthRole.inspector)
    .then(([{ assosiation }]) =>
        prisma.returnProcess.findMany({
            where: { fk_assosiation: assosiation, finished: false },
            ...memberExitProcessArgs,
        }));

