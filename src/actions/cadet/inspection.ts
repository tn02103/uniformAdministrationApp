"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { genericSAValidatior } from "../validations";

export const inspectedCadetIdList = () => genericSAValidatior(AuthRole.inspector, true, [])
    .then(() => {

    })