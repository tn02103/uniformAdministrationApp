import { prisma } from "@/lib/db";
import { uniformSizeArgs, uniformSizelistArgs } from "@/types/globalUniformTypes";
import { PrismaClient } from "@prisma/client";

export default class UniformSizeDBHandler {
    getSizelistList = (organisationId: string, client?: PrismaClient) =>
        (client ?? prisma).uniformSizelist.findMany({
            ...uniformSizelistArgs,
            where: { organisationId },
            orderBy: { name: "asc" }
        });

    getTypeUsingSizelist = (fk_defaultSizelist: string, organisationId: string, client?: PrismaClient) =>
        (client ?? prisma).uniformType.findFirst({
            where: {
                organisationId,
                fk_defaultSizelist,
                recdelete: null
            }
        });

    getGenerationUsingSizelist = (fk_sizelist: string, organisationId: string, client?: PrismaClient) =>
        (client ?? prisma).uniformGeneration.findFirst({
            where: {
                type: {
                    organisationId,
                    recdelete: null,
                },
                fk_sizelist,
                recdelete: null
            }
        });

    getAllUniformSizesByOrganisation = (organisationId: string, client?: PrismaClient) =>
        (client ?? prisma).uniformSize.findMany({
            where: { organisationId },
            ...uniformSizeArgs,
            orderBy: { sortOrder: "asc" },
        });
    getUniformsize = (id: string, client?: PrismaClient) =>
        (client ?? prisma).uniformSize.findUniqueOrThrow({
            where: { id },
            ...uniformSizeArgs,
        });

    createSizelist = (name: string, organisationId: string, client: PrismaClient) =>
        client.uniformSizelist.create({
            data: {
                organisationId,
                name,
            },
            ...uniformSizelistArgs,
        });

    renameSizelist = (id: string, name: string, client: PrismaClient) =>
        client.uniformSizelist.update({
            where: { id },
            data: { name }
        });

    deleteSizelist = (id: string, client: PrismaClient) =>
        client.uniformSizelist.delete({
            where: { id }
        });

    createSize = (name: string, sortOrder: number, organisationId: string, client: PrismaClient) =>
        client.uniformSize.create({
            data: {
                name,
                sortOrder,
                organisationId,
            },
        });

    moveMultipleSizes = (organisationId: string, minSortOrder: number, maxSortOrder: number, up: boolean, client: PrismaClient) =>
        client.uniformSize.updateMany({
            where: {
                organisationId,
                sortOrder: (maxSortOrder === -1)
                    ? { gte: minSortOrder }
                    : { gte: minSortOrder, lte: maxSortOrder }
            },
            data: {
                sortOrder: up
                    ? { decrement: 1 }
                    : { increment: 1 }
            }
        }).then(r => r.count);

    setSortorder = (id: string, sortOrder: number, client: PrismaClient) =>
        client.uniformSize.update({
            where: { id },
            data: { sortOrder }
        });

    deleteSize = (id: string, client: PrismaClient) =>
        client.uniformSize.delete({
            where: { id }
        });
}
