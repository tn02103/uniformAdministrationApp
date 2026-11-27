"use server";

import { create } from "./create";
import { getResignationProcessTemplateList } from "./get";
import { update } from "./update";
import { deleteTemplate } from "./delete";

export const createResignationProcessTemplate = create;
export { getResignationProcessTemplateList };
export const updateResignationProcessTemplate = update;
export const deleteResignationProcessTemplate = deleteTemplate;
