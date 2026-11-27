import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { AnonymizationMode, CadetStatus } from "@/prisma/enums";
import { ReturnCadetDirectlyInput, returnCadetDirectlySchema } from "@/zod/resignationProcess";
import { __unsecuredProcessCadetEquipmentReturn } from "./process/create";

/**
 * Resigns a cadet directly without creating a resignation process.
 * Rejects when the organisation has the resignation process flow enabled.
 * @param data - cadetId and optional selectedUniformIds/selectedMaterialIds to mark as returned.
 * @throws {Error} When the cadet is already in the resignation process.
 * @throws {Error} When resignation process is enabled for the organisation.
 * @throws {Error} When the cadet is not ACTIVE.
 */
export const resignMemberDirectly = async (data: ReturnCadetDirectlyInput) =>
    genericSAValidator(
        AuthRole.inspector,
        data,
        returnCadetDirectlySchema,
        { cadetId: data.cadetId }
    ).then(async ([{ assosiation, username }, { cadetId, selectedUniformIds, selectedMaterialIds }]) => {
        const config = await prisma.assosiationConfiguration.findUniqueOrThrow({
            where: { assosiationId: assosiation },
            select: { anonymizationMode: true, resignationProcessEnabled: true },
        });

        if (config.resignationProcessEnabled) {
            throw new Error("Direct cadet return is disabled when resignation process is enabled");
        }

        await prisma.$transaction(async (client) => {
            const now = new Date();
            const cadet = await client.cadet.findUniqueOrThrow({
                where: { id: cadetId, fk_assosiation: assosiation, deletedAt: null },
                include: {
                    resignationProcess: true,
                }
            });

            if (cadet.status !== CadetStatus.ACTIVE) {
                throw new Error("Cadet is not ACTIVE");
            }

            if (cadet.resignationProcess) {
                throw new Error("Cadet is already in the resignation process");
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
                        status: CadetStatus.DELETED,
                        resignedAt: now,
                        firstname: "XXXX",
                        lastname: "XXXX",
                        deletedAt: now,
                    },
                });
            } else {
                await client.cadet.update({
                    where: { id: cadetId, fk_assosiation: assosiation, deletedAt: null },
                    data: {
                        status: CadetStatus.RESIGNED,
                        resignedAt: now,
                    },
                });
            }
        });
    });
