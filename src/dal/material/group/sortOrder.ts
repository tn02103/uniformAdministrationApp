import { genericSAValidator } from "@/actions/validations";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { Prisma } from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * moves Materialgroup up or down by one spot. Revalidates MaterialAdminPage
 * @param materialGroupId Id of Material to move
 * @param up boolean to determin if Material should move up or down
 * @returns 
 */
const propSchema = z.object({
    groupId: z.string().uuid(),
    up: z.boolean(),
});
type PropType = z.infer<typeof propSchema>;
export const changeSortOrder = async (props: PropType) => genericSAValidator(
    AuthRole.materialManager,
    props,
    propSchema,
    { materialGroupId: props.groupId }
).then(async ([{ assosiation }, { groupId, up }]) => prisma.$transaction(async (client) => {
    const group = await client.materialGroup.findUniqueOrThrow({
        where: { id: groupId }
    });
    if (up) {
        if (group.sortOrder === 0) {
            throw new SaveDataException('Could not change SortOrder. Element already first in list');
        }
    } else {
        const groupCount = await client.materialGroup.aggregate({
            _count: true,
            where: { fk_assosiation: assosiation, recdelete: null }
        });
        if (group.sortOrder >= (groupCount._count - 1)) {
            throw new SaveDataException('Could not change SortOrder. Element already last in list');
        }
    }

    // Update sortorder of other type
    const newSortOrder = up ? (group.sortOrder - 1) : (group.sortOrder + 1);
    if (!await updateSecondGroup(newSortOrder, assosiation, !up, client)) {
        throw new SaveDataException("Could not update sortOrder of seccond materialGroup");
    }

    await updateMainGroup(groupId, up, client);
    revalidatePath(`/[locale]/${assosiation}/admin/material`, 'page');
}));

function updateSecondGroup(sortOrder: number, fk_assosiation: string, up: boolean, client: Prisma.TransactionClient) {
    return client.materialGroup.updateMany({
        where: {
            fk_assosiation,
            sortOrder,
            recdelete: null,
        },
        data: {
            sortOrder: up ? { decrement: 1 } : { increment: 1 },
        }
    }).then(result => (result.count === 1));
}
function updateMainGroup(id: string, up: boolean, client: Prisma.TransactionClient) {
    return client.materialGroup.update({
        where: { id },
        data: {
            sortOrder: up ? { decrement: 1 } : { increment: 1 },
        },
    });
}
