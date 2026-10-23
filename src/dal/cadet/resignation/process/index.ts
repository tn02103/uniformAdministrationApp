"use server";

import { create } from "./create";
import { getMembersWithActiveResignationProcessList, getResignedMemberlist } from "./get";
import { completeChecklistItem, completeProcess } from "./update";

export const createResignationProcess = create;
export { getMembersWithActiveResignationProcessList as getActiveResignationProcessList, getResignedMemberlist };
export const completeResignationChecklistItem = completeChecklistItem;
export const completeResignationProcess = completeProcess;
