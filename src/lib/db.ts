
import { PrismaClient } from "@/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = global as unknown as {
    prisma: PrismaClient
}

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString })
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}


const disconnectPrisma = async () => {
    await prisma.$disconnect();
    process.exit(0);
};

process.on('SIGINT', disconnectPrisma);
process.on('SIGTERM', disconnectPrisma);
process.on('beforeExit', disconnectPrisma);
