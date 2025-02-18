import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * 
 * @param materialId 
 * @returns 
 */
export const markDeleted = (props: string) => genericSAValidator(
    AuthRole.materialManager,
    props,
    z.string().uuid(),
    { materialId: props }
).then(([{ username, assosiation }, id]) => prisma.$transaction(async (client) => {
    const material = await prisma.material.findUniqueOrThrow({ where: { id } });

    await client.materialIssued.updateMany({
        where: {
            fk_material: id,
            dateReturned: null,
        },
        data: {
            dateReturned: new Date(),
        }
    });
    await client.material.update({
        where: { id },
        data: {
            recdelete: new Date(),
            recdeleteUser: username,
        }
    });
    await client.material.updateMany({
        where: {
            sortOrder: { gt: material.sortOrder },
            recdelete: null,
        },
        data: {
            sortOrder: { decrement: 1 }
        }
    })
    revalidatePath(`/[locale]/${assosiation}/admin/material`, 'page');
}));
