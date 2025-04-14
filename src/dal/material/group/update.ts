import { genericSAValidator } from "@/actions/validations";
import { SAErrorType, SAReturnType } from "@/dal/_helper/testHelper";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { materialGroupFormSchema } from "@/zod/material";
import { revalidatePath } from "next/cache";
import { z } from "zod";


const propSchema = z.object({
    id: z.string().uuid(),
    data: materialGroupFormSchema,
});
type PropType = z.infer<typeof propSchema>;

/**
 * Update data of MaterialGroup 
 * @param materialGroupId id of MaterialGroup
 * @param data data to update
 * @returns 
 */
export const update = async (props: PropType): Promise<void | SAErrorType> => genericSAValidator(
    AuthRole.materialManager,
    props,
    propSchema,
    { materialGroupId: props.id }
).then(async ([{ assosiation }, { id, data }]) => prisma.$transaction(async (client) => {
    const list = await client.materialGroup.findMany({
        where: {
            fk_assosiation: assosiation,
            recdelete: null,
        },
    });

    if (list.some(g => (g.id !== id) && g.description === data.description)) {
        return {
            error: {
                message: "custom.material.groupname.duplication",
                formElement: "description",
            }
        }
    }

    await client.materialGroup.update({
        where: { id },
        data,
    });
    revalidatePath(`/[locale]/${assosiation}/admin/material`, 'page');
}));
