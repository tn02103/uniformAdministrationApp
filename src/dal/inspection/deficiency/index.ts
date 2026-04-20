"use server";

import { createDeficiency } from "./create";
import { resolve } from "./resolve";
import { updateDeficiency } from "./update";

export const resolveDeficiency = resolve;
export { createDeficiency };
export { updateDeficiency };
