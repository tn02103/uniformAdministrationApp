"use server";

import { createInspection as ci } from "./planned/create";
import { deleteInspection as di } from "./planned/delete";
import { getPlannedInspectionList as gpil } from "./planned/get";
import { updatePlannedInspection as upi } from "./planned/update";
import { updateCadetRegistrationForInspection as ucri } from "./planned/updateDeregistration";
import { startInspection as si } from "./start";
import { getCadetIdList, getInspectionState as gis } from "./state";
import { stopInspection as soi } from "./stop";
import { getCadetInspectionFormData as gcifd } from "./cadet/get";
import { saveCadetInspection as saveci } from "./cadet/save";


export const createInspection = ci;
export const deleteInspection = di;
export const getPlannedInspectionList = gpil;
export const updatePlannedInspection = upi;
export const updateCadetRegistrationForInspection = ucri;
export const startInspection = si;
export const getInspectionState = gis;
export const getInspectedCadetIdList = getCadetIdList;
export const stopInspection = soi;
export const getCadetInspectionFormData = gcifd;
export const saveCadetInspection = saveci;
