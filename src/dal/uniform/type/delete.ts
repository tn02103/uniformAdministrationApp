import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { UniformType } from "@/types/globalUniformTypes";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { __unsecuredGetUniformTypeList } from "./get";

export const markDeleted = (props: string): Promise<UniformType[]> => genericSAValidator(
    AuthRole.materialManager,
    props,
    z.string().uuid(),
    { uniformTypeId: props }
).then(([{ organisationId, username }, typeId]): Promise<UniformType[]> => prisma.$transaction(async (client) => {
    await Promise.all([
        returnAllUniformItems(typeId, client),
        deleteAllUniformItems(typeId, username, client),
        deleteAllGenerations(typeId, username, client),
        resolvesAllUniformDeficiencies(typeId, username, client),
    ]);

    const type = await deleteType(typeId, username, client as PrismaClient);
    await moveSortOrderUp(organisationId, type.sortOrder, client as PrismaClient);

    return __unsecuredGetUniformTypeList(organisationId, client);
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

    // TODO Ticket #54 Needs to change this part.
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

const moveSortOrderUp = (organisationId: string, minSortOrder: number, client: Prisma.TransactionClient) =>
    client.uniformType.updateMany({
        where: {
            organisationId,
            sortOrder: { gt: minSortOrder },
            recdelete: null,
        },
        data: {
            sortOrder: { decrement: 1 }
        }
    });
const resolvesAllUniformDeficiencies = (fk_uniformType: string, username: string, client: Prisma.TransactionClient) =>
    client.deficiency.updateMany({
        where: {
            dateResolved: null,
            uniformDeficiency: {
                uniform: {
                    fk_uniformType
                },
            },
        },
        data: {
            dateResolved: new Date(),
            userResolved: username,
        }
    })