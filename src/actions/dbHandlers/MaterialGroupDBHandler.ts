import { prisma } from "@/lib/db";
import { materialGroupArgs } from "@/types/globalMaterialTypes";
import { Prisma } from "@prisma/client";

export class MaterialGroupDBHandler {

    getNormalList = (organisationId: string, client?: Prisma.TransactionClient) =>
        (client ?? prisma).materialGroup.findMany({
            ...materialGroupArgs,
            where: {
                organisationId,
                recdelete: null,
                typeList: {
                    some: {
                        recdelete: null,
                    }
                }
            },
            orderBy: { sortOrder: "asc" }
        });

    getAdminList = (organisationId: string, client?: Prisma.TransactionClient) =>
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
            where: { organisationId, recdelete: null },
            orderBy: { sortOrder: "asc" }
        });

    getGroup = (id: string, client?: Prisma.TransactionClient) =>
        (client ?? prisma).materialGroup.findUniqueOrThrow({
            where: { id, recdelete: null },
            ...materialGroupArgs
        });

    getMaterialIssueCountsByOrganisation = (organisationId: string) =>
        prisma.materialIssued.groupBy({
            by: ['fk_material'],
            _sum: { quantity: true },
            where: {
                material: {
                    materialGroup: { organisationId }
                },
                dateReturned: null,
            }
        });


    updateSortOrderByOldSortOrder = (organisationId: string, oldSortOrder: number, up: boolean, client: Prisma.TransactionClient) =>
        client.materialGroup.updateMany({
            where: {
                organisationId: organisationId,
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
    moveSortorderUpBelowNumber = (organisationId: string, limit: number, client: Prisma.TransactionClient) =>
        client.materialGroup.updateMany({
            where: {
                organisationId,
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

    create = (organisationId: string, description: string, sortOrder: number, client: Prisma.TransactionClient) =>
        client.materialGroup.create({
            data: {
                organisationId,
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