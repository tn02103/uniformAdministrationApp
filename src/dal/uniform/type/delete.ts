import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { UniformType, uniformTypeArgs } from "@/types/globalUniformTypes";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";

export const deleteUniformType = (props: string): Promise<UniformType[]> => genericSAValidator(
    AuthRole.materialManager,
    props,
    z.string().uuid(),
    { uniformTypeId: props }
).then(([typeId, { assosiation, username }]): Promise<UniformType[]> => prisma.$transaction(async (client) => {
    await Promise.all([
        returnAllUniformItems(typeId, client),
        deleteAllUniformItems(typeId, username, client),
        deleteAllGenerations(typeId, username, client),
    ]);

    const type = await deleteType(typeId, username, client as PrismaClient);
    await moveSortOrderUp(assosiation, type.sortOrder, client as PrismaClient);

    return client.uniformType.findMany({
        where: { fk_assosiation: assosiation, recdelete: null },
        orderBy: { sortOrder: "asc" },
        ...uniformTypeArgs,
    });
}));

const returnAllUniformItems = (fk_uniformType: string, client: Prisma.TransactionClient) =>
    client.uniformIssued.updateMany({
        where: {
            uniform: { fk_uniformType },
            dateReturned: null,
        },
        data: {
            dateReturned: new Date(),
        },
    });

const deleteAllUniformItems = (fk_uniformType: string, username: string, client: Prisma.TransactionClient) =>
    client.uniform.updateMany({
        where: {
            fk_uniformType,
            recdelete: null,
        },
        data: {
            recdelete: new Date(),
            recdeleteUser: username,
        }
    });
const deleteAllGenerations = (fk_uniformType: string, username: string, client: Prisma.TransactionClient) =>
    client.uniformGeneration.updateMany({
        where: {
            fk_uniformType,
            recdelete: null
        },
        data: {
            recdelete: new Date(),
            recdeleteUser: username,
        },
    });

const deleteType = (id: string, username: string, client: Prisma.TransactionClient) =>
    client.uniformType.update({
        where: { id },
        data: {
            recdelete: new Date(),
            recdeleteUser: username,
        }
    });

const moveSortOrderUp = (fk_assosiation: string, minSortOrder: number, client: Prisma.TransactionClient) =>
    client.uniformType.updateMany({
        where: {
            fk_assosiation,
            sortOrder: { gt: minSortOrder },
            recdelete: null,
        },
        data: {
            sortOrder: { decrement: 1 }
        }
    });
