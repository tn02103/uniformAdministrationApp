import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/db";
import { createDeficiencySchema, CreateDeficiencyInput, updateUniformDeficiencySchema } from "@/zod/deficiency";
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
            date: dayjs().format("YYYY-MM-DD"),
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
            fk_uniform: uniformId,
        },
    });
});

export const createDeficiency = async (props: CreateDeficiencyInput) => genericSAValidator(
    AuthRole.inspector,
    props,
    createDeficiencySchema,
    {
        deficiencytypeId: props.typeId,
        ...(props.uniformId ? { uniformId: props.uniformId } : {}),
        ...(props.cadetId ? { cadetId: props.cadetId } : {}),
    }
).then(async ([{ username }, { typeId, comment, description, uniformId, cadetId }]) => {
    const type = await prisma.deficiencyType.findUnique({
        where: { id: typeId },
    });
    if (!type) {
        throw new Error("Deficiency type not found");
    }

    let resolvedDescription = description ?? '';
    if (type.dependent === 'uniform') {
        if (!uniformId) {
            throw new Error("uniformId is required for uniform-dependent deficiency type");
        }
        const uniform = await prisma.uniform.findUnique({
            where: { id: uniformId, recdelete: null },
            include: { type: true },
        });
        resolvedDescription = `${uniform?.type.name}-${uniform?.number}`;
    } else if (type.dependent === 'cadet') {
        if (!cadetId) {
            throw new Error("cadetId is required for cadet-dependent deficiency type");
        }
    }

    await prisma.deficiency.create({
        data: {
            fk_deficiencyType: typeId,
            comment,
            description: resolvedDescription,
            userCreated: username,
            dateCreated: new Date(),
            userUpdated: username,
            dateUpdated: new Date(),
            fk_inspection_created: null,
            fk_uniform: uniformId ?? undefined,
            fk_cadet: cadetId ?? undefined,
        },
    });
});
