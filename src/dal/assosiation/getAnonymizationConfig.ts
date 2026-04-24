import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";

export const getAnonymizationConfig = async () =>
    genericSANoDataValidator(AuthRole.admin).then(([{ assosiation }]) =>
        prisma.assosiationConfiguration.findUniqueOrThrow({
            where: { assosiationId: assosiation },
            select: {
                returnProcessEnabled: true,
                anonymizationMode: true,
                anonymizationDelayDays: true,
            },
        })
    );
