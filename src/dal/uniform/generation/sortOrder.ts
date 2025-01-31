"use server";

import { genericSAValidator } from "@/actions/validations";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { UniformType } from "@/types/globalUniformTypes";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { __unsecuredGetUniformTypeList } from "../type/get";

const propSchema = z.object({
    id: z.string().uuid(),
    up: z.boolean(),
});
type PropType = z.infer<typeof propSchema>;

export const changeUniformGenerationSortOrder = (props: PropType): Promise<UniformType[]> => genericSAValidator(
    AuthRole.materialManager,
    props,
    propSchema,
    { uniformGenerationId: props.id }
).then(([{ assosiation }, { id, up }]) => prisma.$transaction(async (client) => {
    const gen = await client.uniformGeneration.findUniqueOrThrow({
        where: { id }
    });

    // UPDATE sortorder of other generation
    const newSortOrder = up ? (gen.sortOrder - 1) : (gen.sortOrder + 1);


    if (!await updateSeccondGeneration(newSortOrder, gen.fk_uniformType, !up, client)) {
        throw new SaveDataException("Could not update sortOrder of seccond generation");
    }

    // UPDATE sortorder of generation
    await updatePrimaryGeneration(id, up, client);

    return __unsecuredGetUniformTypeList(assosiation, client);
}));

function updateSeccondGeneration(sortOrder: number, fk_uniformType: string, up: boolean, client: Prisma.TransactionClient) {
    return client.uniformGeneration.updateMany({
        where: {
            sortOrder,
            fk_uniformType,
            recdelete: null
        },
        data: {
            sortOrder: up ? { decrement: 1 } : { increment: 1 }
        }
    }).then((res) => res.count === 1);
}
function updatePrimaryGeneration(id: string, up: boolean, client: Prisma.TransactionClient) {
    return client.uniformGeneration.update({
        where: { id },
        data: {
            sortOrder: up ? { decrement: 1 } : { increment: 1 }
        }
    });
}
