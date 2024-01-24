"use server";

import { UnauthenticatedException, UnauthorizedException } from "@/errors/CustomException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { IronSessionUser, getIronSession } from "@/lib/ironSession";
import { redirect } from "next/navigation";

type AssosiationValidationType = {
    value: string | undefined,
    type: "cadet" | "uniform" | "uType" | "material",
}
export const genericSAValidatior = async (
    requiredRole: AuthRole,
    typeValidation: boolean,
    assosiationValidations: AssosiationValidationType[]
): Promise<IronSessionUser> => {
    "use server"

    const { user } = await getIronSession();
    if (!user) {
        return redirect('/login');
    } else if (user.role < requiredRole) {
        throw new UnauthorizedException(`user does not have required role ${requiredRole}`);
    }

    if (!typeValidation) {
        throw new Error("Typevalidation failed");
    }

    await Promise.all(assosiationValidations.map(async ({ value, type }) => {
        if (!value)
            return;

        switch (type) {
            case "cadet":
                return validateCadetAssosiation(value, user.assosiation);
            case "uniform":
                return validateUniformAssosiation(value, user.assosiation);
            case "uType":
                return validateUniformTypeAssosiation(value, user.assosiation);
            case "material":
                return validateMaterailAssosiation(value, user.assosiation);
            default:
                throw Error("Not implemented AssosiationValidation");
        }
    }));
    return user;
}

export const validateUniformAssosiation = async (uniformId: string, assosiationId: string) => prisma.uniform.findUniqueOrThrow({
    where: {
        id: uniformId,
        recdelete: null,
        type: {
            fk_assosiation: assosiationId
        }
    }
});

export const validateCadetAssosiation = async (cadetId: string, assosiationId: string) => prisma.cadet.findUniqueOrThrow({
    where: {
        id: cadetId,
        fk_assosiation: assosiationId,
        recdelete: null,
    }
});

const validateUniformTypeAssosiation = async (typeId: string, assosiationId: string) => prisma.uniformType.findUniqueOrThrow({
    where: {
        id: typeId,
        fk_assosiation: assosiationId,
        recdelete: null,
    }
});

const validateMaterailAssosiation = async (materialId: string, assosiationId: string) => prisma.material.findUniqueOrThrow({
    where: {
        id: materialId,
        recdelete: null,
        materialGroup: {
            fk_assosiation: assosiationId,
        }
    }
})

