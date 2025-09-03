"use server"

import { genericSAValidatorV2 } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";

export const getPersonnelNameList = async () => genericSAValidatorV2(AuthRole.user, true, {})
    .then(({ organisationId }) => prisma.cadet.findMany({
        select: { id: true, firstname: true, lastname: true },
        where: {
            organisationId,
            recdelete: null
        },
        orderBy: [
            { lastname: "asc" },
            { firstname: "asc" },
        ]
    }));