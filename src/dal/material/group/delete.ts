"use server";

import { genericSAValidatorV2, genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Markes MaterialGroup as deleted. All Materials of this Group are returned and marked as deleted as well.
 * Revalidtes Path of MaterialAdministrationPage. 
 * @param materialGroupId 
 * @returns 
 */
export const deleteMaterialGroup = (props: string) => genericSAValidator(
    AuthRole.materialManager,
    props,
    z.string().uuid(),
    { materialGroupId: props }
).then(async ([id, { assosiation, username }]) => prisma.$transaction(async (client) => {
    const group = await client.materialGroup.findUniqueOrThrow({
        where: {id},
        include: {
            typeList: true
        }
    });
    const date = new Date();

    const typeIdList = group.typeList.map(t => t.id);
    //dirty return Materials
    await client.materialIssued.updateMany({
        where: {
            fk_material: {in: typeIdList},
            dateReturned: null
        },
        data: {
            dateReturned: date,
        }
    });
    // mark types as deleted
    await client.material.updateMany({
        where: {
            fk_materialGroup: id,
            recdelete: null
        },
        data: {
            recdelete: date,
            recdeleteUser: username,
        }
    });

    // mark groups as deleted
    await client.materialGroup.update({
        where:{id},
        data: {
            recdelete: date,
            recdeleteUser: username,
        }
    });
    await client.materialGroup.updateMany({
        where: {
            fk_assosiation: assosiation,
            sortOrder: {gt: group.sortOrder},
            recdelete: null,
        },
        data: {
            sortOrder: {decrement: 1},
        },
    });

    revalidatePath(`/[locale]/${assosiation}/admin/material`, 'page');
}));
