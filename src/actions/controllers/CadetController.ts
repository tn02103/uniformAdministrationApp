"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { PersonnelListCadet } from "@/types/globalCadetTypes";
import { CadetDBHandler } from "../dbHandlers/CadetDBHandler";
import { genericSAValidatiorV2, genericSAValidator } from "../validations";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getInspectionState } from "@/dal/inspection/state";

const dbHandler = new CadetDBHandler();
const getPersonnelListPropShema = z.object({
    orderBy: z.enum(['lastname', 'firstname']),
    asc: z.boolean(),
    include: z.object({
        deregistered: z.boolean(),
        inspected: z.boolean(),
    }).partial(),
});
type getPersonnelListPropShema = z.infer<typeof getPersonnelListPropShema>;
export const getPersonnelListData = (props: getPersonnelListPropShema): Promise<PersonnelListCadet[]> => genericSAValidator(
    AuthRole.user,
    props,
    getPersonnelListPropShema,
    {}
).then(async ([{ orderBy, asc, include }, { assosiation, role }]) => {
    const inspectionState = await getInspectionState();
    if (role < AuthRole.inspector) {
        return dbHandler.getRestrictedPersonnelList(
            assosiation, 
            orderBy, 
            asc ? "asc" : "desc",
            inspectionState?.active && !include.deregistered,
            inspectionState?.active && !include.inspected
        );
    } else {
        return dbHandler.getPersonnelList(
            assosiation, 
            orderBy, 
            asc, 
            inspectionState?.active? {
                inspectionId: inspectionState.id,
                exclDeregistrations: !include.deregistered,
                exclInspected: !include.inspected
            }: undefined
        );
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
