"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { genericSAValidatiorV2 } from "../validations";
import { prisma } from "@/lib/db";
import { DeficiencyType, deficiencyTypeArgs } from "@/types/deficiencyTypes";

export const getDeficiencyTypeList = (): Promise<DeficiencyType[]> => genericSAValidatiorV2(AuthRole.inspector, true, {})
    .then(({ assosiation }) => prisma.deficiencyType.findMany({
        where: {
            fk_assosiation: assosiation,
            recdelete: null,
        },
        ...deficiencyTypeArgs,
        orderBy: {
            "name": "asc"
        },
    }));