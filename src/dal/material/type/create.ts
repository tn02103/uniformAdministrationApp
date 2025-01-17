"use server";

import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { materialTypeFormSchema } from "@/zod/material";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const propSchema = z.object({
    data: materialTypeFormSchema,
    groupId: z.string().uuid(),
});
type PropType = z.infer<typeof propSchema>;

type createMaterialReturnType = Promise<{
    error: {
        message: string,
        formElement: string,
    }
} | void>;

/**
 * creates new Material of materialGroup.
 * @param materialGroupId 
 * @param name 
 * @param actualQuantity 
 * @param targetQuantity 
 * @returns 
 */
export const createMaterial = (props: PropType): createMaterialReturnType => genericSAValidator(
    AuthRole.materialManager,
    props,
    propSchema,
    { materialGroupId: props.groupId }
).then(([{ data, groupId }, { assosiation }]) => prisma.$transaction(async (client) => {
    const group = await client.materialGroup.findUniqueOrThrow({
        where: { id: groupId },
        include: {
            typeList: {
                where: {
                    recdelete: null,
                }
            },
        }
    });

    if (group.typeList.some(t => t.typename === data.typename)) {
        return {
            error: {
                message: "custom.material.typename.duplication",
                formElement: "typename"
            }
        }
    }

    await client.material.create({
        data: {
            ...data,
            fk_materialGroup: groupId,
            sortOrder: group.typeList.length,
        }
    });
    revalidatePath(`/[locale]/${assosiation}/admin/material`, 'page');
}));
