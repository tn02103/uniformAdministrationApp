"use server";

import { create } from "./create";
import { getActiveReturnProcessList } from "./get";
import { completeChecklistItem, completeProcess } from "./update";

export const createReturnProcess = create;
export { getActiveReturnProcessList as getReturnProcessList };
export const completeReturnChecklistItem = completeChecklistItem;
export const completeReturnProcess = completeProcess;
