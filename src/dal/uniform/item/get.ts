import { genericSANoDataValidator, genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { Deficiency } from "@/types/deficiencyTypes";
import { uniformHistoryArgs, UniformHistroyEntry, UniformWithOwner, uniformWithOwnerArgs } from "@/types/globalUniformTypes";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export type ItemLabel = {
    id: string;
    label: string;
    active: boolean;
    typeId: string;
    number: number;
    owner: {
        id: string;
        firstname: string;
        lastname: string;
    } | null;
    storageUnit: {
        id: string;
        name: string;
    } | null;
}
/**
 * Get all uniform items for the assosiation
 * @requires AuthRole.user
 * @returns List of labels for uniform items
 */
export const getItemLabels = async (): Promise<ItemLabel[]> => genericSANoDataValidator(
    AuthRole.user,
).then(([{ assosiation }]) => prisma.uniform.findMany({
    where: {
        type: {
            fk_assosiation: assosiation
        },
        recdelete: null,
    },
    include: {
        type: true,
        storageUnit: true,
        issuedEntries: {
            where: {
                dateReturned: null,
            },
            include: {
                cadet: true,
            },
        },
    },
})).then(data => data.map((item): ItemLabel => ({
    id: item.id,
    number: item.number,
    label: `${item.type.name}-${item.number}`,
    active: item.active,
    typeId: item.type.id,
    owner: item.issuedEntries.length > 0 ? {
        id: item.issuedEntries[0].cadet.id,
        firstname: item.issuedEntries[0].cadet.firstname,
        lastname: item.issuedEntries[0].cadet.lastname,
    } : null,
    storageUnit: item.storageUnit ? {
        id: item.storageUnit.id,
        name: item.storageUnit.name,
    } : null,
})));


export const getHistory = async (props: string): Promise<UniformHistroyEntry[]> => genericSAValidator(
    AuthRole.inspector,
    props,
    z.string().uuid(),
    { uniformId: props }
).then(([, uniformId]) => prisma.uniformIssued.findMany({
    where: {
        fk_uniform: uniformId,
    },
    ...uniformHistoryArgs,
}));

const getDeficienciesPropSchema = z.object({
    uniformId: z.string().uuid(),
    includeResolved: z.boolean().optional(),
});
type GetDeficienciesProps = z.infer<typeof getDeficienciesPropSchema>;

export const getDeficiencies = async (props: GetDeficienciesProps): Promise<Deficiency[]> => genericSAValidator(
    AuthRole.inspector,
    props,
    getDeficienciesPropSchema,
    { uniformId: props.uniformId }
).then(([, { uniformId, includeResolved }]) => prisma.deficiency.findMany({
    where: {
        uniformDeficiency: {
            fk_uniform: uniformId,
        },
        dateResolved: includeResolved ? undefined : null,
    },
    include: {
        type: true,
        uniformDeficiency: true,
    },
    orderBy: [
        { dateCreated: 'asc' },  // Oldest to newest
    ],
})).then((deficiencies) =>
    deficiencies.map((deficiency): Deficiency => ({
        id: deficiency.id,
        typeId: deficiency.type.id,
        typeName: deficiency.type.name,
        description: deficiency.description,
        comment: deficiency.comment,
        dateCreated: deficiency.dateCreated,
        dateUpdated: deficiency.dateUpdated,
        dateResolved: deficiency.dateResolved,
        userCreated: deficiency.userCreated,
        userUpdated: deficiency.userUpdated,
        userResolved: deficiency.userResolved,
    }))
);

const getListWithOwnerPropSchema = z.object({
    uniformTypeId: z.string().uuid(),
    orderBy: z.enum(["number", "generation", "size", "comment", "owner"]),
    asc: z.boolean(),
    filter: z.object({
        active: z.boolean().optional(),
        isReserve: z.boolean().optional(),
        issued: z.boolean().optional(),
        notIssued: z.boolean().optional(),
        inStorageUnit: z.boolean().optional(),
        generations: z.record(z.boolean()).optional(),
        sizes: z.record(z.boolean()).optional(),
    }).optional().nullable(),
});
type getListWithOwnerProps = z.infer<typeof getListWithOwnerPropSchema>;

/**
 * used to get the data for the uniformList-Overview 
 * returns all data of unifrom, the owner is returned in the object of issuedEntries as a cadetDescription. 
 * @requires AuthRole.user
 * @param uniformTypeId 
 * @param orderBy number| generation | size | comment | owner
 * @param asc 
 * @param filter filterObject of uniformFilter Pannel
 * @returns UniformWithOwner[]
 */
export const getListWithOwner = async (props: getListWithOwnerProps): Promise<UniformWithOwner[]> => genericSAValidator(
    AuthRole.user,
    props,
    getListWithOwnerPropSchema,
    { uniformTypeId: props.uniformTypeId }
).then(async ([{ }, { uniformTypeId, orderBy, asc, filter }]) => {
    const sqlFilter: Prisma.UniformFindManyArgs["where"] = {};
    const generationFilter = filter?.generations ? Object.entries(filter.generations).filter(([, value]) => value).map(([key,]) => key) : [];
    const sizeFilter = filter?.sizes ? Object.entries(filter.sizes).filter(([, value]) => value).map(([key,]) => key) : [];
    const andConditions: Prisma.UniformWhereInput[] = [];
    if (!filter) {
        sqlFilter["active"] = true;
    } else {
        if (!filter.isReserve) {
            sqlFilter["active"] = true;
        } else if (!filter.active) {
            sqlFilter["active"] = false;
        }

        if (!filter.issued || !filter.notIssued || !filter.inStorageUnit) {
            const orConditions: Prisma.UniformWhereInput[] = [];
            if (filter.issued) {
                orConditions.push({
                    issuedEntries: {
                        some: {
                            dateReturned: null,
                        }
                    }
                });
            }
            if (filter.notIssued) {
                orConditions.push({
                    issuedEntries: {
                        none: {
                            dateReturned: null,
                        }
                    }
                });
            }
            if (filter.inStorageUnit) {
                orConditions.push({
                    storageUnit: {
                        isNot: null,
                    }
                });
            }
            andConditions.push({
                OR: orConditions,
            });
        }
    }
    if (generationFilter.length > 0) {
        andConditions.push({
            OR: [
                { generation: { id: { in: generationFilter } } },
                generationFilter.includes("null") ? { generation: null } : {}
            ]
        });
    }
    if (sizeFilter.length > 0) {
        andConditions.push({
            OR: [
                { size: { id: { in: sizeFilter } } },
                sizeFilter.includes("null") ? { size: null } : {}
            ]
        });
    }

    let sortOrder: Prisma.UniformOrderByWithRelationInput[];
    const ascString = asc ? "asc" : "desc";
    switch (orderBy) {
        case "generation":
            sortOrder = [
                { generation: { sortOrder: ascString } },
                { size: { sortOrder: ascString } },
                { number: ascString },
            ];
            break;
        case "size":
            sortOrder = [
                { size: { sortOrder: ascString } },
                { generation: { sortOrder: ascString } },
                { number: ascString },
            ];
            break;
        case "comment":
            sortOrder = [
                { comment: ascString },
                { number: ascString },
            ];
            break;
        case "owner":
            sortOrder = [
                { number: ascString }
            ];
            break;
        default:
            sortOrder = [{
                number: ascString,
            }];
            break;
    }

    const data = await prisma.uniform.findMany({
        ...uniformWithOwnerArgs,
        where: {
            ...sqlFilter,
            fk_uniformType: uniformTypeId,
            recdelete: null,
            AND: andConditions.length > 0 ? andConditions : undefined,
        },
        orderBy: sortOrder
    });

    if (orderBy !== "owner") {
        return data;
    }

    return data.sort((a, b) => {
        const returnValue = (value: number) => asc ? value : -value;

        // Sort by owner first
        if ((a.issuedEntries.length > 0) && (b.issuedEntries.length > 0)) {
            const nameA = a.issuedEntries[0].cadet.lastname + a.issuedEntries[0].cadet.firstname;
            const nameB = b.issuedEntries[0].cadet.lastname + b.issuedEntries[0].cadet.firstname;
            if (nameA === nameB) {
                return returnValue(a.number - b.number);
            } else {
                return returnValue(nameA.localeCompare(nameB));
            }
        }
        if (a.issuedEntries.length > 0) {
            return returnValue(-1);
        }
        if (b.issuedEntries.length > 0) {
            return returnValue(1);
        }
        // If no owner, sort by storage unit
        if (a.storageUnit && b.storageUnit) {
            if (a.storageUnit.name === b.storageUnit.name) {
                return returnValue(a.number - b.number);
            } else {
                return returnValue(a.storageUnit.name.localeCompare(b.storageUnit.name));
            }
        }
        if (a.storageUnit) {
            return returnValue(-1);
        }
        if (b.storageUnit) {
            return returnValue(1);
        }

        // If no owner and no storage unit, sort by number
        return returnValue(a.number - b.number);
    });
});


