import { prisma } from "@/lib/db";
import { CadetUniformMap } from "@/types/globalCadetTypes";
import { UniformNumbersSizeMap, uniformArgs, uniformWithOwnerArgs } from "@/types/globalUniformTypes";
import { Prisma, PrismaClient } from "@prisma/client";
import { isToday } from "date-fns";


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

    getListWithOwner = async (fk_uniformType: string, hiddenGenerations: string[], hiddenSizes: string[], sqlFilter: object, sortOrder: Prisma.UniformOrderByWithRelationInput[], orderByOwner: boolean, asc: boolean) => prisma.uniform.findMany({
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

    getIssuedEntry = async (fk_uniform: string, fk_cadet: string, client?: PrismaClient) =>
        (client ?? prisma).uniformIssued.findFirstOrThrow({
            where: {
                fk_cadet,
                fk_uniform,
                dateReturned: null,
            }
        });

    getUniformById = async (id: string, client?: PrismaClient) =>
        (client ?? prisma).uniform.findUnique({
            where: { id },
            ...uniformArgs,
        });

    getUniformWithIssuedEntriesByTypeAndNumber = async (fk_uniformType: string, number: number, client?: PrismaClient) =>
        (client ?? prisma).uniform.findFirst({
            where: {
                fk_uniformType,
                number,
                recdelete: null,
            },
            include: {
                issuedEntries: {
                    where: {
                        dateReturned: null
                    },
                    include: {
                        cadet: true,
                    }
                },
                type: true
            }
        });

    getUniformCountByType = async (fk_uniformType: string, client?: PrismaClient) =>
        (client ?? prisma).uniform.count({
            where: {
                fk_uniformType,
                recdelete: null
            }
        });


    createIssuedUniformItem = (data: { number: number; fk_uniformType: string; }, fk_cadet: string, client?: PrismaClient) =>
        (client ?? prisma).uniform.create({
            data: {
                ...data,
                issuedEntries: {
                    create: {
                        fk_cadet
                    }
                }
            }
        });

    createUniformItems = (numberMap: UniformNumbersSizeMap, data: { uniformTypeId: string, generationId?: string, comment: string, active: boolean }, client: Prisma.TransactionClient) =>
        client.uniform.createMany({
            data: numberMap.reduce((arr: Prisma.UniformCreateManyInput[], map) => [
                ...arr,
                ...map.numbers.map(number => ({
                    number: number,
                    fk_uniformType: data.uniformTypeId,
                    fk_generation: data.generationId,
                    fk_size: (map.sizeId !== "amount") ? map.sizeId : null,
                    comment: data.comment,
                    active: data.active,
                })),
            ], []),
        });

    issue = (fk_uniform: string, fk_cadet: string, client?: PrismaClient) =>
        (client ?? prisma).uniformIssued.create({
            data: { fk_cadet, fk_uniform }
        });

    return = (issuedEntryId: string, dateIssued: Date, client?: PrismaClient) => {
        if (isToday(dateIssued)) {
            return (client ?? prisma).uniformIssued.delete({
                where: { id: issuedEntryId }
            });
        } else {
            return (client ?? prisma).uniformIssued.update({
                where: { id: issuedEntryId },
                data: {
                    dateReturned: new Date(),
                },
            });
        }
    }

    returnManyByType = (fk_uniformType: string, client: PrismaClient) => client.uniformIssued.updateMany({
        where: {
            uniform: { fk_uniformType },
            dateReturned: null,
        },
        data: {
            dateReturned: new Date(),
        }
    });

    deleteManyByType = (fk_uniformType: string, username: string, client: PrismaClient) => client.uniform.updateMany({
        where: {
            fk_uniformType,
            recdelete: null,
        },
        data: {
            recdelete: new Date(),
            recdeleteUser: username,
        }
    });
}
