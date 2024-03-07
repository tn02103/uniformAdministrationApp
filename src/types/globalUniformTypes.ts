import { Prisma } from "@prisma/client";

const generationDescriptionArgs = Prisma.validator<Prisma.UniformGenerationArgs>()({
    select: {
        id: true,
        name: true,
        outdated: true,
    }
});
const sizeDescriptionArgs = Prisma.validator<Prisma.UniformSizeArgs>()({
    select: {
        id: true,
        name: true,
    }
});
const typeDescriptionArgs = Prisma.validator<Prisma.UniformTypeArgs>()({
    select: {
        id: true,
        name: true,
    }
});
const cadetDescriptionArgs = Prisma.validator<Prisma.CadetArgs>()({
    select: {
        id: true,
        firstname: true,
        lastname: true,
    }
});
export const uniformWithOwnerArgs = Prisma.validator<Prisma.UniformArgs>()({
    select: {
        id: true,
        number: true,
        active: true,
        comment: true,
        type: typeDescriptionArgs,
        generation: generationDescriptionArgs,
        size: sizeDescriptionArgs,
        issuedEntrys: {
            select: {
                cadet: cadetDescriptionArgs,
            },
            where: {
                dateReturned: null,
            }
        }
    }
})
export const uniformArgs = Prisma.validator<Prisma.UniformArgs>()({
    select: {
        id: true,
        number: true,
        active: true,
        comment: true,
        type: typeDescriptionArgs,
        generation: generationDescriptionArgs,
        size: sizeDescriptionArgs,
    }
})

export type UniformWithOwner = Prisma.UniformGetPayload<typeof uniformWithOwnerArgs>;
export type Uniform = Prisma.UniformGetPayload<typeof uniformArgs>;

// CONFIGURATION
export const uniformGenerationArgs = Prisma.validator<Prisma.UniformGenerationArgs>()({
    select: {
        id: true,
        name: true,
        fk_sizeList: true,
        outdated: true,
        sortOrder: true,
    }
})
export const uniformTypeArgs = Prisma.validator<Prisma.UniformTypeArgs>()({
    select: {
        id: true,
        name: true,
        acronym: true,
        issuedDefault: true,
        usingGenerations: true,
        usingSizes: true,
        fk_defaultSizeList: true,
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
export const uniformSizeArgs = Prisma.validator<Prisma.UniformSizeArgs>()({
    select: {
        id: true,
        name: true,
        sortOrder: true,
    }
});
export const uniformSizeListArgs = Prisma.validator<Prisma.UniformSizelistArgs>()({
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
export type UniformSizeList = Prisma.UniformSizelistGetPayload<typeof uniformSizeListArgs>;

export type UniformConfiguration = {
    uniformTypes: UniformType[],
    uniformSizeLists: UniformSizeList[],
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
}

export type IssuedEntryType = {
    dateIssued: Date;
    dateReturned: Date | null;
    cadetDeleted: boolean;
    firstname: string;
    lastname: string;
    cadetId: string;
}
