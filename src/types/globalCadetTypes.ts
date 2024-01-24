import { Prisma } from "@prisma/client";
import { CadetMaterial } from "./globalMaterialTypes";
import { Uniform } from "./globalUniformTypes";

export const cadetArgs = Prisma.validator<Prisma.CadetArgs>()({
    select: {
        id: true,
        firstname: true,
        lastname: true,
        active: true,
        comment: true
    }
});

export type CadetUniformMap = { [key in string]: Uniform[] };
export type CadetMaterialMap = { [key in string]: CadetMaterial[]};

export type Cadet = Prisma.CadetGetPayload<typeof cadetArgs>;
