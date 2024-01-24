"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { genericSAValidatior } from "../validations";
import { uuidValidationPattern } from "@/lib/validations";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const deleteCadet = async (cadetId: string) => genericSAValidatior(
    AuthRole.materialManager,
    uuidValidationPattern.test(cadetId),
    [{ value: cadetId, type: "cadet" }]
).then(({ username }) => prisma.$transaction([
    // RETURN uniform
    // -- remove issuedEntrys issued today
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
            dateReturned: null,
        },
        data: {
            dateReturned: new Date(),
        }
    }),

    // RETURN material
    // -- remove issuedEntrys issued today
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
    revalidatePath(`/[locale]/app/cadet`);
})