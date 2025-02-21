import { Prisma } from "@prisma/client";

const generationDescriptionArgs = Prisma.validator<Prisma.UniformGenerationFindManyArgs>()({
    select: {
        id: true,
        name: true,
        outdated: true,
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
const cadetDescriptionArgs = Prisma.validator<Prisma.CadetFindManyArgs>()({
    select: {
        id: true,
        firstname: true,
        lastname: true,
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
                cadet: cadetDescriptionArgs,
            },
            where: {
                dateReturned: null,
            }
        }
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
    }
})

export type UniformWithOwner = Prisma.UniformGetPayload<typeof uniformWithOwnerArgs>;
export type Uniform = Prisma.UniformGetPayload<typeof uniformArgs>;
export type UniformLabel = {
    id: string,
    description: string,
}
// CONFIGURATION
export const uniformGenerationArgs = Prisma.validator<Prisma.UniformGenerationFindManyArgs>()({
    select: {
        id: true,
        name: true,
        fk_sizelist: true,
        outdated: true,
        sortOrder: true,
    },
    orderBy: { sortOrder: "asc" }
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
    isReserve: boolean;
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
