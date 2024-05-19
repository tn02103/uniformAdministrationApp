"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { UserDBHandler } from "../dbHandlers/UserDBHandler";
import { genericSAValidatiorV2 } from "../validations";

const dbHandler = new UserDBHandler();

export const getUserList = () => genericSAValidatiorV2(
    AuthRole.admin,
    true,{}
).then(({assosiation}) => dbHandler.getUsersList(assosiation));

