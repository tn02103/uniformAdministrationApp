import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uniformTypeArgs } from "@/types/globalUniformTypes";
import { uniformTypeFormSchema, UniformTypeFormType } from "@/zod/uniformConfig";

export const create = (props: UniformTypeFormType) => genericSAValidator(
    AuthRole.materialManager,
    props,
    uniformTypeFormSchema,
    { uniformSizelistId: props.fk_defaultSizelist }
).then(async ([{ organisationId }, data]) => prisma.$transaction(async (client) => {
    const nameDuplication = await client.uniformType.findFirst({
        where: {
            organisationId,
            recdelete: null,
            name: props.name,
        }
    });
    if (nameDuplication) {
        return {
            error: {
                message: "custom.uniform.type.nameDuplication",
                formElement: "name",
            }
        };
    }

    const acronymDuplication = await client.uniformType.findFirst({
        where: {
            organisationId,
            recdelete: null,
            acronym: props.acronym,
        }
    });
    if (acronymDuplication) {
        return {
            error: {
                message: "custom.uniform.type.acronymDuplication;name:" + acronymDuplication.name,
                formElement: "acronym",
            }
        };
    }

    if (props.usingSizes && !props.fk_defaultSizelist) {
        return {
            error: {
                message: "pleaseSelect",
                formElement: "fk_defaultSizelist"
            }
        };
    }

    const amount = await client.uniformType.count({
        where: {
            organisationId,
            recdelete: null,
        }
    });

    return client.uniformType.create({
        ...uniformTypeArgs,
        data: {
            ...data,
            organisationId,
            sortOrder: amount,
        }
    });
}));
