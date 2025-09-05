import { genericSAValidator } from "@/actions/validations";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const propSchema = z.object({
    id: z.string().uuid(),
    up: z.boolean(),
});
type PropType = z.infer<typeof propSchema>

/**
 * moves Material up or down by one spot. Revalidates MaterialAdminPage
 * @param materialId 
 * @param up 
 * @returns 
 */
export const changeSortOrder = (props: PropType) => genericSAValidator(
    AuthRole.materialManager,
    props,
    propSchema,
    { materialId: props.id }
).then(async ([{ organisationId }, { id, up },]) => prisma.$transaction(async (client) => {
    const material = await client.material.findUniqueOrThrow({ where: { id } });
    if (up) {
        if (material.sortOrder === 0) {
            throw new SaveDataException('Could not change SortOrder. Element already first in list');
        }
    } else {
        const typeCount = await client.material.aggregate({
            _count: true,
            where: { fk_materialGroup: material.fk_materialGroup, recdelete: null }
        });
        if (material.sortOrder >= (typeCount._count - 1)) {
            throw new SaveDataException('Could not change SortOrder. Element already last in list');
        }
    }

    const newSortOrder = up ? (material.sortOrder - 1) : (material.sortOrder + 1);
    if (!await updateSecondMaterial(newSortOrder, material.fk_materialGroup, !up, client)) {
        throw new SaveDataException('Could not update sortOrder of seccond materialType');
    }

    await updateMainMaterial(id, up, client);

    revalidatePath(`/[locale]/${organisationId}/admin/material`, 'page');
}));

function updateSecondMaterial(sortOrder: number, fk_materialGroup: string, up: boolean, client: Prisma.TransactionClient) {
    return client.material.updateMany({
        where: {
            fk_materialGroup,
            sortOrder,
            recdelete: null,
        },
        data: {
            sortOrder: up ? { decrement: 1 } : { increment: 1 },
        }
    }).then(result => (result.count === 1));
}
function updateMainMaterial(id: string, up: boolean, client: Prisma.TransactionClient) {
    return client.material.update({
        where: { id },
        data: {
            sortOrder: up ? { decrement: 1 } : { increment: 1 },
        },
    });
}
