import { Prisma } from "@/prisma/client";
import { CadetMaterial } from "./globalMaterialTypes";
import { UniformWithOwner } from "./globalUniformTypes";

export const cadetArgs = {
    select: {
        id: true,
        firstname: true,
        lastname: true,
        active: true,
        comment: true
    }
} satisfies Prisma.CadetFindManyArgs;

export const cadetLableArgs = {
    select: {
        id: true,
        firstname: true,
        lastname: true,
    }
} satisfies Prisma.CadetFindManyArgs

export type CadetUniformMap = { [key in string]: UniformWithOwner[] };
export type CadetMaterialMap = { [key in string]: CadetMaterial[] };
export type CadetLabel = Prisma.CadetGetPayload<typeof cadetLableArgs>;

export type Cadet = Prisma.CadetGetPayload<typeof cadetArgs>;
export type PersonnelListCadet = {
    id: string,
    firstname: string,
    lastname: string,
    lastInspection?: Date,
    activeDeficiencyCount?: number,
    uniformComplete?: boolean,
}
