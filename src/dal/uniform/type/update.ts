import { genericSAValidator } from "@/actions/validations";
import { SAReturnType } from "@/dal/_helper/testHelper";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { UniformType } from "@/types/globalUniformTypes";
import { uniformTypeFormSchema } from "@/zod/uniformConfig";
import { z } from "zod";
import { __unsecuredGetUniformTypeList } from "./get";

const propSchema = z.object({
    id: z.string().uuid(),
    data: uniformTypeFormSchema,
});
export type UniformTypeUpdateProps = z.infer<typeof propSchema>;

export const update = (props: UniformTypeUpdateProps): SAReturnType<UniformType[]> => genericSAValidator(
    AuthRole.materialManager,
    props,
    propSchema,
    { uniformTypeId: props.id, uniformSizelistId: props.data.fk_defaultSizelist }
).then(([{ organisationId }, {id, data}]) => prisma.$transaction(async (client) => {
    const list = await client.uniformType.findMany({
        where: {
            organisationId,
            recdelete: null,
        }
    });

    if (list.find(t => t.id !== id && t.name === data.name)) {
        return {
            error: {
                message: "custom.uniform.type.nameDuplication",
                formElement: "name",
            }
        };
    }

    const acronymDupl = list.find(t => t.id !== id && t.acronym === data.acronym);
    if (acronymDupl) {
        return {
            error: {
                message: "custom.uniform.type.acronymDuplication;name:" + acronymDupl.name,
                formElement: "acronym",
            }
        };
    }
    if (data.usingSizes && !data.fk_defaultSizelist) {
        return {
            error: {
                message: "pleaseSelect",
                formElement: "fk_defaultSizelist"
            }
        };
    }

    await client.uniformType.update({
        where: {
            id,
        },
        data: data
    });

    return __unsecuredGetUniformTypeList(organisationId, client);
}));
