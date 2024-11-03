"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { DeficiencyType, deficiencyTypeArgs } from "@/types/deficiencyTypes";
import { genericSAValidatiorV2 } from "../validations";

export const getDeficiencyTypeList = (): Promise<DeficiencyType[]> => genericSAValidatiorV2(AuthRole.inspector, true, {})
    .then(({ assosiation }) => prisma.deficiencyType.findMany({
        where: {
            fk_assosiation: assosiation,
            disabledDate: null,
        },
        ...deficiencyTypeArgs,
        orderBy: {
            "name": "asc"
        },
    }));

export const getInspectedCadetIdList = () => genericSAValidatiorV2(AuthRole.inspector, true, {})
    .then(async ({ assosiation }) =>
        prisma.cadetInspection.findMany({
            select: {
                fk_cadet: true
            },
            where: {
                inspection: {
                    fk_assosiation: assosiation,
                    date: new Date(),
                    timeEnd: null,
                    timeStart: { not: null },
                },
            },
        }).then((data) => data.map(c => c.fk_cadet))
    );
