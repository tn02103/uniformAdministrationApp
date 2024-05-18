import { revalidatePath } from "next/cache";
import { prisma } from "../../src/lib/db";
import { connectionSizesToSizeLists, fillAllTables, fillCadet, fillCadetInspection, fillDeficiencies, fillDeficiencyCadet, fillDeficiencyTypes, fillDeficiencyUniform, fillInspection, fillMaterialIssued, fillUniform, fillUniformGenertion, fillUniformIssued, fillUniformSize, fillUniformSizelists, fillUniformType } from "./staticData";
import { StaticDataIds } from "./staticDataIds";

export async function cleanupData(i: number) {
    try {
        await deleteAssosiation(i);
    } catch (e) {
        console.error(e);
    }
    await fillAllTables(i);
}






export async function cleanupInspection(i: number) {
    await deleteStaticInspection(i);

    await fillInspection(i);
    await fillCadetInspection(i);
    await fillDeficiencyTypes(i);
    await fillDeficiencies(i);
    await fillDeficiencyCadet(i);
    await fillDeficiencyUniform(i);
}

export async function cleanupCadet(i: number) {
    const fk_assosiation = StaticDataIds[i].fk_assosiation;
    await prisma.$transaction([
        prisma.uniformIssued.deleteMany({
            where: { cadet: { fk_assosiation } }
        }),
        prisma.materialIssued.deleteMany({
            where: { cadet: { fk_assosiation } }
        }),
        prisma.deficiencyCadet.deleteMany({
            where: { Cadet: { fk_assosiation } }
        }),
        prisma.cadetInspection.deleteMany({
            where: { cadet: { fk_assosiation } }
        }),
    ]);
    await prisma.cadet.deleteMany({
        where: { fk_assosiation }
    });

    await fillCadet(i);
    await fillUniformIssued(i);
    await fillMaterialIssued(i);
    await fillDeficiencyCadet(i);
    await fillCadetInspection(i);
}

export async function cleanupUniformIssued(i: number) {
    await deleteUniformIssued(StaticDataIds[i].fk_assosiation);
    await fillUniformIssued(i);
}

export async function cleanupUniformTypeConfiguration(i: number, cleanup?: (i: number) => Promise<void>) {
    const fk_assosiation = StaticDataIds[i].fk_assosiation;
    await prisma.$transaction([
        prisma.uniformIssued.deleteMany({
            where: { cadet: { fk_assosiation } }
        }),
        prisma.deficiencyCadet.deleteMany({
            where: { Deficiency: { DeficiencyType: { fk_assosiation } } }
        }),
        prisma.deficiencyUniform.deleteMany({
            where: { Deficiency: { DeficiencyType: { fk_assosiation } } }
        }),
    ]);
    await prisma.uniform.deleteMany({
        where: { type: { fk_assosiation } }
    });
    await prisma.uniformGeneration.deleteMany({
        where: { uniformType: { fk_assosiation } }
    });
    await prisma.uniformType.deleteMany({
        where: { fk_assosiation }
    });

    if (cleanup) {
        await cleanup(i);
    }

    await fillUniformType(i);
    await fillUniformGenertion(i);
    await fillUniform(i);
    await Promise.all([
        fillUniformIssued(i),
        fillDeficiencyCadet(i),
        fillDeficiencyUniform(i),
    ]);
}

export async function cleanupUniformSizeConfiguration(i: number) {
    const fk_assosiation = StaticDataIds[i].fk_assosiation;
    await cleanupUniformTypeConfiguration(i, async (i: number) => {
        await prisma.uniformSize.deleteMany({
            where: { fk_assosiation }
        });
        await prisma.uniformSizelist.deleteMany({
            where: { fk_assosiation }
        });

        await fillUniformSize(i);
        await fillUniformSizelists(i);
        await connectionSizesToSizeLists(i);
    });
}















// DELETES
const deleteUniformIssued = (fk_assosiation: string) => prisma.uniformIssued.deleteMany({
    where: { cadet: { fk_assosiation } }
});




export async function deleteAssosiation(i: number) {

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
const assosiationCheck = (i: number) => ({ in: [StaticDataIds[i].fk_assosiation] });

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
