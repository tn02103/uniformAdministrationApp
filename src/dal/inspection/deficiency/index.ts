"use server";

import { createDeficiency, createUniformDef } from "./create";
import { resolve } from "./resolve";
import { updateDeficiency, updateUniform } from "./update";

export const updateUniformDeficiency = updateUniform;
export const resolveDeficiency = resolve;
export const createUniformDeficiency = createUniformDef;
export { createDeficiency };
export { updateDeficiency };
