"use server"

import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";

export const getPersonnelNameList = async () => genericSANoDataValidator(AuthRole.user)
    .then(([{ assosiation }]) => prisma.cadet.findMany({
        select: { id: true, firstname: true, lastname: true },
        where: {
            fk_assosiation: assosiation,
            status: 'ACTIVE'
        },
        orderBy: [
            { lastname: "asc" },
            { firstname: "asc" },
        ]
    }));