import { genericSANoDataValidator, genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { UniformType, uniformTypeArgs } from "@/types/globalUniformTypes";
import { Prisma } from "@/prisma/client";
import { z } from "zod";

export const getType = (props: string) => genericSAValidator(
    AuthRole.user,
    props,
    z.string().uuid(),
).then(([{ assosiation }, typeId]) => prisma.uniformType.findUnique({
    where: {
        id: typeId,
        fk_assosiation: assosiation,
        recdelete: null
    },
    ...uniformTypeArgs
}));

export const getList = (): Promise<UniformType[]> =>
    genericSANoDataValidator(AuthRole.user).then(([{ assosiation }]) =>
        __unsecuredGetUniformTypeList(assosiation),
    );

export const __unsecuredGetUniformTypeList = async (fk_assosiation: string, client?: Prisma.TransactionClient) =>
    (client ?? prisma).uniformType.findMany({
        where: { fk_assosiation, recdelete: null },
        orderBy: { sortOrder: "asc" },
        ...uniformTypeArgs,
    });


