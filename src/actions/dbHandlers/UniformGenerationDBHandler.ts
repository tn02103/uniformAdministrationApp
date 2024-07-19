import { prisma } from "@/lib/db";
import { UniformGeneration, uniformGenerationArgs } from "@/types/globalUniformTypes";
import { PrismaClient } from "@prisma/client";

export default class UniformGenerationDBHandler {

    getGeneration = async (id: string, client?: PrismaClient) =>
        (client ?? prisma).uniformGeneration.findUniqueOrThrow({
            select: {
                ...uniformGenerationArgs.select,
                fk_uniformType: true,
            },
            where: { id, recdelete: null }
        });

    getGenerationListByType = async (fk_uniformType: string, client?: PrismaClient) =>
        (client ?? prisma).uniformGeneration.findMany({
            where: { fk_uniformType, recdelete: null },
            ...uniformGenerationArgs,
        });

    createGeneration = async (data: { name: string, outdated: boolean, fk_sizelist: string | null, sortOrder: number }, fk_uniformType: string, client: PrismaClient) =>
        client.uniformGeneration.create({
            data: {
                name: data.name,
                outdated: data.outdated,
                fk_sizelist: data.fk_sizelist,
                sortOrder: data.sortOrder,
                fk_uniformType
            }
        });

    removeGenerationFromUniformItems = async (fk_generation: string, client: PrismaClient) =>
        client.uniform.updateMany({
            where: {
                recdelete: null,
                fk_generation
            },
            data: {
                fk_generation: null,
            }
        });

    updateGeneration = async (generation: UniformGeneration, client: PrismaClient) =>
        client.uniformGeneration.update({
            where: { id: generation.id },
            data: {
                name: generation.name,
                outdated: generation.outdated,
                fk_sizelist: generation.fk_sizelist
            }
        });

    updateSortOrderById = async (id: string, up: boolean, client: PrismaClient) =>
        client.uniformGeneration.update({
            where: { id },
            data: {
                sortOrder: up
                    ? { decrement: 1 }
                    : { increment: 1 }
            }
        });

    updateSortOrderByOldSortOrder = async (oldSortOrder: number, fk_uniformType: string, up: boolean, client: PrismaClient) =>
        client.uniformGeneration.updateMany({
            where: {
                fk_uniformType,
                sortOrder: oldSortOrder,
                recdelete: null
            },
            data: {
                sortOrder: up
                    ? { decrement: 1 }
                    : { increment: 1 }
            }
        }).then(result => (result.count === 1));

    moveGenerationsUp = async (tillSortOrder: number, fk_uniformType: string, client: PrismaClient) =>
        client.uniformGeneration.updateMany({
            where: {
                fk_uniformType,
                recdelete: null,
                sortOrder: { gt: tillSortOrder },
            },
            data: {
                sortOrder: { decrement: 1 }
            },
        });

    deleteManyByType = async (fk_uniformType: string, username: string, client: PrismaClient) =>
        client.uniformGeneration.updateMany({
            where: { fk_uniformType, recdelete: null },
            data: {
                recdelete: new Date(),
                recdeleteUser: username,
            }
        });

    markAsDeleted = async (id: string, username: string, client: PrismaClient) =>
        client.uniformGeneration.update({
            where: { id },
            data: {
                recdelete: new Date(),
                recdeleteUser: username,
            }
        });
}
