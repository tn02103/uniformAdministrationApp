"use server";

import { getAnonymizationConfig } from "./getAnonymizationConfig";
import { updateAnonymizationConfig } from "./updateAnonymizationConfig";
import { getResignationProcessConfig } from "./config/resignationProcess";

export const getAssosiationAnonymizationConfig = getAnonymizationConfig;
export const updateAssosiationAnonymizationConfig = updateAnonymizationConfig;
export { getResignationProcessConfig };
