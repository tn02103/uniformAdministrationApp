import { prisma } from "@/lib/db";
import { CadetMaterialMap } from "@/types/globalCadetTypes";
import { dbCadetMaterialArgs } from "@/types/globalMaterialTypes";
import { PrismaClient } from "@prisma/client";
import { isToday } from "date-fns";

export class CadetMaterialDBHandler {
    /*issueMaterial = async (newMaterialId: string, cadetId: string, quantity: number, client?: PrismaClient) 
        (client?? prisma).
    
    }*/
    getMaterialMap = (fk_cadet: string, fk_assosiation: string, client?: PrismaClient) =>
        (client ?? prisma).material.findMany({
            select: {
                ...dbCadetMaterialArgs.select,
                issuedEntrys: {
                    ...dbCadetMaterialArgs.select.issuedEntrys,
                    where: {
                        fk_cadet,
                        dateReturned: null,
                    },
                },
                materialGroup: {
                    select: {
                        id: true,
                        description: true,
                    },
                },
            },
            where: {
                recdelete: null,
                materialGroup: { fk_assosiation },
                issuedEntrys: {
                    some: {
                        fk_cadet,
                        dateReturned: null,
                    },
                },
            },
            orderBy: { sortOrder: "asc" },
        }).then((data) => data.reduce(
            (map: CadetMaterialMap, item) => {
                if (!map[item.materialGroup.id]) {
                    map[item.materialGroup.id] = [];
                }
                map[item.materialGroup.id].push({
                    ...item,
                    groupId: item.materialGroup.id,
                    groupName: item.materialGroup.description,
                    issued: item.issuedEntrys[0].quantity,
                });
                return map;
            }, {})
        );

    getMaterialIssued = async (fk_cadet: string, fk_material: string, client?: PrismaClient) =>
        (client ?? prisma).materialIssued.findFirstOrThrow({
            where: {
                fk_cadet,
                fk_material,
                dateReturned: null
            },
        });

    issueMaterial = async (fk_material: string, fk_cadet: string, quantity: number, client?: PrismaClient) =>
        (client ?? prisma).materialIssued.create({
            data: {
                fk_cadet,
                fk_material,
                quantity
            }
        });

    returnMaterial = async (issuedEntryId: any, dateIssued: any, client?: PrismaClient) => {
        if (isToday(dateIssued)) {
            // delete entry
            return (client ?? prisma).materialIssued.delete({
                where: { id: issuedEntryId }
            });
        } else {
            // mark as returned
            return (client ?? prisma).materialIssued.update({
                where: {
                    id: issuedEntryId,
                },
                data: {
                    dateReturned: new Date(),
                }
            });
        }
    }
}