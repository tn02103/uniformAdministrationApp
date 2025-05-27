"use server";

import { getCountByType } from "./count";
import { create } from "./create";
import { markDeleted } from "./delete";
import { getDeficiencies, getHistory } from "./get";
import { issue, IssuePropType } from "./issue";
import { returnItem } from "./return";
import { update } from "./update";

export const getUniformItemCountByType = getCountByType;
export const issueUniformItem = issue;
export const createUniformItems = create;
export const deleteUniformItem = markDeleted;
export const updateUniformItem = update;
export const returnUniformItem = returnItem;
export const getUniformItemHistory = getHistory;
export const getUniformItemDeficiencies = getDeficiencies;

export type IssueUniformItemDataType = IssuePropType;
