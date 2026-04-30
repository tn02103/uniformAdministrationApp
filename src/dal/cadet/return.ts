import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { AnonymizationMode, CadetStatus } from "@/prisma/enums";
import { ReturnCadetDirectlyInput, returnCadetDirectlySchema } from "@/zod/returnProcess";
import { __unsecuredProcessCadetEquipmentReturn } from "./returnProcess/create";

export const returnCadetDirectly = async (data: ReturnCadetDirectlyInput) =>
    genericSAValidator(
        AuthRole.inspector,
        data,
        returnCadetDirectlySchema,
        { cadetId: data.cadetId }
    ).then(async ([{ assosiation, username }, { cadetId, selectedUniformIds, selectedMaterialIds }]) => {
        const config = await prisma.assosiationConfiguration.findUniqueOrThrow({
            where: { assosiationId: assosiation },
            select: { anonymizationMode: true },
        });

        await prisma.$transaction(async (client) => {
            const now = new Date();
            const cadet = await client.cadet.findUniqueOrThrow({
                where: { id: cadetId, fk_assosiation: assosiation, deletedAt: null },
            });

            if (cadet.status !== CadetStatus.ACTIVE) {
                throw new Error("Cadet is not ACTIVE");
            }

            await __unsecuredProcessCadetEquipmentReturn(
                client,
                cadetId,
                assosiation,
                username,
                selectedUniformIds ?? [],
                selectedMaterialIds ?? [],
            );

            if (config.anonymizationMode === AnonymizationMode.IMMEDIATELY) {
                await client.cadet.update({
                    where: { id: cadetId, fk_assosiation: assosiation, deletedAt: null },
                    data: {
                        firstname: "XXXX",
                        lastname: "XXXX",
                        deletedAt: now,
                        returnStartedAt: cadet.returnStartedAt ?? now,
                        returnEndedAt: now,
                        status: CadetStatus.DELETED,
                    },
                });
            } else {
                await client.cadet.update({
                    where: { id: cadetId, fk_assosiation: assosiation, deletedAt: null },
                    data: {
                        status: CadetStatus.RETURNED,
                        returnStartedAt: cadet.returnStartedAt ?? now,
                        returnEndedAt: now,
                    },
                });
            }
        });
    });
