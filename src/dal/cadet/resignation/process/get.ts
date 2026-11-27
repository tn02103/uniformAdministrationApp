import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { CadetWithNonNullResignationProcess, CadetWithResignationProcess, cadetWithResignationProcessArgs } from "@/types/resignationProcessTypes";

/**
 * Returns all unfinished return processes for the caller's organisation,
 * including cadet info, template info, and checklist item statuses.
 * @returns list of active ReturnProcess records
 */
export const getMembersWithActiveResignationProcessList = (): Promise<CadetWithNonNullResignationProcess[]> => genericSANoDataValidator(AuthRole.inspector)
    .then(([{ assosiation }]) =>
        prisma.cadet.findMany({
            ...cadetWithResignationProcessArgs,
            where: { fk_assosiation: assosiation, status: "RESIGNING", resignationProcess: { isNot: null } },
        })).then(data => ([
            ...data.filter((cadet: CadetWithResignationProcess) => cadet.resignationProcess !== null)
        ] as CadetWithNonNullResignationProcess[]));

/**
 * DAL-Function. 
 * Returns all resigned members for the caller's organisation,
 * including cadet info and resignation process details.
 * Excludes cadets who are still in the process of resigning.
 * @returns list of resigned Cadet records with resignation process details
 */
export const getResignedMemberlist = (): Promise<CadetWithResignationProcess[]> => genericSANoDataValidator(AuthRole.inspector)
    .then(([{ assosiation }]) =>
        prisma.cadet.findMany({
            where: { fk_assosiation: assosiation, status: "RESIGNED" },
            ...cadetWithResignationProcessArgs,
        })).then(data => ([...data]));
