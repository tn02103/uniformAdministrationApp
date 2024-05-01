import { prisma } from "../../src/lib/db";
import { fillAllTables, testAssosiationList } from "./newStaticData";

export async function cleanupData(i?: number) {
    try {
        await deleteEverything(i??0);
    } catch (e) {
        console.error(e);
    }
    await fillAllTables(i??0);
}

export async function deleteEverything(i: number) {
   
    await deleteStaticInspection(i);
    await Promise.all([
        deleteStaticUniform(i),
        deleteStaticMaterial(i),
        deleteStaticAuthentication(i),
    ]);

    await prisma.cadet.deleteMany({
        where: { fk_assosiation: assosiationCheck(i) }
    });
    await prisma.assosiation.deleteMany({
        where: { id: assosiationCheck(i) }
    });
}
const assosiationCheck = (i: number) => ({ in: [testAssosiationList[i].id, testAssosiationList[i].id] });

export async function deleteStaticUniform(i: number) {
    await prisma.uniformIssued.deleteMany({
        where: {
            OR: [
                { cadet: { fk_assosiation: assosiationCheck(i) } },
                { uniform: { type: { fk_assosiation: assosiationCheck(i) } } }
            ]
        }
    });

    await prisma.uniform.deleteMany({
        where: {
            type: {
                fk_assosiation: assosiationCheck(i),
            }
        }
    });

    await prisma.uniformGeneration.deleteMany({
        where: {
            uniformType: {
                fk_assosiation: assosiationCheck(i),
            }
        }
    });

    await prisma.uniformType.deleteMany({
        where: { fk_assosiation: assosiationCheck(i) }
    });

    await prisma.uniformSizelist.deleteMany({
        where: {
            fk_assosiation: assosiationCheck(i),
        }
    });

    await prisma.uniformSize.deleteMany({
        where: {
            fk_assosiation: assosiationCheck(i),
        }
    });
}

export async function deleteStaticInspection(i: number) {
    await prisma.deficiencyCadet.deleteMany({
        where: {
            Deficiency: {
                DeficiencyType: {
                    fk_assosiation: assosiationCheck(i)
                }
            }
        }
    });

    await prisma.deficiencyUniform.deleteMany({
        where: {
            Deficiency: {
                DeficiencyType: {
                    fk_assosiation: assosiationCheck(i)
                }
            }
        }
    });

    await prisma.deficiency.deleteMany({
        where: {
            DeficiencyType: {
                fk_assosiation: assosiationCheck(i)
            }
        }
    });

    await prisma.deficiencyType.deleteMany({
        where: {
            fk_assosiation: assosiationCheck(i)
        }
    });

    await prisma.cadetDeficiency.deleteMany({
        where: {
            cadet: { fk_assosiation: assosiationCheck(i) },
        }
    });

    await prisma.cadetDeficiencyType.deleteMany({
        where: {
            fk_assosiation: assosiationCheck(i),
        }
    });

    await prisma.cadetInspection.deleteMany({
        where: {
            cadet: { fk_assosiation: assosiationCheck(i) },
        }
    });

    await prisma.inspection.deleteMany({
        where: {
            fk_assosiation: assosiationCheck(i),
        }
    });
}

export async function deleteStaticMaterial(i: number) {
    await deleteMaterialIssuedTestData(i);

    await prisma.material.deleteMany({
        where: {
            materialGroup: { fk_assosiation: assosiationCheck(i) },
        }
    });

    await prisma.materialGroup.deleteMany({
        where: {
            fk_assosiation: assosiationCheck(i),
        }
    });
}
export async function deleteMaterialIssuedTestData(i: number) {
    await prisma.materialIssued.deleteMany({
        where: {
            OR: [
                { cadet: { fk_assosiation: assosiationCheck(i) } },
                { material: { materialGroup: { fk_assosiation: assosiationCheck(i) } } }
            ]
        }
    });
}

export async function deleteStaticAuthentication(i: number) {
    await prisma.refreshToken.deleteMany({
        where: {
            user: { fk_assosiation: assosiationCheck(i) }
        }
    });

    await prisma.user.deleteMany({
        where: {
            fk_assosiation: assosiationCheck(i),
        }
    });
}
