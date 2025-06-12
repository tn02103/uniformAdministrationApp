"use server";

import { create } from './create';
import { deleteUnit } from './delete';
import { getUnitsWithUniformItems, StorageUnitWithUniformItems as StorageUnitWithUniformItemsType } from './get';
import { addUniform } from './addUniform';
import { update } from './update';
import { removeUniform } from './removeUniform';

export type StorageUnitWithUniformItems = StorageUnitWithUniformItemsType;
export const getStorageUnitsWithUniformItems = getUnitsWithUniformItems;
export const createStorageUnit = create;
export const deleteStorageUnit = deleteUnit;
export const addUniformItemToStorageUnit = addUniform;
export const removeUniformFromStorageUnit = removeUniform;
export const updateStorageUnit = update;
