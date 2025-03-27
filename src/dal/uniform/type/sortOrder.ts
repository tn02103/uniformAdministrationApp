import { genericSAValidator } from "@/actions/validations";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { __unsecuredGetUniformTypeList } from "./get";

const propShema = z.object({
    typeId: z.string().uuid(),
    newPosition: z.number(),
});
type PropType = z.infer<typeof propShema>;
export const changeSortOrder = (props: PropType) => genericSAValidator(
    AuthRole.materialManager,
    props,
    propShema,
    { uniformTypeId: props.typeId }
).then(([{ assosiation }, { typeId, newPosition }]) => prisma.$transaction(async (client) => {
    const type = await prisma.uniformType.findUniqueOrThrow({
        where: {
            id: typeId
        }
    });
    if (type.sortOrder === newPosition) {
        return __unsecuredGetUniformTypeList(assosiation, client);
    }

    const listsize = await prisma.uniformType.count({
        where: {
            fk_assosiation: assosiation,
            recdelete: null
        }
    });
    console.log('changeSortOrder', typeId, newPosition, type, listsize);

    if (newPosition < 0 || newPosition >= listsize) {
        throw new SaveDataException("Invalid newPosition");
    }

    // UPDATE sortorder of other type
    const up = newPosition < type.sortOrder;
    const upperLimit = up ? newPosition : (type.sortOrder + 1);
    const lowerLimit = up ? (type.sortOrder - 1) : newPosition;
    if (!await updateOtherTypes(upperLimit, lowerLimit, up, assosiation, client)) {
        throw new SaveDataException("Could not update sortOrder of other types");
    }

    // UPDATE sortorder of type
    await updateInitialType(typeId, newPosition, client);
    return __unsecuredGetUniformTypeList(assosiation, client)
}));

const updateOtherTypes = (upperLimit: number, lowerLimit: number, up: boolean, fk_assosiation: string, client: Prisma.TransactionClient) =>
    client.uniformType.updateMany({
        where: {
            sortOrder: { gte: upperLimit, lte: lowerLimit },
            fk_assosiation,
            recdelete: null
        },
        data: {
            sortOrder: up ? { increment: 1 } : { decrement: 1 }
        }
    }).then((result) => result.count === ((lowerLimit - upperLimit) + 1));

const updateInitialType = (id: string, newPosition: number, client: Prisma.TransactionClient) =>
    client.uniformType.update({
        where: {
            id,
        },
        data: {
            sortOrder: newPosition
        }
    });
