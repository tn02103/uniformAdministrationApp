"use server";

import { create } from "./create";
import { markDeleted } from "./delete";
import { issue, IssuePropType } from "./issue";
import { returnItem } from "./return";
import { update } from "./update";


export const issueUniformItem = issue;
export const createUniformItems = create;
export const deleteUniformItem = markDeleted;
export const updateUniformItem = update;
export const returnUniformItem = returnItem;

export type IssueUniformItemDataType = IssuePropType;
