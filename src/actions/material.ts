"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { genericSAValidatior } from "./validations";
import { prisma } from "@/lib/db";
import { materialGroupArgs } from "@/types/globalMaterialTypes";

export const getMaterialConfiguration = async () => genericSAValidatior(AuthRole.user, true, [])
    .then(async ({ assosiation }) => prisma.materialGroup.findMany({
        ...materialGroupArgs,
        where: {
            fk_assosiation: assosiation,
            recdelete: null,
            typeList: {
                some: {
                    recdelete: null,
                }
            }
        },
        orderBy: { sortOrder: "asc" }
    }))
