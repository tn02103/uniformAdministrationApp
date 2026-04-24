"use server";

import { create } from "./create";
import { getReturnProcessConfig } from "./config";
import { getReturnProcessList } from "./get";
import { completeChecklistItem, completeChecklist } from "./update";

export const createReturnProcess = create;
export { getReturnProcessList, getReturnProcessConfig };
export const completeReturnChecklistItem = completeChecklistItem;
export const completeReturnChecklist = completeChecklist;
