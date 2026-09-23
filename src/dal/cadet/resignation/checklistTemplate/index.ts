"use server";

import { create } from "./create";
import { update } from "./update";
import { deleteChecklistTemplate } from "./delete";
import { changeSortOrder } from "./sortOrder";

export const createResignationChecklistItemTemplate = create;
export const updateResignationChecklistItemTemplate = update;
export const deleteResignationChecklistItemTemplate = deleteChecklistTemplate;
export const changeResignationChecklistItemTemplateSortOrder = changeSortOrder;
