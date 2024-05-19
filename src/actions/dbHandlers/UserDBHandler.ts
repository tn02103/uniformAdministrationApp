import { prisma } from "@/lib/db";
import { userArgs } from "@/types/userTypes";
import { PrismaClient } from "@prisma/client";

export class UserDBHandler {

    getUsersList = (fk_assosiation: string, client?: PrismaClient) => 
        (client??prisma).user.findMany({
            where: {fk_assosiation},
            ...userArgs,
        });
}