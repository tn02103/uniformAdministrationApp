import { PrismaClient } from '@prisma/client';
import StaticDataGenerator, { getStaticDataIds } from '../tests/_playwrightConfig/testData/staticDataGenerator';
import bcrypt from "bcrypt";

const prismaClient = new PrismaClient()
async function main() {
    const ids = getStaticDataIds()
    ids.fk_assosiation = process.env.ASSOSIATION_ID ?? ids.fk_assosiation;
    const generator = new StaticDataGenerator(ids);
    const { fk_assosiation, sizeIds, sizelistIds } = ids;
    const password = await bcrypt.hash(process.env.USER_PASSWORD ?? "Test!234" as string, 15);

    await prismaClient.$transaction(async (prisma) => {
        await prisma.assosiation.create({
            data: {
                id: fk_assosiation,
                name: "Verkehrskadetten",
                acronym: "vkme",
            }
        });
        await prisma.user.createMany({
            data: [
                { fk_assosiation, role: 4, username: 'admin', name: `VK Admin`, password, active: true },
                { fk_assosiation, role: 3, username: 'mana', name: `VK Verwaltung`, password, active: true },
                { fk_assosiation, role: 2, username: 'insp', name: `VK Kontrolleur`, password, active: true },
                { fk_assosiation, role: 1, username: 'user', name: `VK Nutzer`, password, active: true },
                { fk_assosiation, role: 1, username: 'blck', name: `VK Gesperrt`, password, active: false },
            ]
        });

        await prisma.assosiationConfiguration.create({
            data: generator.assosiationConfiguration(),
        });

        await prisma.cadet.createMany({
            data: generator.cadet()
        });


        await prisma.uniformSize.createMany({
            data: generator.uniformSize()
        });

        await Promise.all(
            ([[0, 5], [0, 10], [16, 20], [0, 5]] as number[][]).map(([x, y], index) =>
                prisma.uniformSizelist.create({
                    data: {
                        id: sizelistIds[index],
                        name: `Liste${index}`,
                        fk_assosiation,
                        uniformSizes: {
                            connect: sizeIds.slice(x, y).map(z => ({ id: z }))
                        },
                    }
                }))
        );

        await prisma.uniformType.createMany({
            data: generator.uniformType()
        });

        await prisma.uniformGeneration.createMany({
            data: generator.uniformGeneration()
        });
        await prisma.storageUnit.createMany({
            data: generator.storageUnits()
        });
        await prisma.uniform.createMany({
            data: generator.uniform(),
        });
        await prisma.uniformIssued.createMany({
            data: generator.uniformIssued(),
        });
        await prisma.materialGroup.createMany({
            data: generator.materialGroup(),
        });
        await prisma.material.createMany({
            data: generator.material(),
        });
        await prisma.materialIssued.createMany({
            data: generator.materialIssued(),
        });
        await prisma.inspection.createMany({
            data: generator.inspection(),
        });
        await prisma.cadetInspection.createMany({
            data: generator.cadetInspection(),
        });
        await prisma.deficiencyType.createMany({
            data: generator.deficiencyType(),
        });
        await prisma.deficiency.createMany({
            data: generator.deficiency(),
        });
        await prisma.cadetDeficiency.createMany({
            data: generator.cadetDeficiency(),
        });
        await prisma.uniformDeficiency.createMany({
            data: generator.uniformDeficiency(),
        });
        await prisma.deregistration.createMany({
            data: generator.deregistrations(),
        });
        await prisma.redirect.createMany({
            data: generator.redirects("AA")
        });
    }, { timeout: 15000 });
}

main().then(() => prismaClient.$disconnect());
