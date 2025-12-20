import { Prisma } from "@prisma/client";

const generationDescriptionArgs = Prisma.validator<Prisma.UniformGenerationFindManyArgs>()({
    select: {
        id: true,
        name: true,
        isReserve: true,
    }
});
const sizeDescriptionArgs = Prisma.validator<Prisma.UniformSizeFindManyArgs>()({
    select: {
        id: true,
        name: true,
    }
});
const typeDescriptionArgs = Prisma.validator<Prisma.UniformTypeFindManyArgs>()({
    select: {
        id: true,
        name: true,
    }
});
const storageUnitDescriptionArgs = Prisma.validator<Prisma.StorageUnitFindManyArgs>()({
    select: {
        id: true,
        name: true,
        description: true,
        isReserve: true,
    }
});
const cadetDescriptionArgs = (config: {withDeleted: boolean}) => Prisma.validator<Prisma.CadetFindManyArgs>()({
    select: {
        id: true,
        firstname: true,
        lastname: true,
        recdelete: config.withDeleted,
    }
});

export const uniformWithOwnerArgs = Prisma.validator<Prisma.UniformFindManyArgs>()({
    select: {
        id: true,
        number: true,
        isReserve: true,
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
})
export const uniformArgs = Prisma.validator<Prisma.UniformFindManyArgs>()({
    select: {
        id: true,
        number: true,
        isReserve: true,
        comment: true,
        type: typeDescriptionArgs,
        generation: generationDescriptionArgs,
        size: sizeDescriptionArgs,
        storageUnit: storageUnitDescriptionArgs,
    }
});
export const uniformHistoryArgs = Prisma.validator<Prisma.UniformIssuedFindManyArgs>()({
    select: {
        id: true,
        dateIssued: true,
        dateReturned: true,
        cadet: cadetDescriptionArgs({withDeleted: true}),
    },
    orderBy: {
        dateIssued: "desc",
    }
});

export type UniformWithOwner = Prisma.UniformGetPayload<typeof uniformWithOwnerArgs>;
export type UniformLabel = {
    id: string,
    description: string,
}
export type UniformHistroyEntry = Prisma.UniformIssuedGetPayload<typeof uniformHistoryArgs>;

// CONFIGURATION
export const uniformGenerationArgs = Prisma.validator<Prisma.UniformGenerationFindManyArgs>()({
    select: {
        id: true,
        name: true,
        fk_sizelist: true,
        isReserve: true,
        sortOrder: true,
        sizelist: {
            select: {
                id: true,
                name: true,
            },
        },
    },
    orderBy: { sortOrder: "asc" },
})
export const uniformTypeArgs = Prisma.validator<Prisma.UniformTypeFindManyArgs>()({
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
})
export const uniformSizeArgs = Prisma.validator<Prisma.UniformSizeFindManyArgs>()({
    select: {
        id: true,
        name: true,
        sortOrder: true,
    }
});
export const uniformSizelistArgs = Prisma.validator<Prisma.UniformSizelistFindManyArgs>()({
    select: {
        id: true,
        name: true,
        uniformSizes: {
            ...uniformSizeArgs,
            orderBy: { sortOrder: "asc" }
        },
    }
});

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
