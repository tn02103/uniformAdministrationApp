import { prisma } from "@/lib/db";

export class AssosiationDBHandler {
    getAssosiationByAcronym = (acronym: string) =>
        prisma.assosiation.findFirstOrThrow({
            where: { acronym }
        });
}
