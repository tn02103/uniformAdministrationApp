import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uniformSizeArgs } from "@/types/globalUniformTypes";
import { z } from "zod";

export const getUsedSizesByType = (props: string) => genericSAValidator<string>(
    AuthRole.user,
    props,
    z.string().uuid(),
    { uniformTypeId: props }
).then(([typeId,]) => prisma.uniformSize.findMany({
    ...uniformSizeArgs,
    where: {
        uniformList: {
            some: {
                fk_uniformType: typeId,
                recdelete: null,
            }
        }
    },
    orderBy: { sortOrder: "asc" }
}));
