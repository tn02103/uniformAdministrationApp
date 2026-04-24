import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { AnonymizationMode, CadetStatus } from "@/prisma/enums";
import { returnCadetDirectlySchema } from "@/zod/returnProcess";

export const returnCadetDirectly = async (data: { cadetId: string }) =>
    genericSAValidator(
        AuthRole.inspector,
        data,
        returnCadetDirectlySchema,
        { cadetId: data.cadetId }
    ).then(async ([{ assosiation }, { cadetId }]) => {
        const cadet = await prisma.cadet.findUniqueOrThrow({
            where: { id: cadetId, fk_assosiation: assosiation, deletedAt: null },
        });

        if (cadet.status !== CadetStatus.ACTIVE) {
            throw new Error("Cadet is not ACTIVE");
        }

        const config = await prisma.assosiationConfiguration.findUniqueOrThrow({
            where: { assosiationId: assosiation },
            select: { anonymizationMode: true },
        });

        if (config.anonymizationMode === AnonymizationMode.IMMEDIATELY) {
            await prisma.cadet.update({
                where: { id: cadetId, fk_assosiation: assosiation, deletedAt: null },
                data: {
                    firstname: "XXXX",
                    lastname: "XXXX",
                    deletedAt: new Date(),
                    status: CadetStatus.DELETED,
                },
            });
        } else {
            await prisma.cadet.update({
                where: { id: cadetId, fk_assosiation: assosiation, deletedAt: null },
                data: { status: CadetStatus.RETURNED },
            });
        }
    });
