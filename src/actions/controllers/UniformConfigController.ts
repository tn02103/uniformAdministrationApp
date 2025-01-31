"use server";

import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { descriptionValidationPattern, uuidValidationPattern } from "@/lib/validations";
import { UniformType } from "@/types/globalUniformTypes";
import { UniformGenerationFormType } from "@/zod/uniformConfig";
import { PrismaClient } from "@prisma/client";
import UniformGenerationDBHandler from "../dbHandlers/UniformGenerationDBHandler";
import { UniformTypeDBHandler } from "../dbHandlers/UniformTypeDBHandler";
import { genericSAValidatorV2 } from "../validations";

const dbHandler = new UniformTypeDBHandler();
const generationHandler = new UniformGenerationDBHandler();


type createUniformGenerationReturnType = Promise<{
    error: {
        message: string,
        formElement: string,
    }
}|UniformType[]>
export const createUniformGeneration = (name: string, outdated: boolean, fk_sizelist: string | null, uniformTypeId: string,): createUniformGenerationReturnType => genericSAValidatorV2(
    AuthRole.materialManager,
    (descriptionValidationPattern.test(name)
        && (typeof outdated === "boolean")
        && (!fk_sizelist || uuidValidationPattern.test(fk_sizelist))
        && uuidValidationPattern.test(uniformTypeId)),
    { uniformTypeId }
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const list = await generationHandler.getGenerationListByType(uniformTypeId, client as PrismaClient);
    if (list.find(g => g.name === name)) {
        return {
            error: {
                message: "custom.uniform.generation.nameDuplication",
                formElement: "name",
            }
        }
    }
    await generationHandler.createGeneration(
        { name, outdated, fk_sizelist, sortOrder: list.length },
        uniformTypeId,
        client as PrismaClient);

    return dbHandler.getTypeList(assosiation, client as PrismaClient);
}));

type saveUniformGenerationReturnType = Promise<{
    error: {
        message: string,
        formElement: string,
    }
} | UniformType[]>
export const saveUniformGeneration = (generation: UniformGenerationFormType, id: string,  uniformTypeId: string,): saveUniformGenerationReturnType => genericSAValidatorV2(
    AuthRole.materialManager,
   true, // (uniformGenerationValidator.test(generation) && uuidValidationPattern.test(uniformTypeId)),
    { uniformGenerationId: id, uniformTypeId }
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const list = await generationHandler.getGenerationListByType(uniformTypeId, client as PrismaClient);
    if (list.find(g => g.id !== id && g.name === generation.name)) {
        return {
            error: {
                message: "custom.uniform.generation.nameDuplication",
                formElement: "name",
            }
        }
    }

    const type = await dbHandler.getType(uniformTypeId);
    if (!type.usingSizes) {
        generation.fk_sizelist = null;
    } else if (!generation.fk_sizelist) {
        return {
            error:  {
                message: "pleaseSelect",
                formElement: "fk_sizelist"
            }
        }
    }

    await generationHandler.updateGeneration(id, generation, client as PrismaClient);

    return dbHandler.getTypeList(assosiation, client as PrismaClient);
}));

export const changeUniformGenerationSortOrder = (uniformGenerationId: string, up: boolean): Promise<UniformType[]> => genericSAValidatorV2(
    AuthRole.materialManager,
    (uuidValidationPattern.test(uniformGenerationId)
        && (typeof up === "boolean")),
    { uniformGenerationId }
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const gen = await generationHandler.getGeneration(uniformGenerationId, client as PrismaClient);

    // UPDATE sortorder of other generation
    const newSortOrder = up ? (gen.sortOrder - 1) : (gen.sortOrder + 1);
    if (! await generationHandler.updateSortOrderByOldSortOrder(newSortOrder, gen.fk_uniformType, !up, client as PrismaClient)) {
        throw new SaveDataException("Could not update sortOrder of seccond generation");
    }

    // UPDATE sortorder of generation
    await generationHandler.updateSortOrderById(uniformGenerationId, up, client as PrismaClient);

    return dbHandler.getTypeList(assosiation, client as PrismaClient);
}));

export const deleteUniformGeneration = (uniformGenerationId: string) => genericSAValidatorV2(
    AuthRole.materialManager,
    (uuidValidationPattern.test(uniformGenerationId)),
    { uniformGenerationId }
).then(({ assosiation, username }) => prisma.$transaction(async (client) => {
    const gen = await generationHandler.getGeneration(uniformGenerationId, client as PrismaClient);

    await generationHandler.removeGenerationFromUniformItems(uniformGenerationId, client as PrismaClient);
    await generationHandler.markAsDeleted(uniformGenerationId, username, client as PrismaClient);
    await generationHandler.moveGenerationsUp(gen.sortOrder, gen.fk_uniformType, client as PrismaClient);

    return dbHandler.getTypeList(assosiation, client as PrismaClient);
}));
