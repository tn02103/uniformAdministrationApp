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
).then(([{ organisationId }, { typeId, newPosition }]) => prisma.$transaction(async (client) => {
    const type = await client.uniformType.findUniqueOrThrow({
        where: {
            id: typeId
        }
    });

    if (type.sortOrder === newPosition) {
        return __unsecuredGetUniformTypeList(organisationId, client);
    }

    const listsize = await client.uniformType.count({
        where: {
            organisationId,
            recdelete: null
        }
    });

    if (newPosition < 0 || newPosition >= listsize) {
        throw new SaveDataException("Invalid newPosition");
    }

    // UPDATE sortorder of other type
    const up = newPosition < type.sortOrder;
    const upperLimit = up ? newPosition : (type.sortOrder + 1);
    const lowerLimit = up ? (type.sortOrder - 1) : newPosition;
    if (!await updateOtherTypes(upperLimit, lowerLimit, up, organisationId, client)) {
        throw new SaveDataException("Could not update sortOrder of other types");
    }

    // UPDATE sortorder of type
    await updateInitialType(typeId, newPosition, client);
    return __unsecuredGetUniformTypeList(organisationId, client)
}));

const updateOtherTypes = async (upperLimit: number, lowerLimit: number, up: boolean, organisationId: string, client: Prisma.TransactionClient) =>
    client.uniformType.updateMany({
        where: {
            sortOrder: { gte: upperLimit, lte: lowerLimit },
            organisationId,
            recdelete: null
        },
        data: {
            sortOrder: up ? { increment: 1 } : { decrement: 1 }
        }
    }).then((result) => result.count === ((lowerLimit - upperLimit) + 1));

const updateInitialType = async (id: string, newPosition: number, client: Prisma.TransactionClient) =>
    client.uniformType.update({
        where: {
            id,
        },
        data: {
            sortOrder: newPosition
        }
    });
