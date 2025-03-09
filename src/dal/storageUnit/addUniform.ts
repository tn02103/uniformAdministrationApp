import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { optional, z } from "zod";
import { __unsecuredGetUnitsWithUniformItems, StorageUnitWithUniformItems } from "./get";
import CustomException, { ExceptionType } from "@/errors/CustomException";
import { UniformIssuedException } from "@/errors/SaveDataException";
import { Prisma } from "@prisma/client";
import { SAReturnType } from "../_helper/testHelper";

const propSchema = z.object({
    storageUnitId: z.string().uuid(),
    uniformId: z.string().uuid(),
    options: z.object({
        ignoreFull: z.boolean().optional(),
    }).optional(),
});
type PropType = z.infer<typeof propSchema>;

/**
 * Adds uniform to storage unit
 * @requires AuthRole.materialManager
 * @param props {storageUnitId, uniformId}
 * @returns List of storage units with uniform items
 */
export const addUniform = async (props: PropType): Promise<{
    error: {
        message: string,
        formElement: string,
    } | {
        exceptionType: ExceptionType,
        data: any,
    }
} | StorageUnitWithUniformItems[]
> => genericSAValidator(
    AuthRole.materialManager,
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

    if (uniform.storageUnit) {
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
    if (storageUnit.capacity && !props.options?.ignoreFull && storageUnit?.uniformList.length >= storageUnit.capacity) {
        throw new CustomException(
            "Storage unit is at or above capacity",
            ExceptionType.OverCapacityException,
            {
                cpacity: storageUnit.capacity,
                current: storageUnit.uniformList.length,
                storageUnit: {
                    id: storageUnit.id,
                    name: storageUnit.name,
                    description: storageUnit.description,
                },
            },
        );
    }

    const data: Prisma.UniformUpdateArgs["data"] = { storageUnitId };
    if (!uniform.isReserve && storageUnit?.isReserve) {
        data.isReserve = true;
    }

    await client.uniform.update({
        where: { id: uniformId },
        data
    });
    return __unsecuredGetUnitsWithUniformItems(assosiation, client);
})).catch((error) => {
    if (error instanceof CustomException && error.exceptionType !== ExceptionType.SaveDataException) {
        return {
            error: {
                exceptionType: error.exceptionType,
                data: error.data,
            },
        };
    } else {
        throw error;
    }
});
