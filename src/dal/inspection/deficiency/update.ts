import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { updateDeficiencySchema, updateUniformDeficiencySchema } from "@/zod/deficiency";
import { z } from "zod";

const updateUniformPropSchema = z.object({
    id: z.string().uuid(),
    data: updateUniformDeficiencySchema,
});
type UpdateUniformProps = z.infer<typeof updateUniformPropSchema>;

export const updateUniform = async (props: UpdateUniformProps) => genericSAValidator(
    AuthRole.inspector,
    props,
    updateUniformPropSchema,
    { deficiencyId: props.id, deficiencytypeId: props.data.typeId }
).then(async ([{ username, assosiation }, { id, data }]) => {
    const type = await prisma.deficiencyType.findFirst({
        where: { id: data.typeId, fk_assosiation: assosiation },
    });
    if (!type) {
        throw new Error("Deficiency type not found");
    }
    if (type.dependent !== "uniform") {
        throw new Error("Deficiency type is not uniform dependent");
    }

    await prisma.deficiency.update({
        where: {
            id,
            type: { fk_assosiation: assosiation },
        },
        data: {
            comment: data.comment,
            fk_deficiencyType: data.typeId,
            userUpdated: username,
            dateUpdated: new Date(),
        },
    });
});

const updateDeficiencyPropSchema = z.object({
    id: z.string().uuid(),
    data: updateDeficiencySchema,
});
type UpdateDeficiencyProps = z.infer<typeof updateDeficiencyPropSchema>;

export const updateDeficiency = async (props: UpdateDeficiencyProps) => genericSAValidator(
    AuthRole.inspector,
    props,
    updateDeficiencyPropSchema,
    { deficiencyId: props.id }
).then(async ([{ username, assosiation }, { id, data }]) => {
    const deficiency = await prisma.deficiency.findFirst({
        where: { id, type: { fk_assosiation: assosiation } },
        include: { type: true },
    });
    if (!deficiency) {
        throw new Error("Deficiency not found");
    }
    const canUpdateDescription = !deficiency.type ||
        (deficiency.type.dependent === 'cadet' && deficiency.type.relation === null);
    await prisma.deficiency.update({
        where: { id, type: { fk_assosiation: assosiation } },
        data: {
            ...(canUpdateDescription && data.description !== undefined ? { description: data.description } : {}),
            comment: data.comment,
            userUpdated: username,
            dateUpdated: new Date(),
        },
    });
});
