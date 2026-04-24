import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { updateAnonymizationConfigSchema, UpdateAnonymizationConfigInput } from "@/zod/assosiation";

export const updateAnonymizationConfig = async (data: UpdateAnonymizationConfigInput) =>
    genericSAValidator(
        AuthRole.admin,
        data,
        updateAnonymizationConfigSchema,
        {}
    ).then(([{ assosiation }, cleanedData]) =>
        prisma.assosiationConfiguration.update({
            where: { assosiationId: assosiation },
            data: cleanedData,
            select: {
                returnProcessEnabled: true,
                anonymizationMode: true,
                anonymizationDelayDays: true,
            },
        })
    );
