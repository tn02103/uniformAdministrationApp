"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { PersonnelListCadet } from "@/types/globalCadetTypes";
import { z } from "zod";
import { CadetDBHandler } from "../dbHandlers/CadetDBHandler";
import { genericSAValidator } from "../validations";

const personnelListPropShema = z.object({
    orderBy: z.enum(['lastname', 'firstname']),
    asc: z.boolean({ required_error: 'Wert asc wird benötigt' }),
});

const dbHandler = new CadetDBHandler();
export const getPersonnelListData = (props: { orderBy: "lastname" | "firstname", asc: boolean }): Promise<PersonnelListCadet[]> =>
    genericSAValidator<z.infer<typeof personnelListPropShema>>(
        AuthRole.user,
        props,
        personnelListPropShema,
        {}
    ).then(([{ orderBy, asc }, { assosiation, role }]) => {
        if (role < AuthRole.inspector) {
            return dbHandler.getRestrictedPersonnelList(assosiation, orderBy, asc ? "asc" : "desc");
        } else {
            return dbHandler.getPersonnelList(assosiation, orderBy, asc);
        }
    });
