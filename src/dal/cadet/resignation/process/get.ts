import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { ResignationProcess, resignationProcessArgs } from "@/types/resignationProcessTypes";

/**
 * Returns all unfinished return processes for the caller's organisation,
 * including cadet info, template info, and checklist item statuses.
 * @returns list of active ReturnProcess records
 */
export const getActiveResignationProcessList = (): Promise<ResignationProcess[]> => genericSANoDataValidator(AuthRole.inspector)
    .then(([{ assosiation }]) =>
        prisma.cadet.findMany({
            where: { fk_assosiation: assosiation, status: "RESIGNING" },
            ...resignationProcessArgs,
        }));

export const getResignedMemberlist = (): Promise<ResignationProcess[]> => genericSANoDataValidator(AuthRole.inspector)
    .then(([{ assosiation }]) =>
        prisma.cadet.findMany({
            where: { fk_assosiation: assosiation, status: "RESIGNED" },
            ...resignationProcessArgs,
        }));