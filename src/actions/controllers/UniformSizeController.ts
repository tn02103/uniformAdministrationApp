"use server"

import { ExceptionType } from "@/errors/CustomException";
import SaveDataException from "@/errors/SaveDataException";
import { SAErrorResponse } from "@/errors/ServerActionExceptions";
import { AuthRole } from "@/lib/AuthRoles";
import { Entity } from "@/lib/EntityEnum";
import { prisma } from "@/lib/db";
import { descriptionValidationPattern, nameValidationPattern, uuidValidationPattern } from "@/lib/validations";
import { UniformSizelist } from "@/types/globalUniformTypes";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import UniformSizeDBHandler from "../dbHandlers/UniformSizeDBHandler";
import { genericSAValidatiorV2 } from "../validations";

const dbHandler = new UniformSizeDBHandler();
export const getUniformSizelists = async () => genericSAValidatiorV2(
    AuthRole.user, true, {}
).then(({ assosiation }) => dbHandler.getSizelistList(assosiation));


export const createUniformSizelist = async (name: string): Promise<UniformSizelist> => genericSAValidatiorV2(
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
    { uniformSizelistId: sizelistId }
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
        uniformSizelistId: sizelistId,
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

export const deleteSizelist = async (sizelistId: string): Promise<UniformSizelist[] | SAErrorResponse> => genericSAValidatiorV2(
    AuthRole.materialManager,
    uuidValidationPattern.test(sizelistId),
    { uniformSizelistId: sizelistId }
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

export const createSize = async (name: string) => genericSAValidatiorV2(
    AuthRole.materialManager,
    (nameValidationPattern.test(name)),
    {}
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const sizes = await dbHandler.getAllUniformSizesByAssosiation(assosiation, client as PrismaClient);
    if (sizes.find(s => s.name === name)) {
        throw new SaveDataException('Could not create Size. Size allready exists');
    }

    await dbHandler.createSize(name, sizes.length + 1, assosiation, client as PrismaClient);
    revalidatePath(`/[locale]/${assosiation}/admin/uniform/sizes`, 'page');
    return true;
}));

export const moveSize = async (sizeId: string, up: boolean) => genericSAValidatiorV2(
    AuthRole.materialManager,
    (uuidValidationPattern.test(sizeId) && (typeof up === "boolean")),
    { uniformSizeId: sizeId }
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const size = await dbHandler.getUniformsize(sizeId, client as PrismaClient);

    const newSortOrder = up ? (size.sortOrder - 1) : (size.sortOrder + 1);

    if ((await dbHandler.moveMultipleSizes(assosiation, newSortOrder, newSortOrder, !up, client as PrismaClient)) !== 1) {
        throw new SaveDataException('Could not move second size');
    }

    await dbHandler.setSortorder(sizeId, newSortOrder, client as PrismaClient);
    revalidatePath(`/[locale]/${assosiation}/admin/uniform/sizes`, 'page');
    return true;
}));

export const setSizeSortorder = async (sizeId: string, sortOrder: number) => genericSAValidatiorV2(
    AuthRole.materialManager,
    (uuidValidationPattern.test(sizeId) && Number.isInteger(sortOrder)),
    { uniformSizeId: sizeId }
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const [size, sizeList] = await Promise.all([
        dbHandler.getUniformsize(sizeId, client as PrismaClient),
        dbHandler.getAllUniformSizesByAssosiation(assosiation, client as PrismaClient),
    ]);

    if (sortOrder > sizeList.length) {
        sortOrder = sizeList.length;
    } else if (sortOrder < 1) {
        sortOrder = 1;
    }

    if (sortOrder === size.sortOrder) return;

    const up = sortOrder < size.sortOrder;
    const min = up ? sortOrder : (size.sortOrder + 1);
    const max = up ? (size.sortOrder - 1) : sortOrder;

    const movedSizes = await dbHandler.moveMultipleSizes(assosiation, min, max, !up, client as PrismaClient);
    if (movedSizes !== (max - min + 1)) {
        throw new SaveDataException('Could move all sizes');
    }

    await dbHandler.setSortorder(sizeId, sortOrder, client as PrismaClient);
    revalidatePath(`/[locale]/${assosiation}/admin/uniform/sizes`, 'page');
    return true;
}));

export const deleteSize = async (sizeId: string) => genericSAValidatiorV2(
    AuthRole.materialManager,
    uuidValidationPattern.test(sizeId),
    { uniformSizeId: sizeId }
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const size = await dbHandler.getUniformsize(sizeId, client as PrismaClient);

    await dbHandler.deleteSize(sizeId, client as PrismaClient);
    await dbHandler.moveMultipleSizes(assosiation, size.sortOrder, -1, true, client as PrismaClient);
    revalidatePath(`/[locale]/${assosiation}/admin/uniform/sizes`, 'page');
    return true;
}));
