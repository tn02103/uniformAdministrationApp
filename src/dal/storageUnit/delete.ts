import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { __unsecuredGetUnitsWithUniformItems, StorageUnitWithUniformItems } from "./get";

/**
 * Marks storageUnit as deleted. May only work if no uniform items are stored in it.
 * @requires AuthRole.materialManager
 * @param storageUnitId 
 * @returns 
 */
export const deleteUnit = (props: string): Promise<StorageUnitWithUniformItems[]> => genericSAValidator(
    AuthRole.materialManager,
    props,
    z.string().uuid(),
    { storageUnitId: props }
).then(async ([{assosiation}, id]) => {
    await prisma.storageUnit.delete({
        where: { id },
    });
    return __unsecuredGetUnitsWithUniformItems(assosiation);
});
