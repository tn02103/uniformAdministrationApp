"use server";

import { genericSAValidatorV2 } from "@/actions/validations";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { revalidateTag } from "next/cache";

export const startInspection = async () => genericSAValidatorV2(
    AuthRole.materialManager,
    true,
    {}
).then(async ({ assosiation }) => prisma.$transaction(async (client) => {
    const unfinished = await client.inspection.findFirst({
        where: {
            date: { lt: new Date() },
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
            date: new Date(),
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
                timeStart: new Date(),
            },
        });
    }

    revalidateTag(`serverA.inspectionState.${assosiation}`);
}));
