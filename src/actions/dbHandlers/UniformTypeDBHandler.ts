import { prisma } from "@/lib/db";
import { uniformTypeArgs } from "@/types/globalUniformTypes";
import { Prisma, PrismaClient } from "@prisma/client";

export class UniformTypeDBHandler {
    getType = async (id: string, client?: PrismaClient) => (client ?? prisma).uniformType.findUniqueOrThrow({
        where: { id, recdelete: null },
        ...uniformTypeArgs,
    });

    getCompleteTypeWithSizelistAndSizes = async (id: string, client?: Prisma.TransactionClient) =>
        (client ?? prisma).uniformType.findFirstOrThrow({
            where: { id, recdelete: null, },
            include: {
                uniformGenerationList: {
                    where: {
                        recdelete: null
                    },
                    include: {
                        sizelist: {
                            include: { uniformSizes: true }
                        },
                    },
                },
                defaultSizelist: {
                    include: { uniformSizes: true }
                },
            }
        });

    getTypeList = async (organisationId: string, client?: PrismaClient) => (client ?? prisma).uniformType.findMany({
        where: { organisationId, recdelete: null },
        orderBy: { sortOrder: "asc" },
        ...uniformTypeArgs,
    });

    insertType = async (name: string, acronym: string, sortOrder: number, organisationId: string, client: PrismaClient) => client.uniformType.create({
        ...uniformTypeArgs,
        data: {
            name,
            acronym,
            sortOrder,
            organisationId,
            issuedDefault: 1,
            usingSizes: false,
            usingGenerations: false,
        }
    });

    updateData = async (id: string, data: { name: string, acronym: string, issuedDefault: number, usingGenerations: boolean, usingSizes: boolean, fk_defaultSizelist: string | null }, client: PrismaClient) =>
        client.uniformType.update({
            where: { id },
            data
        });

    updateSortOrderByOldSortOrder = async (oldSortOrder: number, up: boolean, organisationId: string, client: PrismaClient): Promise<boolean> => client.uniformType.updateMany({
        where: {
            organisationId: organisationId,
            sortOrder: oldSortOrder,
            recdelete: null,
        },
        data: {
            sortOrder: up
                ? { decrement: 1 }
                : { increment: 1 }
        }
    }).then(result => (result.count === 1));

    updateSortOrderById = async (id: string, up: boolean, client: PrismaClient) => await client.uniformType.update({
        where: { id },
        data: {
            sortOrder: up
                ? { decrement: 1 }
                : { increment: 1 }
        }
    });

    moveUpBelowHole = async (sortOrder: number, organisationId: string, client: PrismaClient) =>
        client.uniformType.updateMany({
            where: {
                organisationId,
                sortOrder: { gt: sortOrder },
                recdelete: null,
            },
            data: {
                sortOrder: { decrement: 1 }
            }
        });

    delete = async (id: string, username: string, client: PrismaClient) => await client.uniformType.update({
        where: { id },
        data: {
            recdelete: new Date(),
            recdeleteUser: username,
        }
    });
}
