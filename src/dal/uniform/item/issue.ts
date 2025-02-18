import { genericSAValidator } from "@/actions/validations"
import CustomException, { ExceptionType } from "@/errors/CustomException"
import { NullValueException } from "@/errors/LoadDataException"
import SaveDataException, { UniformInactiveException, UniformIssuedException } from "@/errors/SaveDataException"
import { AuthRole } from "@/lib/AuthRoles"
import { prisma } from "@/lib/db"
import { cadetArgs, CadetUniformMap } from "@/types/globalCadetTypes"
import { uniformNumberSchema } from "@/zod/uniform"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { __unsecuredReturnUniformitem } from "./return"
import { __unsecuredGetCadetUniformMap } from "@/dal/cadet/uniformMap"
import { SAErrorResponseType } from "@/dal/_index"


const propSchema = z.object({
    number: uniformNumberSchema,
    uniformTypeId: z.string().uuid(),
    idToReplace: z.string().uuid().optional(),
    cadetId: z.string().uuid(),
    options: z.object({
        ignoreInactive: z.boolean(),
        force: z.boolean(),
        create: z.boolean(),
    }).partial(),
});
export type IssuePropType = z.infer<typeof propSchema>;


export const issue = async (props: IssuePropType): Promise<CadetUniformMap | SAErrorResponseType> => genericSAValidator<IssuePropType>(
    AuthRole.inspector,
    props,
    propSchema,
    { cadetId: props.cadetId, uniformTypeId: props.uniformTypeId, uniformId: props.idToReplace }
).then(async ([, { number, idToReplace, uniformTypeId, cadetId, options }]) => prisma.$transaction(async (client) => {
    // GET UniformData
    const uniform = await client.uniform.findFirst({
        where: {
            number,
            fk_uniformType: uniformTypeId,
            recdelete: null,
        },
        include: {
            type: true,
            issuedEntries: {
                include: { cadet: { ...cadetArgs } }
            },
        }
    });
    // RETURN previous uniform
    if (idToReplace) {
        const issuedEntry = await client.uniformIssued.findFirst({
            where: {
                dateReturned: null,
                fk_cadet: cadetId,
                uniform: {
                    id: idToReplace,
                    fk_uniformType: uniformTypeId,
                    recdelete: null,
                }
            }
        });
        if (!issuedEntry) throw new SaveDataException('Could not return UniformToReplace. Issued Entry not found: ' + idToReplace);

        await __unsecuredReturnUniformitem(issuedEntry.id, issuedEntry.dateIssued, client as PrismaClient);
    }

    // CREATE or throw erorr if not existing
    if (!uniform) {
        if (!options.create) {
            throw new NullValueException('Could not find Uniformitem', "uniform", { number, type: uniformTypeId });
        }

        await client.uniform.create({
            data: {
                number,
                fk_uniformType: uniformTypeId,
                active: true,
                issuedEntries: {
                    create: {
                        fk_cadet: cadetId,
                    }
                }
            }
        });
        return cadetId;
    }

    // CHECK uniform active
    if ((!options.ignoreInactive) && !uniform.active) {
        throw new UniformInactiveException();
    }

    // CHECK uniform is not issued
    if (uniform.issuedEntries.length > 0) {
        if (!options.force) {
            throw new UniformIssuedException(uniform.id, number, uniform.issuedEntries[0].cadet);
        }

        // get name of of newCadet
        const cadet = await client.cadet.findUniqueOrThrow({
            where: {
                id: cadetId,
                recdelete: null,
            }
        });

        // add comment to other cadet
        const comment = `<<Das Uniformteil ${uniform.type.name} ${uniform.number} wurde ${cadet.firstname} ${cadet.lastname} Überschrieben>>`;
        const addcommentFeedback = await client.$executeRaw`
            UPDATE base.cadet
               SET comment = CONCAT(comment, ${comment}) 
             WHERE id = ${uniform.issuedEntries[0].cadet.id}`
        if (addcommentFeedback !== 1) {
            throw new Error("Could not add comment to previous owner");
        }

        // return uniformItem from other cadet
        await __unsecuredReturnUniformitem(uniform.issuedEntries[0].id, uniform.issuedEntries[0].dateIssued, client);
    }

    // ISSUE uniform item
    await client.uniformIssued.create({
        data: {
            fk_uniform: uniform.id,
            fk_cadet: cadetId,
        }
    });
    return cadetId;
})
).then((cadetId: string) =>
    __unsecuredGetCadetUniformMap(cadetId)
).catch((error: any) => {
    if (error instanceof CustomException && !(error instanceof SaveDataException)) {
        return {
            error: {
                exceptionType: error.exceptionType,
                data: error.data
            }
        }
    } else {
        throw error;
    }
});
