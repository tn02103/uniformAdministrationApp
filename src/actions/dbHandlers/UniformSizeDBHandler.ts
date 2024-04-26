import { prisma } from "@/lib/db";
import { uniformSizeArgs, uniformSizelistArgs } from "@/types/globalUniformTypes";
import { PrismaClient } from "@prisma/client";

export default class UniformSizeDBHandler {

    getSizelistList = (fk_assosiation: string, client?: PrismaClient) =>
        (client ?? prisma).uniformSizelist.findMany({
            ...uniformSizelistArgs,
            where: { fk_assosiation },
            orderBy: { name: "asc" }
        });

    getTypeUsingSizelist = (fk_defaultSizeList: string, fk_assosiation: string, client?: PrismaClient) =>
        (client ?? prisma).uniformType.findFirst({
            where: {
                fk_assosiation,
                fk_defaultSizeList,
                recdelete: null
            }
        });

    getGenerationUsingSizelist = (fk_sizeList: string, fk_assosiation: string, client?: PrismaClient) =>
        (client ?? prisma).uniformGeneration.findFirst({
            where: {
                uniformType: {
                    fk_assosiation,
                    recdelete: null,
                },
                fk_sizeList,
                recdelete: null
            }
        });

    getAllUniformSizesByAssosiation = (fk_assosiation: string, client?: PrismaClient) =>
        (client ?? prisma).uniformSize.findMany({
            where: { fk_assosiation },
            ...uniformSizeArgs,
            orderBy: { sortOrder: "asc" },
        });

    createSizelist = (name: string, fk_assosiation: string, client: PrismaClient) =>
        client.uniformSizelist.create({
            data: {
                fk_assosiation,
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
}