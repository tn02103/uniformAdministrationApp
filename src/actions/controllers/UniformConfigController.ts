"use server";

import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { descriptionValidationPattern, uniformGenerationValidator, uniformTypeValidator, uuidValidationPattern } from "@/lib/validations";
import { UniformGeneration, UniformType } from "@/types/globalUniformTypes";
import { PrismaClient } from "@prisma/client";
import { UniformDBHandler } from "../dbHandlers/UniformDBHandler";
import UniformGenerationDBHandler from "../dbHandlers/UniformGenerationDBHandler";
import { UniformTypeDBHandler } from "../dbHandlers/UniformTypeDBHandler";
import { genericSAValidatiorV2 } from "../validations";

const dbHandler = new UniformTypeDBHandler();
const uniformHandler = new UniformDBHandler();
const generationHandler = new UniformGenerationDBHandler();

export const getUniformTypeList = (): Promise<UniformType[]> => genericSAValidatiorV2(AuthRole.user, true, {}).then(({ assosiation }) => dbHandler.getTypeList(assosiation));

export const createUniformType = () => genericSAValidatiorV2(
    AuthRole.materialManager, true, {}
).then(async ({ assosiation }) => prisma.$transaction(async (client) => {
    const typeList = await dbHandler.getTypeList(assosiation, client as PrismaClient);

    function getAcronym(): string {
        let acronym: string;
        for (let i = 0; i < 26; i++) {
            for (let j = 0; j < 26; j++) {
                acronym = String.fromCharCode(i + 65) + String.fromCharCode(j + 65)
                if (!typeList.find(t => t.acronym === acronym)) {
                    return acronym;
                }
            }
        }
        throw Error("Could not find free Acronym");
    }
    function getName() {
        let i = 1;
        let name: string;
        do {
            name = `Typ${i}`;
            i++;
        } while (typeList.find(t => t.name == name));
        return name;
    }

    return dbHandler.insertType(getName(), getAcronym(), typeList.length, assosiation, client as PrismaClient);
}))

export const changeUniformTypeSortOrder = (uniformTypeId: string, up: boolean) => genericSAValidatiorV2(
    AuthRole.materialManager,
    (uuidValidationPattern.test(uniformTypeId)
        && (typeof up === "boolean")),
    { uniformTypeId }
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const type = await dbHandler.getType(uniformTypeId, client as PrismaClient);

    // UPDATE sortorder of other type
    const newSortOrder = up ? (type.sortOrder - 1) : (type.sortOrder + 1);
    if (!await dbHandler.updateSortOrderByOldSortOrder(newSortOrder, !up, assosiation, client as PrismaClient)) {
        throw new SaveDataException("Could not update sortOrder of seccond type");
    };

    // UPDATE sortorder of type
    await dbHandler.updateSortOrderById(uniformTypeId, up, client as PrismaClient);
    return dbHandler.getTypeList(assosiation, client as PrismaClient);
}));

export const updateUniformType = (data: UniformType): Promise<UniformType[]> => genericSAValidatiorV2(
    AuthRole.materialManager,
    uniformTypeValidator.test(data),
    { uniformTypeId: data.id, uniformSizelistId: data.fk_defaultSizelist }
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const list = await dbHandler.getTypeList(assosiation, client as PrismaClient);

    if (list.find(t => t.id !== data.id && t.name === data.name)) {
        throw new SaveDataException("Name allready used by different sizelist");
    }

    if (list.find(t => t.id !== data.id && t.acronym === data.acronym)) {
        throw new SaveDataException("Acronym allready used by different sizelist");
    }

    await dbHandler.updateData(data.id, {
        name: data.name,
        acronym: data.acronym,
        issuedDefault: data.issuedDefault,
        usingGenerations: data.usingGenerations,
        usingSizes: data.usingSizes,
        fk_defaultSizelist: data.fk_defaultSizelist,
    }, client as PrismaClient);
    return dbHandler.getTypeList(assosiation, client as PrismaClient);
}));

export const deleteUniformType = (uniformTypeId: string) => genericSAValidatiorV2(
    AuthRole.materialManager,
    (uuidValidationPattern.test(uniformTypeId)),
    { uniformTypeId }
).then(({ assosiation, username }): Promise<UniformType[]> => prisma.$transaction(async (client) => {
    await Promise.all([
        uniformHandler.returnManyByType(uniformTypeId, client as PrismaClient),
        uniformHandler.deleteManyByType(uniformTypeId, username, client as PrismaClient),
        generationHandler.deleteManyByType(uniformTypeId, username, client as PrismaClient),
    ]);

    const type = await dbHandler.delete(uniformTypeId, username, client as PrismaClient);
    dbHandler.moveUpBelowHole(type.sortOrder, assosiation, client as PrismaClient);

    return dbHandler.getTypeList(assosiation, client as PrismaClient);
}));

export const createUniformGeneration = (name: string, outdated: boolean, fk_sizelist: string | null, uniformTypeId: string,): Promise<UniformType[]> => genericSAValidatiorV2(
    AuthRole.materialManager,
    (descriptionValidationPattern.test(name)
        && (typeof outdated === "boolean")
        && (!fk_sizelist || uuidValidationPattern.test(fk_sizelist))
        && uuidValidationPattern.test(uniformTypeId)),
    { uniformTypeId }
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const list = await generationHandler.getGenerationListByType(uniformTypeId, client as PrismaClient);
    if (list.find(g => g.name === name)) {
        throw new SaveDataException('Could not create Generation. Duplicated name');
    }
    await generationHandler.createGeneration(
        { name, outdated, fk_sizelist, sortOrder: list.length },
        uniformTypeId,
        client as PrismaClient);

    return dbHandler.getTypeList(assosiation, client as PrismaClient);
}));

export const saveUniformGeneration = (generation: UniformGeneration, uniformTypeId: string,): Promise<UniformType[]> => genericSAValidatiorV2(
    AuthRole.materialManager,
    (uniformGenerationValidator.test(generation) && uuidValidationPattern.test(uniformTypeId)),
    { uniformGenerationId: generation.id, uniformTypeId }
).then(({ assosiation }) => prisma.$transaction(async (client) => {
    const list = await generationHandler.getGenerationListByType(uniformTypeId, client as PrismaClient);
    if (list.find(g => g.id !== generation.id && g.name === generation.name)) {
        throw new SaveDataException('Could not save Generation. Duplicated name');
    }

    await generationHandler.updateGeneration(generation, client as PrismaClient);

    return dbHandler.getTypeList(assosiation, client as PrismaClient);
}));

export const changeUniformGenerationSortOrder = (uniformGenerationId: string, up: boolean): Promise<UniformType[]> => genericSAValidatiorV2(
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

export const deleteUniformGeneration = (uniformGenerationId: string) => genericSAValidatiorV2(
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
