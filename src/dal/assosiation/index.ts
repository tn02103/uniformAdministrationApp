"use server";

import { getAnonymizationConfig } from "./getAnonymizationConfig";
import { updateAnonymizationConfig } from "./updateAnonymizationConfig";
import { getReturnProcessConfig } from "./config/returnProcess";

export const getAssosiationAnonymizationConfig = getAnonymizationConfig;
export const updateAssosiationAnonymizationConfig = updateAnonymizationConfig;
export { getReturnProcessConfig };
