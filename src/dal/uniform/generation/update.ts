"use server";

import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { UniformType } from "@/types/globalUniformTypes";
import { uniformGenerationFormSchema } from "@/zod/uniformConfig";
import { z } from "zod";
import { __unsecuredGetUniformTypeList } from "../type/get";


type ReturnType = Promise<{
    error: {
        message: string,
        formElement: string,
    }
} | UniformType[]>
const propSchema = z.object({
    data: uniformGenerationFormSchema,
    id: z.string().uuid(),
});
type PropType = z.infer<typeof propSchema>;

export const updateUniformGeneration = (props: PropType): ReturnType => genericSAValidator(
    AuthRole.materialManager,
    props,
    propSchema,
    { uniformGenerationId: props.id, uniformSizelistId: props.data.fk_sizelist }
).then(([{ assosiation }, { id, data }]) => prisma.$transaction(async (client) => {
    const type = await client.uniformType.findFirstOrThrow({
        where: {
            fk_assosiation: assosiation,
            uniformGenerationList: {
                some: { id }
            }
        }
    });

    const list = await client.uniformGeneration.findMany({
        where: {
            fk_uniformType: type.id,
            recdelete: null,
        }
    });
    if (list.find(g => g.id !== id && g.name === data.name)) {
        return {
            error: {
                message: "custom.uniform.generation.nameDuplication",
                formElement: "name",
            }
        }
    }
    
    if (!type.usingSizes) {
        data.fk_sizelist = null;
    } else if (!data.fk_sizelist) {
        return {
            error: {
                message: "pleaseSelect",
                formElement: "fk_sizelist"
            }
        }
    }

    await client.uniformGeneration.update({
        where: {id},
        data
    });

    return __unsecuredGetUniformTypeList(assosiation, client);
}));
