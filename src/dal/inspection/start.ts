"use server";

import { genericSANoDataValidator } from "@/actions/validations";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import dayjs from "@/lib/dayjs";
import { revalidateTag } from "next/cache";

export const startInspection = async () => genericSANoDataValidator(
    AuthRole.materialManager
).then(async ([{ assosiation }]) => prisma.$transaction(async (client) => {
    const unfinished = await client.inspection.findFirst({
        where: {
            date: { lt: dayjs().format("YYYY-MM-DD") },
            timeStart: { not: null },
            timeEnd: null,
            fk_assosiation: assosiation,
        }
    });
    if (unfinished) {
        throw new SaveDataException('Could not start inspection: Last Inspection unfinished');
    }
    const i = await client.inspection.findFirst({
        where: {
            date: dayjs().format("YYYY-MM-DD"),
            fk_assosiation: assosiation,
        },
    });
    if (!i) {
        throw new SaveDataException('Could not start inspection: No Planned Insepctions Today');
    }
    if (i.timeStart) {
        if (!i.timeEnd)
            throw new SaveDataException('Could not start inspection: Inspection already started');

        await client.inspection.update({
            where: { id: i.id },
            data: {
                timeEnd: null,
            }
        });
    } else {
        await client.inspection.update({
            where: { id: i.id },
            data: {
                timeStart: dayjs().format("HH:mm"),
            },
        });
    }

    revalidateTag(`serverA.inspectionState.${assosiation}`);
}));
