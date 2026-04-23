"use server";

import { create } from "./create";
import { getReturnProcessList } from "./get";
import { completeChecklistItem, completeChecklist } from "./update";

export const createReturnProcess = create;
export { getReturnProcessList };
export const completeReturnChecklistItem = completeChecklistItem;
export const completeReturnChecklist = completeChecklist;
