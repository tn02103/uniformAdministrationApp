import { genericSAValidator } from "@/actions/validations";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uniformNumberSchema } from "@/zod/uniform";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const propSchema = z.object({
    numberMap: z.array(z.object({
        sizeId: z.string().uuid().or(z.enum(['amount'])),
        numbers: z.array(uniformNumberSchema),
    })),
    data: z.object({
        uniformTypeId: z.string().uuid(),
        generationId: z.string().uuid().optional(),
        comment: z.string(),
        active: z.boolean(),
    }),
});
type PropType = z.infer<typeof propSchema>

/**
 * Creates multiple UniformItems of a single type
 * @requires AuthRole.inspector
 * @param numbers Numbers of the UniformItem for each size. 
 *  If the Uniformtype does not use sizes, the Array has only one element with sizeId="amount"
 * @param data Data of the uniformItems that are to be created. The size of the Uniform is included in the param numbers
 * @returns number of created Items
 */
export const create = (props: PropType): Promise<number> => genericSAValidator(
    AuthRole.inspector,
    props,
    propSchema,
    {
        uniformTypeId: props.data.uniformTypeId,
        uniformGenerationId: props.data.generationId,
        uniformSizeId: props.numberMap.filter(n => n.sizeId !== "amount").map(n => n.sizeId)
    }
).then(([, { numberMap, data }]) => prisma.$transaction(async (client) => {
    // VALiDATE number
    // with existing
    const allNumbers = numberMap.reduce((arr: number[], value) => ([...arr, ...value.numbers]), []);
    const existingUniforms = await client.uniform.findMany({
        where: {
            fk_uniformType: data.uniformTypeId,
            number: { in: allNumbers },
            recdelete: null,
        }
    });
    if (existingUniforms.length > 0) {
        throw new SaveDataException("Number already in use")
    }

    // for duplications
    const uniqueSet = new Set(allNumbers);
    if (uniqueSet.size !== allNumbers.length) {
        throw new SaveDataException('some number is entered multiple times');
    };

    const type = await prisma.uniformType.findUniqueOrThrow({
        where: { id: data.uniformTypeId },
        include: {
            defaultSizelist: {
                include: { uniformSizes: true }
            },
            uniformGenerationList: {
                where: {
                    recdelete: null,
                },
                include: {
                    sizelist: { include: { uniformSizes: true } }
                }
            }
        }
    });

    // VALIDATE generation
    let sizelist = type.defaultSizelist;
    if (type.usingGenerations) {
        if (!data.generationId) {
            throw new SaveDataException('A genertion is required for this type');
        }
        const gen = type.uniformGenerationList.find(g => g.id === data.generationId);
        if (gen) {
            sizelist = gen.sizelist;
        } else {
            throw new SaveDataException('Not a valid genertion from the uniformType');
        }
    } else {
        if (data.generationId) {
            throw new SaveDataException('Type does not suport generations');
        }
    }

    // VALIDATE size
    let allowedSizes = [];
    if (!type.usingSizes) {
        allowedSizes = ["amount"];
    } else {
        if (!sizelist) {
            throw new SaveDataException('Could not create Uniformitems. Failed to find sizelist for selected type and generation');
        }
        allowedSizes = sizelist.uniformSizes.map(s => s.id);
    }
    if (!numberMap.every(map => allowedSizes.includes(map.sizeId))) {
        throw new SaveDataException("Not allowed size used");
    }

    return prisma.uniform.createMany({
        data: numberMap.reduce((arr: Prisma.UniformCreateManyInput[], map) => [
            ...arr,
            ...map.numbers.map(number => ({
                number,
                fk_uniformType: data.uniformTypeId,
                fk_generation: data.generationId,
                fk_size: (map.sizeId !== "amount") ? map.sizeId : null,
                comment: data.comment,
                active: data.active,
            })),
        ], []),
    }).then(d => d.count);
}));
