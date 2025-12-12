import { Prisma } from "@/prisma/client";

export const dbCadetMaterialArgs = {
    select: {
        id: true,
        typename: true,
        materialGroup: {
            select: {
                description: true,
                id: true,
            }
        },
        issuedEntries: {
            select: {
                id: true,
                quantity: true,
                dateReturned: true,
            },
            where: {
                dateReturned: null,
            }
        },
        fk_materialGroup: true,
    }
} satisfies Prisma.MaterialFindManyArgs;
export const materialTypeArgs = {
    select: {
        id: true,
        typename: true,
        sortOrder: true,
    }
} satisfies Prisma.MaterialFindManyArgs;
export const materialGroupArgs = {
    select: {
        id: true,
        description: true,
        issuedDefault: true,
        multitypeAllowed: true,
        sortOrder: true,
        typeList: {
            ...materialTypeArgs,
            where: {
                recdelete: null,
            },
            orderBy: { sortOrder: "asc" }
        }
    },
} satisfies Prisma.MaterialGroupFindManyArgs;


export type DBCadetMaterial = Prisma.MaterialGetPayload<typeof dbCadetMaterialArgs>;
export type MaterialGroup = Prisma.MaterialGroupGetPayload<typeof materialGroupArgs>;
export type Material = Prisma.MaterialGetPayload<typeof materialTypeArgs>;

export interface CadetMaterial {
    id: string;
    typename: string;
    issued: number;
    groupId: string;
    groupName: string;
}


export interface AdministrationMaterial extends Material {
    actualQuantity: number;
    targetQuantity: number;
    issuedQuantity: number;
}

export interface AdministrationMaterialGroup extends MaterialGroup {
    typeList: AdministrationMaterial[];
}
