"use server";

import { create } from "./create";
import { markDeleted } from "./delete";
import { getConfiguration, getAdministrationConfiguration } from "./get";
import { changeSortOrder } from "./sortOrder";
import { update } from "./update";

export const createMaterial = create;
export const deleteMaterial = markDeleted;
export const getMaterialAdministrationConfiguration = getAdministrationConfiguration;
export const getMaterialConfiguration = getConfiguration;
export const changeMaterialSortOrder = changeSortOrder;
export const updateMaterial = update;
