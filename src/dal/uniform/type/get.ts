import { genericSANoDataValidator, genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { UniformType, uniformTypeArgs } from "@/types/globalUniformTypes";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const getType = (props: string) => genericSAValidator(
    AuthRole.user,
    props,
    z.string().uuid(),
).then(([{ organisationId }, typeId]) => prisma.uniformType.findUnique({
    where: {
        id: typeId,
        organisationId,
        recdelete: null
    },
    ...uniformTypeArgs
}));

export const getList = (): Promise<UniformType[]> =>
    genericSANoDataValidator(AuthRole.user).then(([{ organisationId }]) =>
        __unsecuredGetUniformTypeList(organisationId),
    );

export const __unsecuredGetUniformTypeList = async (organisationId: string, client?: Prisma.TransactionClient) =>
    (client ?? prisma).uniformType.findMany({
        where: { organisationId, recdelete: null },
        orderBy: { sortOrder: "asc" },
        ...uniformTypeArgs,
    });


