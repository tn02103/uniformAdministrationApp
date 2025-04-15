"use server";

import { create } from "./create";
import { markDeleted } from "./delete";
import { changeSortOrder } from "./sortOrder";
import { update } from "./update";

export const createMaterialGroup = create;
export const deleteMaterialGroup = markDeleted;
export const changeMaterialGroupSortOrder = changeSortOrder;
export const updateMaterialGroup = update;
