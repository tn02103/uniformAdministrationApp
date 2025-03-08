import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { __unsecuredGetUnitsWithUniformItems } from "./get";
import { IncomingMessage } from "http";

const propSchema = z.object({
    uniformIds: z.array(z.string().uuid()),
    storageUnitId: z.string().uuid()
});
type PropType = z.infer<typeof propSchema>;
export const removeUniform = (props: PropType) => genericSAValidator(
    AuthRole.materialManager,
    props,
    propSchema,
    { uniformId: props.uniformIds, storageUnitId: props.storageUnitId },
).then(async ([{ assosiation }, {uniformIds, storageUnitId}]) => prisma.$transaction(async (client) => {
    const updateItems = await client.uniform.updateMany({
        where: { 
            id: { in: uniformIds },
            storageUnitId,
         },
        data: {
            storageUnitId: null
        }
    }).then((result) => result.count === uniformIds.length);
    if (!updateItems) {
        throw new Error("Failed to update uniforms");
    }
    return __unsecuredGetUnitsWithUniformItems(assosiation);
}));
