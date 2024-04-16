import { prisma } from "@/lib/db";
import { uniformSizeListArgs } from "@/types/globalUniformTypes";

export default class UniformSizeDBHandler {

    getSizeListsList = (fk_assosiation: string) => prisma.uniformSizelist.findMany({
        ...uniformSizeListArgs,
        where: { fk_assosiation },
    });
}