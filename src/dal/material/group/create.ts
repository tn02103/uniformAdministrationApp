import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Create a new MaterialGroup for usesAssosiation. Initial data is automaticly created.
 * @returns 
 */

export const create = () => genericSANoDataValidator(
    AuthRole.materialManager
).then(async ([{ assosiation }]) => {
    const data = prisma.$transaction(
        async (client) => {
            const groupList = await client.materialGroup.findMany({
                where: { fk_assosiation: assosiation, recdelete: null }
            });

            // CREATE DATA
            let i = 1;
            let description: string;
            do {
                description = `Gruppe-${i}`;
                i++;
            } while (groupList.some(g => g.description === description));

            return client.materialGroup.create({
                data: {
                    fk_assosiation: assosiation,
                    description,
                    multitypeAllowed: false,
                    sortOrder: groupList.length,
                }
            });
        }
    );

    revalidatePath(`/[locale]/${assosiation}/admin/material`, 'page');
    return data;
});
