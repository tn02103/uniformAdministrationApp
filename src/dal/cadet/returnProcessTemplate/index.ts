"use server";

import { create } from "./create";
import { getReturnProcessTemplateList } from "./get";
import { update } from "./update";
import { deleteTemplate } from "./delete";

export const createReturnProcessTemplate = create;
export { getReturnProcessTemplateList };
export const updateReturnProcessTemplate = update;
export const deleteReturnProcessTemplate = deleteTemplate;
