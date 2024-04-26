"use server"

import { ExceptionType } from "@/errors/CustomException";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { Entity } from "@/lib/EntityEnum";
import { prisma } from "@/lib/db";
import { descriptionValidationPattern, uuidValidationPattern } from "@/lib/validations";
import { UniformSizeList } from "@/types/globalUniformTypes";
import { Prisma, PrismaClient } from "@prisma/client";
import UniformSizeDBHandler from "../dbHandlers/UniformSizeDBHandler";
import { genericSAValidatiorV2 } from "../validations";
import { SAErrorResponse, SAInUseError } from "@/errors/ServerActionExceptions";

const dbHandler = new UniformSizeDBHandler();
export const getUniformSizeLists = async () => genericSAValidatiorV2(
    AuthRole.user, true, {}
).then(({ assosiation }) => dbHandler.getSizelistList(assosiation));


export const createUniformSizeList = async (name: string): Promise<UniformSizeList> => genericSAValidatiorV2(
    AuthRole.materialManager,
    descriptionValidationPattern.test(name),
    {}
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const list = await dbHandler.getSizelistList(assosiation, client as PrismaClient);

    if (list.find(l => l.name === name)) {
        throw new SaveDataException('Could not create Sizelist because name allready in use');
    }

    return dbHandler.createSizelist(name, assosiation, client as PrismaClient);
}));

export const getAllUniformSizesList = async () => genericSAValidatiorV2(
    AuthRole.materialManager,
    true,
    {}
).then(({ assosiation }) => dbHandler.getAllUniformSizesByAssosiation(assosiation));

export const renameSizelist = async (sizelistId: string, name: string) => genericSAValidatiorV2(
    AuthRole.materialManager,
    descriptionValidationPattern.test(name) && uuidValidationPattern.test(sizelistId),
    { uniformSizeListId: sizelistId }
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const lists = await dbHandler.getSizelistList(assosiation, client as PrismaClient);
    if (lists.find(sl => sl.id !== sizelistId && sl.name === name)) {
        throw new SaveDataException('Could not rename Sizelist because name is allready in use');
    }

    await dbHandler.renameSizelist(sizelistId, name, client as PrismaClient);

    return dbHandler.getSizelistList(assosiation, client as PrismaClient);
}));

export const saveSizelistSizes = async (sizelistId: string, sizeIds: string[]) => genericSAValidatiorV2(
    AuthRole.materialManager,
    uuidValidationPattern.test(sizelistId) && sizeIds.every(id => uuidValidationPattern.test(id)),
    {
        uniformSizeListId: sizelistId,
        uniformSizeId: sizeIds,
    }
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    await client.uniformSizelist.update({
        where: { id: sizelistId },
        data: {
            uniformSizes: { set: [] }
        }
    });
    await client.uniformSizelist.update({
        where: { id: sizelistId },
        data: {
            uniformSizes: { connect: sizeIds.map(id => ({ id })) }
        }
    });
    return dbHandler.getSizelistList(assosiation, client as PrismaClient);
}));

export const deleteSizelist = async (sizelistId: string): Promise<UniformSizeList[] | SAErrorResponse> => genericSAValidatiorV2(
    AuthRole.materialManager,
    uuidValidationPattern.test(sizelistId),
    { uniformSizeListId: sizelistId }
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const type = await dbHandler.getTypeUsingSizelist(sizelistId, assosiation, client as PrismaClient);
    if (type) return {
        error: {
            exceptionType: ExceptionType.InUseException,
            data: {
                entity: Entity.UniformType,
                id: type.id,
                name: type.name
            }
        }
    };

    const generation = await dbHandler.getGenerationUsingSizelist(sizelistId, assosiation, client as PrismaClient);
    if (generation)
        return {
            error: {
                exceptionType: ExceptionType.InUseException,
                data: {
                    entity: Entity.UniformGeneration,
                    id: generation.id,
                    name: generation.name
                }
            }
        };

    await dbHandler.deleteSizelist(sizelistId, client as PrismaClient);
    return dbHandler.getSizelistList(assosiation);
}));
