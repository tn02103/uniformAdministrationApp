
import { UnauthorizedException } from "@/errors/CustomException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { IronSessionUser, getIronSession } from "@/lib/ironSession";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect } from "next/navigation";
import { z } from "zod";

type AssosiationValidationDataType = {
    userId?: string | string[],
    cadetId?: string | string[],
    uniformId?: string | string[],
    uniformTypeId?: string | string[],
    uniformGenerationId?: string | string[],
    uniformSizelistId?: string | string[] | null,
    uniformSizeId?: string | string[],
    materialId?: string | (string | undefined)[],
    materialGroupId?: string | string[],
    deficiencytypeId?: string | string[],
    inspectionId?: string | string[],
    storageUnitId?: string | string[],
}

export const getSAReturnType = <t>() => {
    type returntype = {
        error: {
            message: string,
            formField?: string,
        }
    }
}
function assosiationValidator(assosiationValidations: AssosiationValidationDataType, fk_assosiation: string) {
    const validationPromisses: Promise<any>[] = [];
    const validate = (ids: string | (string | undefined)[], validator: (id: string, assosiationId: string) => Promise<any>) => {
        if (Array.isArray(ids)) {
            validationPromisses.push(
                ...ids.filter(id => id != undefined).map((id) => validator(id as string, fk_assosiation))
            );
        } else {
            validationPromisses.push(
                validator(ids, fk_assosiation)
            );
        }
    }

    if (assosiationValidations.userId) {
        validate(assosiationValidations.userId, validateUserAssosiation);
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

    if (assosiationValidations.materialGroupId) {
        validate(assosiationValidations.materialGroupId, validateMaterialGroupAssosiation);
    }

    if (assosiationValidations.uniformSizelistId && assosiationValidations.uniformSizelistId !== null) {
        validate(assosiationValidations.uniformSizelistId, validateUniformSizelistAssosiation);
    }

    if (assosiationValidations.uniformSizeId) {
        validate(assosiationValidations.uniformSizeId, validateUniformSizeAssosiation);
    }

    if (assosiationValidations.deficiencytypeId) {
        validate(assosiationValidations.deficiencytypeId, validateDeficiencytypeAssosiation);
    }
    if (assosiationValidations.inspectionId) {
        validate(assosiationValidations.inspectionId, validateInspectionAssosiation);
    }
    if (assosiationValidations.storageUnitId) {
        validate(assosiationValidations.storageUnitId, validateStorageUnitAssosiation);
    }
    return Promise.all(validationPromisses);
}


export const genericSAValidator = async <T>(
    requiredRole: AuthRole,
    data: any,
    shema: z.ZodType<T>,
    assosiationValidations?: AssosiationValidationDataType
): Promise<[IronSessionUser, T]> => {

    const { user } = await getIronSession();
    if (!user) {
        return redirect('/login');
    } else if (user.role < requiredRole) {
        throw new UnauthorizedException(`user does not have required role ${requiredRole}`);
    }

    const zodResult = shema.safeParse(data);
    if (!zodResult.success) {
        throw zodResult.error;
    }

    if (assosiationValidations) {
        await assosiationValidator(assosiationValidations, user.assosiation);
    }

    return [user, zodResult.data];
}

export const genericSANoDataValidator = async (requiredRole: AuthRole) => {
    const { user } = await getIronSession();
    if (!user) {
        return redirect('/login');
    } else if (user.role < requiredRole) {
        throw new UnauthorizedException(`user does not have required role ${requiredRole}`);
    }

    return [user];
}

export const genericSAValidatorV2 = async (
    requiredRole: AuthRole,
    typeValidation: boolean,
    assosiationValidations: AssosiationValidationDataType,
): Promise<IronSessionUser> => {

    const { user } = await getIronSession();
    if (!user) {
        return redirect('/login');
    } else if (user.role < requiredRole) {
        throw new UnauthorizedException(`user does not have required role ${requiredRole}`);
    }

    if (!typeValidation) {
        throw new Error("Typevalidation failed");
    }

    await assosiationValidator(assosiationValidations, user.assosiation);

    return user;
}


export const validateUserAssosiation = async (id: string, fk_assosiation: string) => prisma.user.findUniqueOrThrow({
    where: { id, fk_assosiation }
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
export const validateUniformAssosiation = async (uniformId: string, assosiationId: string) => prisma.uniform.findUniqueOrThrow({
    where: {
        id: uniformId,
        recdelete: null,
        type: {
            fk_assosiation: assosiationId
        }
    }
});
const validateMaterialGroupAssosiation = async (materialGroupId: string, assosiationId: string) =>
    prisma.materialGroup.findUniqueOrThrow({
        where: {
            id: materialGroupId,
            recdelete: null,
            fk_assosiation: assosiationId,
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

const validateUniformSizelistAssosiation = async (id: string, fk_assosiation: string) =>
    prisma.uniformSizelist.findUniqueOrThrow({
        where: { id, fk_assosiation }
    })

const validateUniformSizeAssosiation = async (id: string, fk_assosiation: string) =>
    prisma.uniformSize.findUniqueOrThrow({
        where: { id, fk_assosiation }
    });

const validateDeficiencytypeAssosiation = async (id: string, fk_assosiation: string) =>
    prisma.deficiencyType.findUniqueOrThrow({
        where: {
            id, fk_assosiation
        }
    });
const validateInspectionAssosiation = async (id: string, fk_assosiation: string) =>
    prisma.inspection.findUniqueOrThrow({
        where: { id, fk_assosiation }
    });

const validateStorageUnitAssosiation = async (id: string, assosiationId: string) =>
    prisma.storageUnit.findUniqueOrThrow({
        where: { id, assosiationId }
    });