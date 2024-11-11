"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { genericSAValidatiorV2 } from "../validations";

export const deleteCadet = async (cadetId: string) => genericSAValidatiorV2(
    AuthRole.materialManager,
    uuidValidationPattern.test(cadetId),
    { cadetId }
).then(({ username }) => prisma.$transaction([
    // RETURN uniform
    // -- remove issuedEntries issued today
    prisma.uniformIssued.deleteMany({
        where: {
            fk_cadet: cadetId,
            dateIssued: new Date(),
        }
    }),
    // -- mark everything else as returned 
    prisma.uniformIssued.updateMany({
        where: {
            fk_cadet: cadetId,
            dateIssued: {not: new Date()},
            dateReturned: null,
        },
        data: {
            dateReturned: new Date(),
        }
    }),

    // RETURN material
    // -- remove issuedEntries issued today
    prisma.materialIssued.deleteMany({
        where: {
            fk_cadet: cadetId,
            dateIssued: new Date(),
        }
    }),
    // -- mark everything else as returned
    prisma.materialIssued.updateMany({
        where: {
            fk_cadet: cadetId,
            dateReturned: null,
        },
        data: {
            dateReturned: new Date(),
        }
    }),

    // MARK cadet AS DELETED
    prisma.cadet.update({
        where: {
            id: cadetId,
        },
        data: {
            recdelete: new Date(),
            recdeleteUser: username,
        }
    }),
])).then(() => {
    revalidatePath(`/[locale]/app/cadet`, 'page');
});
