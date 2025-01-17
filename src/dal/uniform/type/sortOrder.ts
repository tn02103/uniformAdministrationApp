"use server";

import { genericSAValidator } from "@/actions/validations";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uniformTypeArgs } from "@/types/globalUniformTypes";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const propShema = z.object({
    typeId: z.string().uuid(),
    up: z.boolean(),
});
type PropType = z.infer<typeof propShema>;
export const changeUniformTypeSortOrder = (props: PropType) => genericSAValidator(
    AuthRole.materialManager,
    props,
    propShema,
    { uniformTypeId: props.typeId }
).then(([{ typeId, up }, { assosiation }]) => prisma.$transaction(async (client) => {
    const type = await prisma.uniformType.findUniqueOrThrow({
        where: {
            id: typeId
        }
    });

    // UPDATE sortorder of other type
    const newSortOrder = up ? (type.sortOrder - 1) : (type.sortOrder + 1);
    if (!await updateSecondType(newSortOrder, !up, assosiation, client)) {
        throw new SaveDataException("Could not update sortOrder of seccond type");
    };


    // UPDATE sortorder of type
    await updateInitialType(typeId, up, client);
    return client.uniformType.findMany({
        where: { fk_assosiation: assosiation, recdelete: null },
        orderBy: { sortOrder: "asc" },
        ...uniformTypeArgs,
    });
}));

const updateSecondType = (sortOrder: number, up: boolean, fk_assosiation: string, client: Prisma.TransactionClient) =>
    client.uniformType.updateMany({
        where: {
            sortOrder,
            fk_assosiation,
            recdelete: null
        },
        data: {
            sortOrder: up ? { decrement: 1 } : { increment: 1 }
        }
    }).then((result) => result.count === 1);

const updateInitialType = (id: string, up: boolean, client: Prisma.TransactionClient) =>
    client.uniformType.update({
        where: {
            id,
        },
        data: {
            sortOrder: up ? { decrement: 1 } : { increment: 1 }
        }
    });
