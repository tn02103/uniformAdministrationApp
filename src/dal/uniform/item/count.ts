import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { z } from "zod";


export const getCountByType = async (props: string) => genericSAValidator(
    AuthRole.user,
    props,
    z.string().uuid(),
    { uniformTypeId: props }
).then(([, typeId]) => prisma.uniform.count({
    where: {
        fk_uniformType: typeId,
        recdelete: null
    }
}));
