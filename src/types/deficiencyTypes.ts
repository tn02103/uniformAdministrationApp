import { Prisma } from "@prisma/client";

export const deficiencyTypeArgs = Prisma.validator<Prisma.DeficiencyTypeFindManyArgs>()({
    select: {
        id: true,
        name: true,
        dependent: true,
        relation: true,
    }
});

export type DeficiencyType = Prisma.DeficiencyTypeGetPayload<typeof deficiencyTypeArgs>;

export interface AdminDeficiencyType extends DeficiencyType {
    resolved: number;
    active: number;
    disabledUser: string;
    disabledDate: Date;
}

export interface Deficiency {
    id?: string;
    typeId: string;
    typeName: string;
    description: string;
    comment: string;
    dateCreated?: Date;
    dateUpdated?: Date;
    dateResolved?: Date;
    userCreated?: Date;
    userUpdated?: Date;
    userResolved?: Date;
}
export interface CadetDeficiency extends Deficiency {
    fk_cadet: string;
    fk_material?: string;
    fk_uniform?: string;
}
export interface UniformDeficiency extends Deficiency {
    fk_uniform: string;
}

export type CadetInspection = {
    id?: string,
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
