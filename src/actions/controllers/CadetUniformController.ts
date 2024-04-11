"use server";

import { genericSAValidatior, genericSAValidatiorV2 } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { uniformNumberValidation, uuidValidationPattern } from "@/lib/validations";
import { CadetUniformMap } from "@/types/globalCadetTypes";

import { prisma } from "@/lib/db";
import { PrismaClient } from "@prisma/client";
import SaveDataException, { UniformInactiveException, UniformIssuedException } from "@/errors/SaveDataException";
import CustomException, { ExceptionType } from "@/errors/CustomException";
import { NullValueException } from "@/errors/LoadDataException";
import { isToday } from "date-fns";
import { CadetUniformDBHandler } from "../dbHandlers/CadetUniformDBHandler";
import { CadetDBHandler } from "../dbHandlers/CadetDBHandler";

const dbHandler = new CadetUniformDBHandler();
const cadetDBHandler = new CadetDBHandler();

export const getCadetUniformMap = async (cadetId: string): Promise<CadetUniformMap> => genericSAValidatiorV2(
    AuthRole.user,
    uuidValidationPattern.test(cadetId),
    { cadetId }
).then(() => dbHandler.getMap(cadetId));

export const returnUniformItem = async (uniformId: string, cadetId: string): Promise<CadetUniformMap> => genericSAValidatiorV2(
    AuthRole.inspector,
    (uuidValidationPattern.test(uniformId)
        && uuidValidationPattern.test(cadetId)),
    { cadetId, uniformId }
).then(() => prisma.$transaction(async (client) => {
    const issuedEntry = await dbHandler.getIssuedEntry(uniformId, cadetId, client as PrismaClient);
    if (!issuedEntry) throw new SaveDataException('Could not return Uniform. Issued Entry not found: ' + uniformId);

    await dbHandler.return(issuedEntry.id, issuedEntry.dateIssued, client as PrismaClient);
    return dbHandler.getMap(cadetId, client as PrismaClient);
}));


export type IssueUniformItemDataType = {
    number: number,
    uniformTypeId: string,
    idToReplace?: string,
    cadetId: string,
    options: {
        ignoreInactive: boolean,
        force: boolean,
        create: boolean
    }
}
export type SAErrorResponseType = {
    error: {
        exceptionType: ExceptionType,
        data?: any;
    }
}
export const issueUniformItem = async ({
    number, uniformTypeId, idToReplace, cadetId, options: { ignoreInactive, force, create }
}: IssueUniformItemDataType): Promise<CadetUniformMap | SAErrorResponseType> => genericSAValidatiorV2(
    AuthRole.inspector,
    (uuidValidationPattern.test(uniformTypeId)
        && uuidValidationPattern.test(cadetId)
        && (!idToReplace || uuidValidationPattern.test(idToReplace))
        && uniformNumberValidation.test(number)
        && (typeof ignoreInactive === "boolean")
        && (typeof force === "boolean")
        && (typeof create === "boolean")),
    { cadetId, uniformTypeId, uniformId: idToReplace }
).then(async () => prisma.$transaction(async (client) => {
    // GET UniformData
    const uniform = await dbHandler.getUniformWithIssuedEntriesByTypeAndNumber(uniformTypeId, number, client as PrismaClient);

    // RETURN previous uniform
    if (idToReplace) {
        const issuedEntry = await dbHandler.getIssuedEntry(idToReplace, cadetId, client as PrismaClient);
        if (!issuedEntry) throw new SaveDataException('Could not return UniformToReplace. Issued Entry not found: ' + idToReplace);

        await dbHandler.return(issuedEntry.id, issuedEntry.dateIssued, client as PrismaClient);
    }

    // CREATE or throw erorr if not existing
    if (!uniform) {
        if (!create) {
            throw new NullValueException('Could not find Uniformitem', "uniform", { number, type: uniformTypeId });
        }

        return dbHandler.createIssuedUniformItem({ number, fk_uniformType: uniformTypeId }, cadetId, client as PrismaClient);
    }

    // CHECK uniform active
    if ((!ignoreInactive) && !uniform.active) {
        throw new UniformInactiveException();
    }

    // CHECK uniform is not issued
    if (uniform.issuedEntrys.length > 0) {
        if (!force) {
            throw new UniformIssuedException(uniform.id, number, uniform.issuedEntrys[0].cadet);
        }

        // get name of of newCadet
        const cadet = await cadetDBHandler.getCadet(cadetId, client as PrismaClient);

        // add comment to other cadet
        const comment = `<<Das Uniformteil ${uniform.type.name} ${uniform.number} wurde dem Kadetten ${cadet.firstname} ${cadet.lastname} Überschrieben>>`;
        const addcommentFeedback = await cadetDBHandler.concatCadetComment(uniform.issuedEntrys[0].fk_cadet, comment, client as PrismaClient);
        if (addcommentFeedback !== 1) {
            throw new Error("Could not add comment to previous owner");
        }

        // return uniformItem from other cadet
        await dbHandler.return(uniform.issuedEntrys[0].id, uniform.issuedEntrys[0].dateIssued, client as PrismaClient);
    }

    // ISSUE uniform item
    await dbHandler.issue(uniform.id, cadetId);
})
).then(() =>
    dbHandler.getMap(cadetId)
).catch((error: any) => {
    if (error instanceof CustomException) {
        return {
            error: {
                exceptionType: error.exceptionType,
                data: error.data
            }
        }
    } else {
        console.error(error);
        throw error;
    }
});


