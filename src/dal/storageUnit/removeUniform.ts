import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { __unsecuredGetUnitsWithUniformItems } from "./get";


export const removeUniform = (props: string) => genericSAValidator(
    AuthRole.materialManager,
    props,
    z.string().uuid(),
    { uniformId: props }
).then(async ([{ assosiation }, id]) => {
    await prisma.uniform.update({
        where: { id},
        data: {
            storageUnitId: null
        }
    });

    return __unsecuredGetUnitsWithUniformItems(assosiation);
});
