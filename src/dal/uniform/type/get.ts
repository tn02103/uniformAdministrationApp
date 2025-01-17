"use server"
import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uniformTypeArgs } from "@/types/globalUniformTypes";
import { z } from "zod";

export const getUniformType = (props: string) => genericSAValidator(
    AuthRole.user,
    props,
    z.string().uuid(),
).then(([typeId, { assosiation }]) => prisma.uniformType.findUnique({
    where: {
        id: typeId,
        fk_assosiation: assosiation,
    },
    ...uniformTypeArgs
}));


