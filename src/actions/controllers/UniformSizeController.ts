"use server"

import { AuthRole } from "@/lib/AuthRoles"
import { genericSAValidatiorV2 } from "../validations"
import UniformSizeDBHandler from "../dbHandlers/UniformSizeDBHandler"

const dbHandler = new UniformSizeDBHandler();
export const getUniformSizeLists = async () => genericSAValidatiorV2(
    AuthRole.user, true, {}
).then(({ assosiation }) => dbHandler.getSizeListsList(assosiation));

