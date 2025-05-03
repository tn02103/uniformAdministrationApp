import { genericSAValidator } from "@/actions/validations";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uniformArgs, UniformFormData } from "@/types/globalUniformTypes";
import { getUniformFormSchema, UniformFormType } from "@/zod/uniform";
import { notFound } from "next/navigation";

/**
 * used to change the data of a uniformItem.
 * @requires AuthRole.inspector
 * @param data 
 * @returns FormData of the uniform
 */
export const update = (props: UniformFormType): Promise<UniformFormData> => genericSAValidator(
    AuthRole.inspector,
    props,
    getUniformFormSchema(),
    { uniformId: props.id }
).then(async ([, data]) => prisma.$transaction(async (client) => {
    const type = await client.uniformType.findFirstOrThrow({
        where: {
            uniformList: {
                some: { id: data.id }
            }
        }
    });
    if (type.usingSizes && data.size) {
        let sizelistId = type.fk_defaultSizelist;
        if (type.usingGenerations && data.generation) {
            const generation = await client.uniformGeneration.findUniqueOrThrow({
                where: { id: data.generation }
            });
            if (generation.fk_sizelist) {
                sizelistId = generation.fk_sizelist;
            }
        }
        if (!sizelistId) {
            throw new Error('sizelistId is not suposed to be null');
        }
        const sizelist = await client.uniformSizelist.findUniqueOrThrow({
            where: { id: sizelistId },
            include: {
                uniformSizes: true,
            }
        });
        if (!sizelist.uniformSizes.find(s => s.id === data.size)) {
            throw new SaveDataException('Size is not suported by combination of type an generation');
        }
    }

    return client.uniform.update({
        ...uniformArgs,
        where: {
            id: data.id,
        },
        data: {
            active: data.active,
            comment: data.comment,
            fk_generation: type?.usingGenerations ? data.generation ?? null : undefined,
            fk_size: type?.usingSizes ? data.size ?? null : undefined,
        },
    })
})).then(data => !data ? notFound() : ({
    id: data.id,
    number: data.number,
    generation: data.generation?.id,
    size: data.size?.id,
    comment: data.comment ?? "",
    active: data.active,
}));
