import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export class MaterialDBHandler {

    returnMultipleByIds = (ids: string[], client: Prisma.TransactionClient) =>
        client.materialIssued.updateMany({
            where: {
                fk_material: { in: ids }
            },
            data: {
                dateReturned: new Date(),
            }
        });

    updateSortOrderById = (id: string, up: boolean, client: Prisma.TransactionClient) =>
        client.material.update({
            where: { id },
            data: {
                sortOrder: up
                    ? { decrement: 1 }
                    : { increment: 1 }
            }
        });
    closeSortOrderGap = (fk_materialGroup: string, sortOrder: number, client: Prisma.TransactionClient) =>
        client.material.updateMany({
            where: {
                fk_materialGroup,
                sortOrder: { gt: sortOrder },
                recdelete: null,
            },
            data: {
                sortOrder: { decrement: 1 },
            },
        });

    update = (id: string, typename: string, actualQuantity: number, targetQuantity: number, client: Prisma.TransactionClient) =>
        client.material.update({
            where: { id },
            data: {
                typename,
                actualQuantity,
                targetQuantity,
            }
        });

    create = (fk_materialGroup: string, name: string, actualQuantity: number, targetQuantity: number, sortOrder: number, client: Prisma.TransactionClient) =>
        client.material.create({
            data: {
                fk_materialGroup,
                typename: name,
                actualQuantity,
                targetQuantity,
                sortOrder,
            }
        });

    deleteByGroupId = (fk_materialGroup: string, username: string, client: Prisma.TransactionClient) =>
        client.material.updateMany({
            where: {
                fk_materialGroup,
                recdelete: null,
            },
            data: {
                recdelete: new Date(),
                recdeleteUser: username,
            }
        });
    deleteById = (id: string, username: string, client: Prisma.TransactionClient) =>
        client.material.update({
            where: { id },
            data: {
                recdelete: new Date(),
                recdeleteUser: username,
            }
        });

    returnAllById = (fk_material: string, client: Prisma.TransactionClient) =>
        client.materialIssued.updateMany({
            where: {
                fk_material,
                dateReturned: null,
            },
            data: {
                dateReturned: new Date(),
            }
        });
}