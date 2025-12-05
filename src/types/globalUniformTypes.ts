import { Prisma } from "@/prisma/client";

const generationDescriptionArgs = {
    select: {
        id: true,
        name: true,
        outdated: true,
    }
} satisfies Prisma.UniformGenerationFindManyArgs;
const sizeDescriptionArgs = {
    select: {
        id: true,
        name: true,
    }
} satisfies Prisma.UniformSizeFindManyArgs;
const typeDescriptionArgs = {
    select: {
        id: true,
        name: true,
    }
} satisfies Prisma.UniformTypeFindManyArgs;
const storageUnitDescriptionArgs = {
    select: {
        id: true,
        name: true,
        description: true,
        isReserve: true,
    }
} satisfies Prisma.StorageUnitFindManyArgs;
const cadetDescriptionArgs = (config: {withDeleted: boolean}) => ({
    select: {
        id: true,
        firstname: true,
        lastname: true,
        recdelete: config.withDeleted,
    }
}) satisfies Prisma.CadetFindManyArgs;

export const uniformWithOwnerArgs = {
    select: {
        id: true,
        number: true,
        active: true,
        comment: true,
        type: typeDescriptionArgs,
        generation: generationDescriptionArgs,
        size: sizeDescriptionArgs,
        issuedEntries: {
            select: {
                cadet: cadetDescriptionArgs({withDeleted: false}),
                dateIssued: true,
            },
            where: {
                dateReturned: null,
            }
        },
        storageUnit: storageUnitDescriptionArgs,
    }
} satisfies Prisma.UniformFindManyArgs
export const uniformArgs = {
    select: {
        id: true,
        number: true,
        active: true,
        comment: true,
        type: typeDescriptionArgs,
        generation: generationDescriptionArgs,
        size: sizeDescriptionArgs,
        storageUnit: storageUnitDescriptionArgs,
    }
} satisfies Prisma.UniformFindManyArgs;
export const uniformHistoryArgs = {
    select: {
        id: true,
        dateIssued: true,
        dateReturned: true,
        cadet: cadetDescriptionArgs({withDeleted: true}),
    },
    orderBy: {
        dateIssued: "desc",
    }
} satisfies Prisma.UniformIssuedFindManyArgs;

export type UniformWithOwner = Prisma.UniformGetPayload<typeof uniformWithOwnerArgs>;
export type UniformLabel = {
    id: string,
    description: string,
}
export type UniformHistroyEntry = Prisma.UniformIssuedGetPayload<typeof uniformHistoryArgs>;

// CONFIGURATION
export const uniformGenerationArgs = {
    select: {
        id: true,
        name: true,
        fk_sizelist: true,
        outdated: true,
        sortOrder: true,
        sizelist: {
            select: {
                id: true,
                name: true,
            },
        },
    },
    orderBy: { sortOrder: "asc" },
} satisfies Prisma.UniformGenerationFindManyArgs
export const uniformTypeArgs = {
    select: {
        id: true,
        name: true,
        acronym: true,
        issuedDefault: true,
        usingGenerations: true,
        usingSizes: true,
        fk_defaultSizelist: true,
        defaultSizelist: {
            select: {
                id: true,
                name: true,
            }
        },
        uniformGenerationList: {
            ...uniformGenerationArgs,
            where: {
                recdelete: null,
            },
            orderBy: { sortOrder: "asc" }
        },
        sortOrder: true,
    }
} satisfies Prisma.UniformTypeFindManyArgs
export const uniformSizeArgs = {
    select: {
        id: true,
        name: true,
        sortOrder: true,
    }
} satisfies Prisma.UniformSizeFindManyArgs;
export const uniformSizelistArgs = {
    select: {
        id: true,
        name: true,
        uniformSizes: {
            ...uniformSizeArgs,
            orderBy: { sortOrder: "asc" }
        },
    }
} satisfies Prisma.UniformSizelistFindManyArgs;

export type UniformType = Prisma.UniformTypeGetPayload<typeof uniformTypeArgs>;
export type UniformGeneration = Prisma.UniformGenerationGetPayload<typeof uniformGenerationArgs>;
export type UniformSize = Prisma.UniformSizeGetPayload<typeof uniformSizeArgs>;
export type UniformSizelist = Prisma.UniformSizelistGetPayload<typeof uniformSizelistArgs>;

export type UniformConfiguration = {
    uniformTypes: UniformType[],
    uniformSizelists: UniformSizelist[],
};

export type UniformFormData = {
    id: string;
    number: number;
    generation?: string;
    size?: string;
    comment: string;
    active: boolean;
}

export type UniformNumbersSizeMap = {
    sizeId: string;
    numbers: number[];
}[]

export type IssuedEntryType = {
    dateIssued: Date;
    dateReturned: Date | null;
    cadetDeleted: boolean;
    firstname: string;
    lastname: string;
    cadetId: string;
}
