import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const resolve = async (props: string) => genericSAValidator(
    AuthRole.inspector,
    props,
    z.string().uuid(),
    { deficiencyId: props }
).then(async ([{ username, organisationId }, id]) => {
    const activeInspection = await prisma.inspection.findFirst({
        where: {
            organisationId,
            date: dayjs().format("YYYY-MM-DD"),
            timeStart: { not: null },
            timeEnd: null,
        }
    });

    const resolved = await prisma.deficiency.findFirst({
        where: {
            id,
            dateResolved: { not: null }
        }
    });
    if (resolved) {
        throw new Error("Deficiency already resolved");
    }

    await prisma.deficiency.update({
        where: { id },
        data: {
            dateResolved: new Date(),
            userResolved: username,
            fk_inspection_resolved: activeInspection?.id,
        },
    });
});
