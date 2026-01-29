
import { UnauthorizedException } from "@/errors/CustomException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { IronSessionUser, getIronSession } from "@/lib/ironSession";
import { redirect } from "next/navigation";
import { z } from "zod";

type OrganisationValidationDataType = {
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

function organisationValidator(organisationValidations: OrganisationValidationDataType, organisationId: string) {
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

    if (organisationValidations.userId) {
        validate(organisationValidations.userId, validateUserOrganisation);
    }

    if (organisationValidations.cadetId) {
        validate(organisationValidations.cadetId, validateCadetOrganisation);
    }

    if (organisationValidations.uniformId) {
        validate(organisationValidations.uniformId, validateUniformOrganisation);
    }

    if (organisationValidations.uniformTypeId) {
        validate(organisationValidations.uniformTypeId, validateUniformTypeOrganisation);
    }

    if (organisationValidations.materialId) {
        validate(organisationValidations.materialId, validateMaterailOrganisation);
    }

    if (organisationValidations.materialGroupId) {
        validate(organisationValidations.materialGroupId, validateMaterialGroupOrganisation);
    }

    if (organisationValidations.uniformSizelistId && organisationValidations.uniformSizelistId !== null) {
        validate(organisationValidations.uniformSizelistId, validateUniformSizelistOrganisation);
    }

    if (organisationValidations.uniformSizeId) {
        validate(organisationValidations.uniformSizeId, validateUniformSizeOrganisation);
    }

    if (organisationValidations.deficiencytypeId) {
        validate(organisationValidations.deficiencytypeId, validateDeficiencytypeOrganisation);
    }
    if (organisationValidations.deficiencyId) {
        validate(organisationValidations.deficiencyId, validateDeficiencyOrganisation);
    }
    if (organisationValidations.inspectionId) {
        validate(organisationValidations.inspectionId, validateInspectionOrganisation);
    }
    if (organisationValidations.storageUnitId) {
        validate(organisationValidations.storageUnitId, validateStorageUnitOrganisation);
    }
    return Promise.all(validationPromises);
}


export const genericSAValidator = async <T>(
    requiredRole: AuthRole,
    data: T,
    shema: z.ZodType<T>,
    organisationValidations?: OrganisationValidationDataType
): Promise<[IronSessionUser, T]> => {
    const [user] = await genericSANoDataValidator(requiredRole);

    const zodResult = shema.safeParse(data);
    if (!zodResult.success) {
        throw zodResult.error;
    }

    if (organisationValidations) {
        await organisationValidator(organisationValidations, user.organisationId);
    }

    return [user, zodResult.data];
}

export const genericSANoDataValidator = async (requiredRole: AuthRole): Promise<[IronSessionUser]> => {
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
    organisationValidations: OrganisationValidationDataType,
): Promise<IronSessionUser> => {
    const [user] = await genericSANoDataValidator(requiredRole);

    if (!typeValidation) {
        throw new Error("Typevalidation failed");
    }

    await organisationValidator(organisationValidations, user.organisationId);

    return user;
}


export const validateUserOrganisation = async (id: string, organisationId: string) => prisma.user.findUniqueOrThrow({
    where: { id, organisationId }
});
export const validateCadetOrganisation = async (cadetId: string, organisationId: string) => prisma.cadet.findUniqueOrThrow({
    where: {
        id: cadetId,
        organisationId,
        recdelete: null,
    }
});

const validateUniformTypeOrganisation = async (typeId: string, organisationId: string) => prisma.uniformType.findUniqueOrThrow({
    where: {
        id: typeId,
        organisationId,
        recdelete: null,
    }
});
export const validateUniformOrganisation = async (uniformId: string, organisationId: string) => prisma.uniform.findUniqueOrThrow({
    where: {
        id: uniformId,
        recdelete: null,
        type: {
            organisationId
        }
    }
});
const validateMaterialGroupOrganisation = async (materialGroupId: string, organisationId: string) =>
    prisma.materialGroup.findUniqueOrThrow({
        where: {
            id: materialGroupId,
            recdelete: null,
            organisationId,
        }
    });

const validateMaterailOrganisation = async (materialId: string, organisationId: string) => prisma.material.findUniqueOrThrow({
    where: {
        id: materialId,
        recdelete: null,
        materialGroup: {
            organisationId,
        }
    }
});

const validateUniformSizelistOrganisation = async (id: string, organisationId: string) =>
    prisma.uniformSizelist.findUniqueOrThrow({
        where: { id, organisationId }
    })

const validateUniformSizeOrganisation = async (id: string, organisationId: string) =>
    prisma.uniformSize.findUniqueOrThrow({
        where: { id, organisationId }
    });

const validateDeficiencytypeOrganisation = async (id: string, organisationId: string) =>
    prisma.deficiencyType.findUniqueOrThrow({
        where: {
            id, organisationId
        }
    });
const validateDeficiencyOrganisation = async (id: string, organisationId: string) =>
    prisma.deficiency.findUniqueOrThrow({
        where: {
            id,
            type: {
                organisationId
            }
        }
    });
const validateInspectionOrganisation = async (id: string, organisationId: string) =>
    prisma.inspection.findUniqueOrThrow({
        where: { id, organisationId }
    });

const validateStorageUnitOrganisation = async (id: string, organisationId: string) =>
    prisma.storageUnit.findUniqueOrThrow({
        where: { id, organisationId }
    });