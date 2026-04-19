"use server";

import { createDeficiency } from "./create";
import { resolve } from "./resolve";
import { updateDeficiency, updateUniform } from "./update";

export const updateUniformDeficiency = updateUniform;
export const resolveDeficiency = resolve;
export { createDeficiency };
export { updateDeficiency };
