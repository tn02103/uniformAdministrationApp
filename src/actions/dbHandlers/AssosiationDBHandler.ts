import { prisma } from "@/lib/db";

export class OrganisationDBHandler {
    getOrganisationByAcronym = (acronym: string) =>
        prisma.organisation.findFirstOrThrow({
            where: { acronym }
        });
}
