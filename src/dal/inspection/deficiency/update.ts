import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { updateDeficiencySchema } from "@/zod/deficiency";
import { z } from "zod";

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
