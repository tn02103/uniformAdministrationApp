import { prisma } from "../../src/lib/db";
import { fillAllTables, testAssosiation, testWrongAssosiation } from "./staticData";

export async function cleanupData() {
    try {
        await deleteEverything();
    } catch (e) {
        console.error(e);
    }
    await fillAllTables();
}

export async function deleteEverything() {
    await deleteStaticInspection();
    await Promise.all([
        deleteStaticUniform(),
        deleteStaticMaterial(),
        deleteStaticAuthentication(),
    ]);

    await prisma.cadet.deleteMany({
        where: { fk_assosiation: assosiationCheck }
    });
    await prisma.assosiation.deleteMany({
        where: { id: assosiationCheck }
    });
}
const assosiationCheck = { in: [testAssosiation.id, testWrongAssosiation.id] };

export async function deleteStaticUniform() {
    await prisma.uniformIssued.deleteMany({
        where: {
            OR: [
                { cadet: { fk_assosiation: assosiationCheck } },
                { uniform: { type: { fk_assosiation: assosiationCheck } } }
            ]
        }
    });

    await prisma.uniform.deleteMany({
        where: {
            type: {
                fk_assosiation: assosiationCheck,
            }
        }
    });

    await prisma.uniformGeneration.deleteMany({
        where: {
            uniformType: {
                fk_assosiation: assosiationCheck,
            }
        }
    });

    await prisma.uniformType.deleteMany({
        where: { fk_assosiation: assosiationCheck }
    });

    await prisma.uniformSizelist.deleteMany({
        where: {
            fk_assosiation: assosiationCheck,
        }
    });

    await prisma.uniformSize.deleteMany({
        where: {
            fk_assosiation: assosiationCheck,
        }
    });
}

export async function deleteStaticInspection() {
    await prisma.deficiencyCadet.deleteMany({
        where: {
            Deficiency: {
                DeficiencyType: {
                    fk_assosiation: assosiationCheck
                }
            }
        }
    });

    await prisma.deficiencyUniform.deleteMany({
        where: {
            Deficiency: {
                DeficiencyType: {
                    fk_assosiation: assosiationCheck
                }
            }
        }
    });

    await prisma.deficiency.deleteMany({
        where: {
            DeficiencyType: {
                fk_assosiation: assosiationCheck
            }
        }
    });

    await prisma.deficiencyType.deleteMany({
        where: {
            fk_assosiation: assosiationCheck
        }
    });

    await prisma.cadetDeficiency.deleteMany({
        where: {
            cadet: { fk_assosiation: assosiationCheck },
        }
    });

    await prisma.cadetDeficiencyType.deleteMany({
        where: {
            fk_assosiation: assosiationCheck,
        }
    });

    await prisma.cadetInspection.deleteMany({
        where: {
            cadet: { fk_assosiation: assosiationCheck },
        }
    });

    await prisma.inspection.deleteMany({
        where: {
            fk_assosiation: assosiationCheck,
        }
    });
}

export async function deleteStaticMaterial() {
    await prisma.materialIssued.deleteMany({
        where: {
            OR: [
                { cadet: { fk_assosiation: assosiationCheck } },
                { material: { materialGroup: { fk_assosiation: assosiationCheck } } }
            ]
        }
    });

    await prisma.material.deleteMany({
        where: {
            materialGroup: { fk_assosiation: assosiationCheck },
        }
    });

    await prisma.materialGroup.deleteMany({
        where: {
            fk_assosiation: assosiationCheck,
        }
    });
}

export async function deleteStaticAuthentication() {
    await prisma.refreshToken.deleteMany({
        where: {
            user: { fk_assosiation: assosiationCheck }
        }
    });

    await prisma.user.deleteMany({
        where: {
            fk_assosiation: assosiationCheck,
        }
    });
}
