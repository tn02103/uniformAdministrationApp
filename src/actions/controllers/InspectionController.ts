"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { DeficiencyType, deficiencyTypeArgs } from "@/types/deficiencyTypes";
import { genericSAValidatorV2 } from "../validations";
import dayjs from "@/lib/dayjs";

export const getDeficiencyTypeList = async (): Promise<DeficiencyType[]> => genericSAValidatorV2(AuthRole.inspector, true, {})
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

export const getInspectedCadetIdList =async  () => genericSAValidatorV2(AuthRole.inspector, true, {})
    .then(async ({ assosiation }) =>
        prisma.cadetInspection.findMany({
            select: {
                fk_cadet: true
            },
            where: {
                inspection: {
                    fk_assosiation: assosiation,
                    date: dayjs().format("YYYY-MM-DD"),
                    timeEnd: null,
                    timeStart: { not: null },
                },
            },
        }).then((data) => data.map(c => c.fk_cadet))
    );
