"use server";

import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { UniformType } from "@/types/globalUniformTypes";
import { uniformTypeFormSchema, UniformTypeFormType } from "@/zod/uniformConfig";
import { __unsecuredGetUniformTypeList } from "./get";
import { SAReturnType } from "@/dal/_helper/testHelper";

export const update = (props: UniformTypeFormType): SAReturnType<UniformType[]> => genericSAValidator(
    AuthRole.materialManager,
    props,
    uniformTypeFormSchema, // uniformTypeValidator.test(data),
    { uniformTypeId: props.id, uniformSizelistId: props.fk_defaultSizelist }
).then(([{ assosiation }, data]) => prisma.$transaction(async (client) => {
    const list = await client.uniformType.findMany({
        where: {
            fk_assosiation: assosiation,
            recdelete: null,
        }
    });

    if (list.find(t => t.id !== data.id && t.name === data.name)) {
        return {
            error: {
                message: "custom.uniform.type.nameDuplication",
                formElement: "name",
            }
        };
    }

    const acronymDupl = list.find(t => t.id !== data.id && t.acronym === data.acronym);
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
            id: data.id,
        },
        data: data
    });

    return __unsecuredGetUniformTypeList(assosiation, client);
}));
