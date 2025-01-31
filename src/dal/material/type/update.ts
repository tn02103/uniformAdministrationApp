"use server";

import { genericSAValidator } from "@/actions/validations";
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

type updateMaterialReturnType = {
    error: {
        message: string,
        formElement?: string,
    }
} | void;
/**
 * Updates data of Material
 * @param materialId 
 * @param typename 
 * @param actualQuantity 
 * @param targetQuantity 
 * @returns 
 */
export const updateMaterial = (props: PropType): Promise<updateMaterialReturnType> => genericSAValidator(
    AuthRole.materialManager,
    props,
    propSchema,
    { materialId: props.id }
).then(([{ assosiation }, { id, data }]) => prisma.$transaction(async (client) => {
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
    revalidatePath(`/[locale]/${assosiation}/admin/material`, 'page');
}));
