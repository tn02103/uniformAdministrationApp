import { prisma } from "@/lib/db";
import { uniformGenerationArgs } from "@/types/globalUniformTypes";
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

    deleteManyByType = async (fk_uniformType: string, username: string, client: PrismaClient) =>
        client.uniformGeneration.updateMany({
            where: { fk_uniformType, recdelete: null },
            data: {
                recdelete: new Date(),
                recdeleteUser: username,
            }
        });

}