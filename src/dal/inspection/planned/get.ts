"use server";

import { genericSAValidatiorV2 } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import { PlannedInspectionDBQuery } from "./_dbQuerys";

const dbQuery = new PlannedInspectionDBQuery();
/**
 * Returns a list of all Inspections that are in the future, have not been active, or were not closed corectly.
 * @scope **
 * @returns list of Inspections
 */
export const getPlannedInspectionList = (): Promise<PlannedInspectionType[]> => genericSAValidatiorV2(
    AuthRole.materialManager, true, {}
).then(async ({ assosiation }) => dbQuery.plannedInspectionListQuery(assosiation, prisma));
