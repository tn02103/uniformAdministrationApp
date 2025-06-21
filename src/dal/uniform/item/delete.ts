import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { z } from "zod";

/**
 * Marks uniformitem as deleted. May only work if item is not issued.
 * @requires AuthRole.inspector
 * @param uniformId 
 * @returns 
 */
export const markDeleted = (props: string): Promise<void> => genericSAValidator(
    AuthRole.inspector,
    props,
    z.string().uuid(),
    { uniformId: props }
).then(async ([{ username }, id]) => {
    await prisma.$transaction([
        prisma.uniform.update({
            where: { id },
            data: {
                recdelete: new Date(),
                recdeleteUser: username,
            }
        }),
        prisma.uniformIssued.updateMany({
            where: {
                fk_uniform: id,
                dateReturned: null,
            },
            data: {
                dateReturned: new Date(),
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
