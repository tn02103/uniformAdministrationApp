"use server";

import { create } from "./create";
import { getActiveResignationProcessList, getResignedMemberlist } from "./get";
import { completeChecklistItem, completeProcess } from "./update";

export const createResignationProcess = create;
export { getActiveResignationProcessList, getResignedMemberlist };
export const completeResignationChecklistItem = completeChecklistItem;
export const completeResignationProcess = completeProcess;
