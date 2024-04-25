"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { genericSAValidatiorV2 } from "../validations";
import { CadetDBHandler } from "../dbHandlers/CadetDBHandler";
import { PersonnelListCadet } from "@/types/globalCadetTypes";

const dbHandler = new CadetDBHandler();
export const getPersonnelListData = (orderBy: "lastname" | "firstname", asc: boolean): Promise<PersonnelListCadet[]> => genericSAValidatiorV2(
    AuthRole.user,
    ((orderBy === "lastname" || orderBy === "firstname")
        && (typeof asc === "boolean")),
    {}
).then(({ assosiation, role }) => {
    if (role < AuthRole.inspector) {
        return dbHandler.getRestrictedPersonnelList(assosiation, orderBy, asc ? "asc" : "desc");
    } else {
        return dbHandler.getPersonnelList(assosiation, orderBy, asc);
    }
});