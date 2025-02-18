import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { __unsecuredGetUniformTypeList } from "../type/get";

export const markDeleted = (props: string) => genericSAValidator(
    AuthRole.materialManager,
    props,
    z.string().uuid(),
    { uniformGenerationId: props }
).then(([{ assosiation, username }, id]) => prisma.$transaction(async (client) => {
    const gen = await client.uniformGeneration.findUniqueOrThrow({
        where: { id }
    });

    // TODO is this realy the correct way to handle this. 
    // I think the user should maby even decide if all the uniformItems from the Generations schould be deleted 
    // or the generation just set to null. The generation of a uniformItem normaly doesnt change 
    // and its more likely that the itmes should be deleted to.
    await client.uniform.updateMany({
        where: {
            recdelete: null,
            fk_generation: id,
        },
        data: {
            fk_generation: null,
        }
    });
    await client.uniformGeneration.update({
        where: { id },
        data: {
            recdelete: new Date(),
            recdeleteUser: username,
        }
    });
    await client.uniformGeneration.updateMany({
        where: {
            fk_uniformType: gen.fk_uniformType,
            recdelete: null,
            sortOrder: { gt: gen.sortOrder }
        },
        data: {
            sortOrder: { decrement: 1 }
        }
    });

    return __unsecuredGetUniformTypeList(assosiation, client);
}));
