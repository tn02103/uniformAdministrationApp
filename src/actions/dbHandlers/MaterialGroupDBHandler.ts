import { prisma } from "@/lib/db";
import { materialGroupArgs } from "@/types/globalMaterialTypes";
import { Prisma } from "@prisma/client";

export class MaterialGroupDBHandler {

    getNormalList = (fk_assosiation: string, client?: Prisma.TransactionClient) =>
        (client ?? prisma).materialGroup.findMany({
            ...materialGroupArgs,
            where: {
                fk_assosiation,
                recdelete: null,
                typeList: {
                    some: {
                        recdelete: null,
                    }
                }
            },
            orderBy: { sortOrder: "asc" }
        });

    getAdminList = (fk_assosiation: string, client?: Prisma.TransactionClient) =>
        (client ?? prisma).materialGroup.findMany({
            select: {
                id: true,
                description: true,
                sortOrder: true,
                issuedDefault: true,
                multitypeAllowed: true,
                typeList: {
                    select: {
                        id: true,
                        typename: true,
                        actualQuantity: true,
                        targetQuantity: true,
                        sortOrder: true,
                    },
                    where: { recdelete: null },
                    orderBy: { sortOrder: "asc" }
                },
            },
            where: { fk_assosiation, recdelete: null },
            orderBy: { sortOrder: "asc" }
        });

    getGroup = (id: string, client?: Prisma.TransactionClient) =>
        (client ?? prisma).materialGroup.findUniqueOrThrow({
            where: { id, recdelete: null },
            ...materialGroupArgs
        });

    getMaterialIssueCountsByAssosiation = (fk_assosiation: string) =>
        prisma.materialIssued.groupBy({
            by: ['fk_material'],
            _sum: { quantity: true },
            where: {
                material: {
                    materialGroup: { fk_assosiation }
                },
                dateReturned: null,
            }
        });


    updateSortOrderByOldSortOrder = (fk_assosiation: string, oldSortOrder: number, up: boolean, client: Prisma.TransactionClient) =>
        client.materialGroup.updateMany({
            where: {
                fk_assosiation: fk_assosiation,
                sortOrder: oldSortOrder,
                recdelete: null,
            },
            data: {
                sortOrder: up
                    ? { decrement: 1 }
                    : { increment: 1 }
            }
        }).then(result => (result.count === 1));
    updateSortOrderById = (id: string, up: boolean, client: Prisma.TransactionClient) =>
        client.materialGroup.update({
            where: { id },
            data: {
                sortOrder: up
                    ? { decrement: 1 }
                    : { increment: 1 }
            }
        });
    moveSortorderUpBelowNumber = (fk_assosiation: string, limit: number, client: Prisma.TransactionClient) =>
        client.materialGroup.updateMany({
            where: {
                fk_assosiation,
                sortOrder: { gt: limit },
                recdelete: null,
            },
            data: {
                sortOrder: { decrement: 1 }
            }
        });

    update = (id: string, description: string, multitypeAllowed: boolean, issuedDefault: number | null, client: Prisma.TransactionClient) =>
        client.materialGroup.update({
            where: { id },
            data: {
                description,
                multitypeAllowed,
                issuedDefault
            }
        });

    create = (fk_assosiation: string, description: string, sortOrder: number, client: Prisma.TransactionClient) =>
        client.materialGroup.create({
            data: {
                fk_assosiation,
                description,
                sortOrder,
                multitypeAllowed: false,
            }
        });

    delete = (id: string, username: string, client: Prisma.TransactionClient) =>
        client.materialGroup.update({
            where: {
                id,
                recdelete: null
            },
            data: {
                recdelete: new Date(),
                recdeleteUser: username,
            }
        });
}