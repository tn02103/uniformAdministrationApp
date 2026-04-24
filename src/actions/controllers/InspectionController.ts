"use server";

import { AuthRole } from "@/lib/AuthRoles";
import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/db";
import { genericSAValidatorV2 } from "../validations";

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
