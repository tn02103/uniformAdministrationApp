import { genericSAValidator } from "@/actions/validations";
import { SAReturnType } from "@/dal/_helper/testHelper";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { materialTypeFormSchema } from "@/zod/material";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const propSchema = z.object({
    id: z.string().uuid(),
    data: materialTypeFormSchema,
});
type PropType = z.infer<typeof propSchema>;

/**
 * Updates data of Material
 * @param materialId 
 * @param typename 
 * @param actualQuantity 
 * @param targetQuantity 
 * @returns 
 */
export const update = (props: PropType): SAReturnType<void> => genericSAValidator(
    AuthRole.materialManager,
    props,
    propSchema,
    { materialId: props.id }
).then(([{ organisationId }, { id, data }]) => prisma.$transaction(async (client) => {
    const material = await client.material.findUniqueOrThrow({ where: { id } });
    const group = await client.materialGroup.findUniqueOrThrow({
        where: { id: material.fk_materialGroup },
        include: {
            typeList: {
                where: {
                    recdelete: null,
                }
            }
        }
    });

    if (group.typeList.some(t => (t.id !== id) && (t.typename === data.typename))) {
        return {
            error: {
                message: "custom.material.typename.duplication",
                formElement: "typename"
            }
        }
    }

    await client.material.update({
        where: { id },
        data,
    });
    revalidatePath(`/[locale]/${organisationId}/admin/material`, 'page');
}));
