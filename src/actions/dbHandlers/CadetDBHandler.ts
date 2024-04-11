import { prisma } from "@/lib/db";
import { cadetArgs } from "@/types/globalCadetTypes";
import { PrismaClient } from "@prisma/client";

export class CadetDBHandler {
    getCadet = (id: string, client?: PrismaClient) =>
        (client ?? prisma).cadet.findUniqueOrThrow({
            ...cadetArgs,
            where: {
                id
            }
        });

    concatCadetComment = (id: string, comment: string, client?: PrismaClient) =>
        (client ?? prisma).$executeRaw`
            UPDATE "Cadet"
               SET comment = CONCAT(comment, ${comment}) 
             WHERE id = ${id}`;

}