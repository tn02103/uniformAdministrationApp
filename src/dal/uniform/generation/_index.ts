"use server";

import { create } from "./create";
import { markDeleted } from "./delete";
import { changeSortOrder } from "./sortOrder";
import { update } from "./update";


export const createUniformGeneration = create;
export const deleteUniformGeneration = markDeleted;
export const changeUniformGenerationSortOrder = changeSortOrder;
export const updateUniformGeneration = update;
