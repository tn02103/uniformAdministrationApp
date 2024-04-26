"use server";

import { ExceptionType, UnauthorizedException } from "@/errors/CustomException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { IronSessionUser, getIronSession } from "@/lib/ironSession";
import { UniformType } from "@/types/globalUniformTypes";
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

export const genericSAValidatiorV2 = async (
    requiredRole: AuthRole,
    typeValidation: boolean,
    assosiationValidations: {
        cadetId?: string | string[],
        uniformId?: string | string[],
        uniformTypeId?: string | string[],
        uniformGenerationId?: string | string[],
        uniformSizeListId?: string | string[] | null,
        uniformSizeId?: string | string[],
        materialId?: string | string[],
    }
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

    const validationPromisses: Promise<any>[] = [];
    const validate = (ids: string | string[], validator: (id: string, assosiationId: string) => Promise<any>) => {
        if (Array.isArray(ids)) {
            validationPromisses.push(
                ...ids.map((id) => validator(id, user.assosiation))
            );
        } else {
            validationPromisses.push(
                validator(ids, user.assosiation)
            );
        }
    }

    if (assosiationValidations.cadetId) {
        validate(assosiationValidations.cadetId, validateCadetAssosiation);
    }

    if (assosiationValidations.uniformId) {
        validate(assosiationValidations.uniformId, validateUniformAssosiation);
    }

    if (assosiationValidations.uniformTypeId) {
        validate(assosiationValidations.uniformTypeId, validateUniformTypeAssosiation);
    }

    if (assosiationValidations.materialId) {
        validate(assosiationValidations.materialId, validateMaterailAssosiation);
    }

    if (assosiationValidations.uniformSizeListId && assosiationValidations.uniformSizeListId !== null) {
        validate(assosiationValidations.uniformSizeListId, validateUniformSizeListAssosiation);
    }

    if (assosiationValidations.uniformSizeId) {
        validate(assosiationValidations.uniformSizeId, validateUniformSizeAssosiation);
    }

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
});

const validateUniformSizeListAssosiation = async (id: string, fk_assosiation: string) =>
    prisma.uniformSizelist.findUniqueOrThrow({
        where: { id, fk_assosiation }
    })

const validateUniformSizeAssosiation = async (id: string, fk_assosiation: string) =>
    prisma.uniformSize.findUniqueOrThrow({
        where: { id, fk_assosiation }
    });