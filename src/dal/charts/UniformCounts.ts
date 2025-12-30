"use server"
import { genericSANoDataValidator, genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { CadetLabel, cadetLableArgs } from "@/types/globalCadetTypes";
import z from "zod";


export type UniformCountBySizeForTypeData = {
    size: string;
    sizeId: string;
    quantities: {
        available: number;
        issued: number;
        reserves: number;
        issuedReserves: number;
    },
    issuedReserveCadets: CadetLabel[];
}

export const getUniformCountBySizeForType = async (props: string): Promise<UniformCountBySizeForTypeData[]> => genericSAValidator(
    AuthRole.materialManager,
    props,
    z.string().uuid(),
    { uniformTypeId: props }
).then(async ([, uniformTypeId]) => {
    const type = await prisma.uniformType.findUniqueOrThrow({
        where: {
            id: uniformTypeId
        },
    });

    return prisma.uniformSize.findMany({
        where: {
            uniformList: {
                some: {
                    fk_uniformType: uniformTypeId,
                    recdelete: null
                }
            }
        },
        select: {
            id: true,
            name: true,
            uniformList: {
                where: {
                    fk_uniformType: uniformTypeId,
                    recdelete: null
                },
                select: {
                    id: true,
                    isReserve: true,
                    issuedEntries: {
                        where: {
                            dateReturned: null
                        },
                        select: {
                            id: true,
                            cadet: cadetLableArgs
                        }
                    },
                    generation: {
                        select: {
                            isReserve: true,
                        }
                    },
                }
            }
        },
        orderBy: {
            sortOrder: 'asc'
        }
    }).then(sizes =>
        sizes.map(size => {
            const uniforms = type.usingGenerations ? size.uniformList.map((u) => ({
                ...u,
                isReserve: u.isReserve || u.generation?.isReserve,
            })) : size.uniformList;

            // Count uniforms in each category
            const available = uniforms.filter(u => !u.isReserve && u.issuedEntries.length === 0).length;
            const issued = uniforms.filter(u => !u.isReserve && u.issuedEntries.length > 0).length;
            const reserve = uniforms.filter(u => u.isReserve && u.issuedEntries.length === 0).length;
            const issuedReserves = uniforms.filter(u => u.isReserve && u.issuedEntries.length > 0);
            const issuedReserveCadets = issuedReserves.map(u => u.issuedEntries[0]?.cadet);

            return {
                size: size.name,
                sizeId: size.id,
                quantities: {
                    available,
                    issued,
                    reserves: reserve,
                    issuedReserves: issuedReserves.length,
                },
                issuedReserveCadets
            };
        })
    );
});


export type UniformCountByTypeData = {
    name: string;
    id: string;
    quantities: {
        available: number;
        issued: number;
        reserves: number;
        issuedReserves: number;
        missing: number;
    },
    issuedReserveCadets: CadetLabel[];
    missingCadets: CadetLabel[];
}
export const getUniformCountByType = async (): Promise<UniformCountByTypeData[]> => genericSANoDataValidator(AuthRole.materialManager)
    .then(async ([{ assosiation }]) => prisma.uniformType.findMany({
        where: {
            recdelete: null,
            fk_assosiation: assosiation
        },
        select: {
            id: true,
            name: true,
            issuedDefault: true,
            usingGenerations: true,
            uniformList: {
                where: {
                    recdelete: null
                },
                select: {
                    id: true,
                    isReserve: true,
                    issuedEntries: {
                        where: {
                            dateReturned: null
                        },
                        select: {
                            id: true,
                            cadet: cadetLableArgs
                        }
                    },
                    generation: {
                        select: {
                            isReserve: true,
                        }
                    }
                }
            }
        },
        orderBy: {
            sortOrder: 'asc'
        }
    }).then(async (types) => {
        // Get all active cadets for missing calculation
        const activeCadets = await prisma.cadet.findMany({
            where: {
                active: true,
                recdelete: null,
                fk_assosiation: assosiation
            },
            ...cadetLableArgs,
        });

        return types.map(type => {
            const uniforms = type.usingGenerations ? type.uniformList.map((u) => ({
                ...u,
                isReserve: u.isReserve || u.generation?.isReserve,
            })) : type.uniformList;

            // Count uniforms in each category
            const available = uniforms.filter(u => !u.isReserve && u.issuedEntries.length === 0).length;
            const issued = uniforms.filter(u => !u.isReserve && u.issuedEntries.length > 0).length;
            const reserves = uniforms.filter(u => u.isReserve && u.issuedEntries.length === 0).length;
            const issuedReserves = uniforms.filter(u => u.isReserve && u.issuedEntries.length > 0);
            const issuedReserveCadets = issuedReserves.map(u => u.issuedEntries[0]?.cadet);

            // Calculate missing items per cadet
            const issuedPerCadet = new Map<string, number>();

            // Count issued items per cadet for this uniform type
            uniforms.forEach(uniform => {
                uniform.issuedEntries.forEach(({ cadet }) => {
                    issuedPerCadet.set(cadet.id, (issuedPerCadet.get(cadet.id) || 0) + 1);
                });
            });

            // Calculate missing items: only count shortfall for cadets who have less than issuedDefault
            let missing = 0;
            const missingCadets: CadetLabel[] = [];
            activeCadets.forEach(cadet => {
                const currentlyIssued = issuedPerCadet.get(cadet.id) || 0;
                if (currentlyIssued < type.issuedDefault) {
                    missing += type.issuedDefault - currentlyIssued;
                    missingCadets.push(cadet);
                }
            });

            return {
                name: type.name,
                id: type.id,
                quantities: {
                    available,
                    issued,
                    reserves,
                    issuedReserves: issuedReserves.length,
                    missing,
                },
                issuedReserveCadets,
                missingCadets
            };
        });
    }));
