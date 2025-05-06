import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { updateUniformDeficiencySchema } from "@/zod/deficiency";
import { z } from "zod";

const createUniformDeficiencySchema = z.object({
    uniformId: z.string().uuid(),
    data: updateUniformDeficiencySchema,
});
type CreateUniformDeficiencyProps = z.infer<typeof createUniformDeficiencySchema>;

export const createUniformDef = async (props: CreateUniformDeficiencyProps) => genericSAValidator(
    AuthRole.inspector,
    props,
    createUniformDeficiencySchema,
    { uniformId: props.uniformId, deficiencytypeId: props.data.typeId }
).then(async ([{ username, assosiation }, { uniformId, data }]) => {
    const type = await prisma.deficiencyType.findUnique({
        where: { id: data.typeId },
    });
    if (!type) {
        throw new Error("Deficiency type not found");
    }
    if (type.dependent !== "uniform") {
        throw new Error("Deficiency type is not uniform dependent");
    }

    const activeInspection = await prisma.inspection.findFirst({
        where: {
            fk_assosiation: assosiation,
            date: new Date(),
            timeStart: { not: null },
            timeEnd: null,
        }
    });

    const uniform = await prisma.uniform.findUnique({
        where: { id: uniformId },
        include: { type: true },
    });

    await prisma.deficiency.create({
        data: {
            fk_deficiencyType: data.typeId,
            comment: data.comment,
            description: `${uniform?.type.name}-${uniform?.number}`,
            userCreated: username,
            dateCreated: new Date(),
            userUpdated: username,
            dateUpdated: new Date(),
            fk_inspection_created: activeInspection?.id,
            uniformDeficiency: {
                create: {
                    fk_uniform: uniformId
                }
            }
        },
    });
});
