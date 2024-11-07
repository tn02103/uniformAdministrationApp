import { genericSAValidatiorV2 } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";

export const getPersonnelNameList = () => genericSAValidatiorV2(AuthRole.user, true, {})
    .then(({ assosiation }) => prisma.cadet.findMany({
        select: { id: true, firstname: true, lastname: true },
        where: {
            fk_assosiation: assosiation,
            recdelete: null
        },
        orderBy: [
            { lastname: "asc" },
            { firstname: "asc" },
        ]
    }));