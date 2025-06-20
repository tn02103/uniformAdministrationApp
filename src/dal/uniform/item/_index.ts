"use server";

import { getCountByType } from "./count";
import { create } from "./create";
import { markDeleted } from "./delete";
import { getDeficiencies, getHistory, getItemLabels, getListWithOwner, ItemLabel } from "./get";
import { issue, IssuePropType } from "./issue";
import { returnItem } from "./return";
import { update } from "./update";

export const getUniformItemCountByType = getCountByType;
export const issueUniformItem = issue;
export const createUniformItems = create;
export const deleteUniformItem = markDeleted;
export const updateUniformItem = update;
export const returnUniformItem = returnItem;
export const getUniformItemLabels = getItemLabels;
export const getUniformItemHistory = getHistory;
export const getUniformItemDeficiencies = getDeficiencies;
export const getUniformListWithOwner = getListWithOwner;

export type IssueUniformItemDataType = IssuePropType;
export type UniformItemLabel = ItemLabel;
