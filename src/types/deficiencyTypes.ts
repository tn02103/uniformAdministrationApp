import { Prisma } from "@/prisma/client";

export const deficiencyTypeArgs = {
    select: {
        id: true,
        name: true,
        dependent: true,
        relation: true,
    }
} satisfies Prisma.DeficiencyTypeFindManyArgs;

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
    dateResolved?: Date | null;
    userCreated?: string;
    userUpdated?: string;
    userResolved?: string | null;
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
    state: 'none' | 'planned' | 'finished'
} | {
    active: false,
    state: 'unfinished',
    id: string,
} | {
    active: true,
    state: 'active',
    id: string,
    date: string,
    inspectedCadets: number,
    activeCadets: number,
    deregistrations: number,
}

export type InspectionInformation = {
    id: string,
    date: string,
    cadetsInspected: number,
    newDeficiencies: number,
    activeDeficiencies: number,
    resolvedDeficiencies: number
}

export type InspectionReview = InspectionInformation & {
    name: string;
    date: string,
    timeStart: string,
    timeEnd: string,
    deregisteredCadets: number;
    activeCadets: number;
    cadetList: InspectionReviewCadet[];
    activeDeficiencyList: InspectionReviewDeficiency[];
}

export type InspectionReviewCadet = {
    cadet: {
        id: string;
        firstname: string;
        lastname: string;
    };
    lastInspection?: {
        id: string;
        date: string;
        uniformComplete: boolean;
    };
    activeDeficiencyCount: number;
    newlyClosedDeficiencyCount: number;
    overalClosedDeficiencyCount: number;
}

export type InspectionReviewDeficiency = {
    id: string,
    cadet?: {
        id: string,
        firstname: string,
        lastname: string,
    },
    description: string,
    deficiencyType: {
        id: string,
        name?: string,
        dependent: string,
        relation: string;
    },
    comment: string,
    dateCreated?: Date,
    new: boolean,
}
