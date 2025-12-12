import { genericSAValidator } from "@/actions/validations";
import CustomException, { ExceptionType } from "@/errors/CustomException";
import { UniformIssuedException } from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { Prisma } from "@/prisma/client";
import { z } from "zod";
import { __unsecuredGetUnitsWithUniformItems, StorageUnitWithUniformItems } from "./get";

const propSchema = z.object({
    storageUnitId: z.string().uuid(),
    uniformId: z.string().uuid(),
    replaceStorageUnit: z.boolean().optional(),
});
type PropType = z.infer<typeof propSchema>;

/**
 * Adds uniform to storage unit
 * @requires AuthRole.inspector
 * @param props {storageUnitId, uniformId}
 * @returns List of storage units with uniform items
 */
export const addUniform = async (props: PropType): Promise<StorageUnitWithUniformItems[] | {
    error: object;
}> => genericSAValidator(
    AuthRole.inspector,
    props,
    propSchema,
    { storageUnitId: props.storageUnitId, uniformId: props.uniformId }
).then(([{ assosiation }, { storageUnitId, uniformId }]) => prisma.$transaction(async (client) => {
    const uniform = await client.uniform.findUniqueOrThrow({
        where: { id: uniformId },
        include: {
            issuedEntries: {
                where: {
                    dateReturned: null,
                },
                include: {
                    cadet: true,
                }
            },
            storageUnit: true,
        }
    });
    const storageUnit = await client.storageUnit.findUniqueOrThrow({
        where: { id: storageUnitId },
        include: {
            uniformList: true,
        }
    });

    if (uniform.storageUnit && !props.replaceStorageUnit) {
        throw new CustomException(
            "uniform already is in a storage unit",
            ExceptionType.InUseException,
            {
                storageUnit: {
                    id: uniform.storageUnit.id,
                    name: uniform.storageUnit.name,
                    description: uniform.storageUnit.description,
                }
            }
        );
    }
    if (uniform.issuedEntries.length > 0) {
        throw new UniformIssuedException(uniform.id, uniform.number, uniform.issuedEntries[0].cadet);
    }

    const data: Prisma.UniformUpdateArgs["data"] = { storageUnitId };
    if (uniform.active && storageUnit?.isReserve) {
        data.active = false;
    }

    await client.uniform.update({
        where: { id: uniformId },
        data
    });
    return __unsecuredGetUnitsWithUniformItems(assosiation, client);
}));
