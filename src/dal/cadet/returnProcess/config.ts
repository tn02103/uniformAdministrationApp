import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";

export const getReturnProcessConfig = () =>
    genericSANoDataValidator(AuthRole.inspector)
        .then(async ([{ assosiation }]) => {
            const [config, templates] = await Promise.all([
                prisma.assosiationConfiguration.findUniqueOrThrow({
                    where: { assosiationId: assosiation },
                    select: { returnProcessEnabled: true, anonymizationMode: true },
                }),
                prisma.returnProcessTemplate.findMany({
                    where: { fk_assosiation: assosiation },
                    include: {
                        checklistItems: {
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                }),
            ]);

            return {
                returnProcessEnabled: config.returnProcessEnabled,
                anonymizationMode: config.anonymizationMode,
                templates,
            };
        });
