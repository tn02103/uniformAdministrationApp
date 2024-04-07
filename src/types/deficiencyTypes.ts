import { Prisma } from "@prisma/client";

export const deficiencyTypeArgs = Prisma.validator<Prisma.CadetDeficiencyTypeArgs>()({
    select: {
        id: true,
        name: true,
        dependsOnUniformitem: true,
        addCommentToUniformitem: true,
    }
})



export type DeficiencyType = Prisma.CadetDeficiencyTypeGetPayload<typeof deficiencyTypeArgs>;

export type Deficiency = {
    id: string;
    typeId: string;
    typeName: string;
    description: string;
    comment: string;
    fk_cadet: string;
    fk_material: string | null;
    fk_uniform: string | null;
    dateCreated: Date;
    dateUpdated: Date;
    dateResolved: Date;
    userCreated: Date;
    userUpdated: Date;
    userResolved: Date;

}

export type CadetInspection = {
    id: string,
    uniformComplete: boolean,
    oldCadetDeficiencies: Deficiency[],
    newCadetDeficiencies: Deficiency[],
}

export type InspectionStatus = {
    active: false,
} | {
    active: true,
    id: string,
    date: Date,
    inspectedCadets: number,
    activeCadets: number,
}

export type InspectionInformation = {
    id: string,
    date: Date,
    cadetsInspected: number,
    newDeficiencies: number,
    activeDeficiencies: number,
    resolvedDeficiencies: number
}

export type InspectionReview = InspectionInformation & {
    cadetList: InspectionReviewCadet[],
    activeDeficiencyList: InspectionReviewDeficiency[],
}

export type InspectionReviewCadet = {
    cadet: {
        id: string,
        firstname: string,
        lastname: string,
    },
    lastInspection: {
        id: string,
        date: Date,
        uniformComplete: boolean,
    }
    activeDeficiencyCount: number,
    newlyClosedDeficiencyCount: number,
    overalClosedDeficiencyCount: number,
}

export type InspectionReviewDeficiency = {
    id: string,
    cadet: {
        id: string,
        firstname: string,
        lastname: string,
    },
    description: string,
    deficiencyType: {
        id: string,
        name?: string,
    },
    comment: string,
    dateCreated?: Date,
    new: boolean,
}
