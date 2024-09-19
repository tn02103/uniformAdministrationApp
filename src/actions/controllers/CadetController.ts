"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { PersonnelListCadet } from "@/types/globalCadetTypes";
import { CadetDBHandler } from "../dbHandlers/CadetDBHandler";
import { genericSAValidatiorV2 } from "../validations";
import { prisma } from "@/lib/db";

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

export const getPersonnelNameList = () => genericSAValidatiorV2(AuthRole.user, true, {})
    .then(({ assosiation }) => prisma.cadet.findMany({
        select: { id: true, firstname: true, lastname: true },
        where: {
            fk_assosiation: assosiation,
            recdelete: null
        },
        orderBy: [
            { lastname: "asc" },
            { firstname: "asc" },
        ]
    }));
