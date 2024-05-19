"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { PersonnelListCadet } from "@/types/globalCadetTypes";
import { CadetDBHandler } from "../dbHandlers/CadetDBHandler";
import { genericSAValidatiorV2 } from "../validations";

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
