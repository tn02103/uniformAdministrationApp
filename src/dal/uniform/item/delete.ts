import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { z } from "zod";


/**
 * Marks uniformitem as deleted. May only work if item is not issued.
 * @requires AuthRole.materialManager
 * @param uniformId 
 * @returns 
 */
export const markDeleted = (props: string): Promise<void> => genericSAValidator(
    AuthRole.materialManager,
    props,
    z.string().uuid(),
    { uniformId: props }
).then(async ([{ username }, id]) => {
     const issued = await prisma.uniformIssued.aggregate({
        where: {
            fk_uniform: id,
            dateReturned: null
        },
        _count: true
    }).then((data) => data._count > 0);

    if (issued) {
        throw new Error("Item can not be deleted while issued");
    }
    await prisma.$transaction([
        prisma.uniform.update({
            where: { id },
            data: {
                recdelete: new Date(),
                recdeleteUser: username,
            }
        }),
        prisma.deficiency.updateMany({
            where: {
                uniformDeficiency: { fk_uniform: id },
                dateResolved: null,
            },
            data: {
                dateResolved: new Date(),
                userResolved: username,
            }
        }),
    ]);
});
