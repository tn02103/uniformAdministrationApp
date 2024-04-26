"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { cache } from "react";
import { genericSAValidatior } from "../validations";
import { uniformSizelistArgs } from "@/types/globalUniformTypes";

export const getUniformTypes = cache(async () => genericSAValidatior(AuthRole.user, true, [])
    .then(({ assosiation }) => {
        return prisma.uniformType.findMany({
            where: {
                fk_assosiation: assosiation,
                recdelete: null,
            },
            orderBy: {
                sortOrder: "asc"
            }
        });
    })
);

/*
export const getUniformTypeConfiguration = cache(async () => genericSAValidatior(AuthRole.user, true, [])
    .then(({ assosiation }) => {
        return prisma.uniformType.findMany({
            where: {
                fk_assosiation: assosiation,
                recdelete: null,
            },
            ...uniformTypeArgs,
            orderBy: { sortOrder: "asc" }
        });
    })
)*/

export const getUniformSizeListConfiguration = cache(async () => genericSAValidatior(AuthRole.user, true, [])
    .then(({ assosiation }) => {
        return prisma.uniformSizelist.findMany({
            where: {
                fk_assosiation: assosiation,
            },
            ...uniformSizelistArgs,
        });
    })
)

