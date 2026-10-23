"use server";

import { create } from "./create";
import { markDeleted } from "./delete";
import { getType, getList } from "./get";
import { changeSortOrder } from "./sortOrder";
import { update } from "./update";


export const createUniformType = create;
export const deleteUniformType = markDeleted;
export const getUniformType = getType;
export const getUniformTypeList = getList;
export const changeUniformTypeSortOrder = changeSortOrder;
export const updateUniformType = update;
