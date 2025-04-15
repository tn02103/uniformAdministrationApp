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
    newPosition: z.number(),
});
type PropType = z.infer<typeof propSchema>;

export const changeSortOrder = (props: PropType): Promise<UniformType[]> => genericSAValidator(
    AuthRole.materialManager,
    props,
    propSchema,
    { uniformGenerationId: props.id }
).then(([{ assosiation }, { id, newPosition }]) => prisma.$transaction(async (client) => {
    const generation = await prisma.uniformGeneration.findUniqueOrThrow({
        where: { id }
    });
    if (generation.sortOrder === newPosition) {
        return __unsecuredGetUniformTypeList(assosiation, client);
    }

    const count = await prisma.uniformGeneration.count({
        where: {
            fk_uniformType: generation.fk_uniformType,
            recdelete: null
        }
    });

    if (newPosition < 0 || newPosition >= count) {
        throw new SaveDataException("Invalid newPosition");
    }

    // UPDATE sortorder of other type
    const up = newPosition < generation.sortOrder;
    const upperLimit = up ? newPosition : (generation.sortOrder + 1);
    const lowerLimit = up ? (generation.sortOrder - 1) : newPosition;
    if (!await updateOtherTypes(upperLimit, lowerLimit, up, generation.fk_uniformType, client)) {
        throw new SaveDataException("Could not update sortOrder of other types");
    }

    // UPDATE sortorder of type
    await updateInitialType(id, newPosition, client);
    return __unsecuredGetUniformTypeList(assosiation, client)
}));

const updateOtherTypes = async (upperLimit: number, lowerLimit: number, up: boolean, fk_uniformType: string, client: Prisma.TransactionClient) =>
    client.uniformGeneration.updateMany({
        where: {
            sortOrder: { gte: upperLimit, lte: lowerLimit },
            fk_uniformType,
            recdelete: null
        },
        data: {
            sortOrder: up ? { increment: 1 } : { decrement: 1 }
        }
    }).then((result) => result.count === ((lowerLimit - upperLimit) + 1));

const updateInitialType = async (id: string, newPosition: number, client: Prisma.TransactionClient) =>
    client.uniformGeneration.update({
        where: {
            id,
        },
        data: {
            sortOrder: newPosition
        }
    });
