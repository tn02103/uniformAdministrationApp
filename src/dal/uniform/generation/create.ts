import { genericSAValidator } from "@/actions/validations";
import { SAReturnType } from "@/dal/_helper/testHelper";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { UniformType } from "@/types/globalUniformTypes";
import { uniformGenerationFormSchema } from "@/zod/uniformConfig";
import { z } from "zod";
import { __unsecuredGetUniformTypeList } from "../type/get";

const propSchema = uniformGenerationFormSchema.extend({
    uniformTypeId: z.string().uuid(),
});
type PropType = z.infer<typeof propSchema>;

export const create = (props: PropType): SAReturnType<UniformType[]> => genericSAValidator(
    AuthRole.materialManager,
    props,
    propSchema,
    { uniformTypeId: props.uniformTypeId, uniformSizelistId: props.fk_sizelist }
).then(([{ organisationId }, data]) => prisma.$transaction(async (client) => {
    const type = await client.uniformType.findUniqueOrThrow({
        where: {
            id: data.uniformTypeId,
        }
    });
    if (!type.usingGenerations) {
        throw new SaveDataException('generations are not activated for uniformType');
    }
    if (type.usingSizes && !props.fk_sizelist) {
        throw new SaveDataException('fk_sizelist is required for this uniformType');
    }
    else if (!type.usingSizes) {
        data.fk_sizelist = null;
    }

    const generationList = await client.uniformGeneration.findMany({
        where: {
            fk_uniformType: data.uniformTypeId,
            recdelete: null
        }
    });
    if (generationList.find(g => g.name === data.name)) {
        return {
            error: {
                message: "custom.uniform.generation.nameDuplication",
                formElement: "name",
            }
        }
    }

    await client.uniformGeneration.create({
        data: {
            name: data.name,
            outdated: data.outdated,
            fk_sizelist: data.fk_sizelist,
            fk_uniformType: data.uniformTypeId,
            sortOrder: generationList.length,
        }
    });
    return __unsecuredGetUniformTypeList(organisationId, client);
}));
