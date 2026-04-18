"use server";

import { getClosedInspectionList as gcil } from "./get";
import { getClosedInspectionReport as gcir } from "./getReport";

export const getClosedInspectionList = gcil;
export const getClosedInspectionReport = gcir;
