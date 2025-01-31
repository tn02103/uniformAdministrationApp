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
