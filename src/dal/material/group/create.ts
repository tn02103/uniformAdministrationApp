import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Create a new MaterialGroup for usesOrganisation. Initial data is automaticly created.
 * @returns 
 */

export const create = async () => genericSANoDataValidator(
    AuthRole.materialManager
).then(async ([{ organisationId }]) => {
    const data = prisma.$transaction(
        async (client) => {
            const groupList = await client.materialGroup.findMany({
                where: { organisationId, recdelete: null }
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
                    organisationId,
                    description,
                    multitypeAllowed: false,
                    sortOrder: groupList.length,
                }
            });
        }
    );

    revalidatePath(`/[locale]/${organisationId}/admin/material`, 'page');
    return data;
});
