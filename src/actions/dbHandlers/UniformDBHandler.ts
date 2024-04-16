import { prisma } from "@/lib/db";
import { CadetUniformMap } from "@/types/globalCadetTypes";
import { uniformArgs } from "@/types/globalUniformTypes";
import { PrismaClient } from "@prisma/client";
import { isToday } from "date-fns";


export class UniformDBHandler {

    getMap = async (cadetId: string, client?: PrismaClient) =>
        (client ?? prisma).uniform.findMany({
            ...uniformArgs,
            where: {
                issuedEntrys: {
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

    getIssuedEntry = async (fk_uniform: string, fk_cadet: string, client?: PrismaClient) =>
        (client ?? prisma).uniformIssued.findFirstOrThrow({
            where: {
                fk_cadet,
                fk_uniform,
                dateReturned: null,
            }
        });

    getUniformWithIssuedEntriesByTypeAndNumber = async (fk_uniformType: string, number: number, client?: PrismaClient) =>
        (client ?? prisma).uniform.findFirst({
            where: {
                fk_uniformType,
                number,
                recdelete: null,
            },
            include: {
                issuedEntrys: {
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

    createIssuedUniformItem = (data: { number: number; fk_uniformType: string; }, fk_cadet: string, client?: PrismaClient) =>
        (client ?? prisma).uniform.create({
            data: {
                ...data,
                issuedEntrys: {
                    create: {
                        fk_cadet
                    }
                }
            }
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