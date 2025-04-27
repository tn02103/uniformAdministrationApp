import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { updateUniformDeficiencySchema } from "@/zod/deficiency";
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
).then(async ([{ username }, { id, data }]) => {
    const type = await prisma.deficiencyType.findUnique({
        where: { id: data.typeId },
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
        },
        data: {
            comment: data.comment,
            fk_deficiencyType: data.typeId,
            userUpdated: username,
            dateUpdated: new Date(),
        },
    });
});
