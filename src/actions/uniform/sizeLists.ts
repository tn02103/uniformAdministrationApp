"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { genericSAValidatior } from "../validations";
import { prisma } from "@/lib/db";
import { uniformSizeListArgs } from "@/types/globalUniformTypes";

export const getUniformSizeLists = async () =>
    genericSAValidatior(AuthRole.user, true, [])
        .then(() =>
            prisma.uniformSizelist.findMany({
                ...uniformSizeListArgs,
            })
        )

