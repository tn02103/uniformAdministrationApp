import { Prisma } from "@prisma/client";

export const dbCadetMaterialArgs = Prisma.validator<Prisma.MaterialArgs>()({
    select: {
        id: true,
        typename: true,
        issuedEntrys: {
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
});
export const materialTypeArgs = Prisma.validator<Prisma.MaterialArgs>()({
    select: {
        id: true,
        typename: true,
        sortOrder: true,
    }
});
export const materialGroupArgs = Prisma.validator<Prisma.MaterialGroupArgs>()({
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
});


export type DBCadetMaterial = Prisma.MaterialGetPayload<typeof dbCadetMaterialArgs>;
export type MaterialGroup = Prisma.MaterialGroupGetPayload<typeof materialGroupArgs>; 
export type Material = Prisma.MaterialGetPayload<typeof materialTypeArgs>;

export interface CadetMaterial {
    id: string;
    typename: string;
    issued: number;
    groupId: string;
}


export interface AdministrationMaterial extends Material {
    actualQuantity: number;
    targetQuantity: number;
    issuedQuantity: number;
}

export interface AdministrationMaterialGroup extends MaterialGroup {
    typeList: AdministrationMaterial[];
}
