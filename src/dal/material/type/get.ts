import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { AdministrationMaterialGroup, materialGroupArgs } from "@/types/globalMaterialTypes";
import { Prisma } from "@prisma/client";

/**
 * Genneral configuration for Materials. Can be used in for all Authroles 
 * @returns Array of all MaterialGroups with Materials. MaterialGroups without any Materials are not included.
 */
export const getConfiguration = async () =>
    genericSANoDataValidator(AuthRole.user).then(async ([{ organisationId }]) =>
        prisma.materialGroup.findMany({
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
        })
    );


/**
 * Configuration of MaterialGroups & Types for Administration of theses. 
 * @returns list of MaterialGroups
 */
export const getAdministrationConfiguration = (): Promise<AdministrationMaterialGroup[]> =>
    genericSANoDataValidator(AuthRole.materialManager).then(async ([{ organisationId }]) => {
        const [groups, issuedQuantities] = await prisma.$transaction([
            getAdminList(organisationId),
            getMaterialIssueCountsByOrganisation(organisationId),
        ]);

        return groups.map(group => ({
            ...group,
            typeList: group.typeList.map(type => ({
                ...type,
                issuedQuantity: issuedQuantities.find(iq => iq.fk_material === type.id)?._sum.quantity ?? 0
            })),
        }));
    });

const getAdminList = (organisationId: string, client?: Prisma.TransactionClient) =>
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
const getMaterialIssueCountsByOrganisation = (organisationId: string) =>
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