
import { UnauthorizedException } from "@/errors/CustomException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { IronSessionUser, getIronSession } from "@/lib/ironSession";
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
    deficiencyId?: string | string[],
    inspectionId?: string | string[],
    storageUnitId?: string | string[],
}

function assosiationValidator(assosiationValidations: AssosiationValidationDataType, organisationId: string) {
    const validationPromises: Promise<object>[] = [];
    const validate = (ids: string | (string | undefined)[], validator: (id: string, organisationId: string) => Promise<object>) => {
        if (Array.isArray(ids)) {
            validationPromises.push(
                ...ids.filter(id => id != undefined).map((id) => validator(id as string, organisationId))
            );
        } else {
            validationPromises.push(
                validator(ids, organisationId)
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
    if (assosiationValidations.deficiencyId) {
        validate(assosiationValidations.deficiencyId, validateDeficiencyAssosiation);
    }
    if (assosiationValidations.inspectionId) {
        validate(assosiationValidations.inspectionId, validateInspectionAssosiation);
    }
    if (assosiationValidations.storageUnitId) {
        validate(assosiationValidations.storageUnitId, validateStorageUnitAssosiation);
    }
    return Promise.all(validationPromises);
}


export const genericSAValidator = async <T>(
    requiredRole: AuthRole,
    data: T,
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
        await assosiationValidator(assosiationValidations, user.organisationId);
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

    await assosiationValidator(assosiationValidations, user.organisationId);

    return user;
}


export const validateUserAssosiation = async (id: string, organisationId: string) => prisma.user.findUniqueOrThrow({
    where: { id, organisationId }
});
export const validateCadetAssosiation = async (cadetId: string, organisationId: string) => prisma.cadet.findUniqueOrThrow({
    where: {
        id: cadetId,
        organisationId,
        recdelete: null,
    }
});

const validateUniformTypeAssosiation = async (typeId: string, organisationId: string) => prisma.uniformType.findUniqueOrThrow({
    where: {
        id: typeId,
        organisationId,
        recdelete: null,
    }
});
export const validateUniformAssosiation = async (uniformId: string, organisationId: string) => prisma.uniform.findUniqueOrThrow({
    where: {
        id: uniformId,
        recdelete: null,
        type: {
            organisationId
        }
    }
});
const validateMaterialGroupAssosiation = async (materialGroupId: string, organisationId: string) =>
    prisma.materialGroup.findUniqueOrThrow({
        where: {
            id: materialGroupId,
            recdelete: null,
            organisationId,
        }
    });

const validateMaterailAssosiation = async (materialId: string, organisationId: string) => prisma.material.findUniqueOrThrow({
    where: {
        id: materialId,
        recdelete: null,
        materialGroup: {
            organisationId,
        }
    }
});

const validateUniformSizelistAssosiation = async (id: string, organisationId: string) =>
    prisma.uniformSizelist.findUniqueOrThrow({
        where: { id, organisationId }
    })

const validateUniformSizeAssosiation = async (id: string, organisationId: string) =>
    prisma.uniformSize.findUniqueOrThrow({
        where: { id, organisationId }
    });

const validateDeficiencytypeAssosiation = async (id: string, organisationId: string) =>
    prisma.deficiencyType.findUniqueOrThrow({
        where: {
            id, organisationId
        }
    });
const validateDeficiencyAssosiation = async (id: string, organisationId: string) =>
    prisma.deficiency.findUniqueOrThrow({
        where: {
            id,
            type: {
                organisationId
            }
        }
    });
const validateInspectionAssosiation = async (id: string, organisationId: string) =>
    prisma.inspection.findUniqueOrThrow({
        where: { id, organisationId }
    });

const validateStorageUnitAssosiation = async (id: string, organisationId: string) =>
    prisma.storageUnit.findUniqueOrThrow({
        where: { id, organisationId }
    });