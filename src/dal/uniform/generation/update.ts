import { genericSAValidator } from "@/actions/validations";
import { SAReturnType } from "@/dal/_helper/testHelper";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { UniformType } from "@/types/globalUniformTypes";
import { uniformGenerationFormSchema } from "@/zod/uniformConfig";
import { z } from "zod";
import { __unsecuredGetUniformTypeList } from "../type/get";

const propSchema = z.object({
    data: uniformGenerationFormSchema,
    id: z.string().uuid(),
});
type PropType = z.infer<typeof propSchema>;

export const update = (props: PropType): SAReturnType<UniformType[]> => genericSAValidator(
    AuthRole.materialManager,
    props,
    propSchema,
    { uniformGenerationId: props.id, uniformSizelistId: props.data.fk_sizelist }
).then(([{ organisationId }, { id, data }]) => prisma.$transaction(async (client) => {
    const type = await client.uniformType.findFirstOrThrow({
        where: {
            organisationId,
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
        where: { id },
        data
    });

    return __unsecuredGetUniformTypeList(organisationId, client);
}));
