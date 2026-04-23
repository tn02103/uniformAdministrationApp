"use server";

import { create } from "./create";
import { update } from "./update";
import { deleteChecklistTemplate } from "./delete";

export const createReturnChecklistTemplate = create;
export const updateReturnChecklistTemplate = update;
export const deleteReturnChecklistTemplate = deleteChecklistTemplate;
