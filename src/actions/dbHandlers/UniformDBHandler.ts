import { prisma } from "@/lib/db";
import { CadetUniformMap } from "@/types/globalCadetTypes";
import { uniformArgs, uniformWithOwnerArgs } from "@/types/globalUniformTypes";
import { Prisma, PrismaClient } from "@prisma/client";


export class UniformDBHandler {
    getMap = async (cadetId: string, client?: PrismaClient) =>
        (client ?? prisma).uniform.findMany({
            ...uniformArgs,
            where: {
                issuedEntries: {
                    some: {
                        fk_cadet: cadetId,
                        dateReturned: null
                    }
                },
                recdelete: null,
            },
            orderBy: {
                number: "asc",
            }
        }).then(list => list.reduce(
            (map: CadetUniformMap, item) => {
                if (!map[item.type.id]) {
                    map[item.type.id] = [];
                }

                map[item.type.id].push(item);
                return map;
            }, {}
        ));

    getListWithOwner = async (fk_uniformType: string, hiddenGenerations: string[], hiddenSizes: string[], sqlFilter: Prisma.UniformFindManyArgs["where"], sortOrder: Prisma.UniformOrderByWithRelationInput[], orderByOwner: boolean, asc: boolean) => prisma.uniform.findMany({
        ...uniformWithOwnerArgs,
        where: {
            ...sqlFilter,
            fk_uniformType,
            recdelete: null,
            AND: [{
                OR: [
                    { generation: { id: { notIn: hiddenGenerations } } },
                    hiddenGenerations.includes("null") ? {} : { generation: null },
                ]
            }, {
                OR: [
                    { size: { id: { notIn: hiddenSizes } } },
                    hiddenSizes.includes("null") ? {} : { size: null }
                ]
            }]
        },
        orderBy: sortOrder
    }).then((data) => {
        if (!orderByOwner) {
            return data;
        }

        return data.sort((a, b) => {
            const returnValue = (value: number) => asc ? value : -value;
            if ((a.issuedEntries.length === 0) && (b.issuedEntries.length === 0)) {
                return returnValue(a.number - b.number);
            } else if (a.issuedEntries.length === 0) {
                return returnValue(1);
            } else if (b.issuedEntries.length === 0) {
                return returnValue(-1);
            } else {
                const nameA = a.issuedEntries[0].cadet.lastname + a.issuedEntries[0].cadet.firstname;
                const nameB = b.issuedEntries[0].cadet.lastname + b.issuedEntries[0].cadet.firstname;
                if (nameA === nameB) {
                    return returnValue(a.number - b.number);
                } else {
                    return returnValue(nameA.localeCompare(nameB));
                }
            }
        });
    });


    getUniformById = async (id: string, client?: PrismaClient) =>
        (client ?? prisma).uniform.findUnique({
            where: { id },
            ...uniformArgs,
        });
        
    getUniformCountByType = async (fk_uniformType: string, client?: PrismaClient) =>
        (client ?? prisma).uniform.count({
            where: {
                fk_uniformType,
                recdelete: null
            }
        });
}
