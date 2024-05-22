
import { Prisma, PrismaClient } from "@prisma/client";
import { DefaultArgs, Omit } from "@prisma/client/runtime/library";

const globalForPrisma = global as unknown as {
    prisma: PrismaClient
}

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
