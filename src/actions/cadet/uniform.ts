"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uniformNumberValidation, uuidValidationPattern } from "@/lib/validations";
import { CadetUniformMap } from "@/types/globalCadetTypes";
import { uniformArgs } from "@/types/globalUniformTypes";
import { isToday } from "date-fns";
import { genericSAValidatior } from "../validations";
import CustomException, { ExceptionType } from "@/errors/CustomException";
import { NullValueException } from "@/errors/LoadDataException";
import { UniformInactiveException, UniformIssuedException } from "@/errors/SaveDataException";

export const getCadetUniformMap = async (cadetId: string, prismaCl?: any) => {
    const prismaClient = prismaCl ?? prisma;
    // validations
    await genericSAValidatior(
        AuthRole.user,
        uuidValidationPattern.test(cadetId),
        [{ value: cadetId, type: "cadet" }]
    );

    const uniformList = await prismaClient.uniform.findMany({
        ...uniformArgs,
        where: {
            issuedEntrys: {
                some: {
                    fk_cadet: cadetId,
                    dateReturned: null
                }
            },
            recdelete: null,
        },
        orderBy: {
            number: "asc",
        }
    });
    const uniformMap: CadetUniformMap = {};
    uniformList.forEach((u: any) => {
        if (!uniformMap[u.type.id]) {
            uniformMap[u.type.id] = [];
        }

        uniformMap[u.type.id].push(u);
    });
    return uniformMap;
}

export const returnUniformItem = async (uniformId: string, cadetId: string) => {
    await genericSAValidatior(
        AuthRole.inspector,
        (uuidValidationPattern.test(uniformId)
            && uuidValidationPattern.test(cadetId)),
        [{ value: uniformId, type: "uniform" },
        { value: cadetId, type: "cadet" }]
    );

    await returnUniformItemFunction(cadetId, uniformId);

    return getCadetUniformMap(cadetId);
}

async function returnUniformItemFunction(cadetId: string, uniformId: string, prismaClient?: any, issuedParams?: { fromToday: boolean, entryId: string }) {
    const prismaCl = prismaClient ?? prisma;
    if (issuedParams === undefined) {
        const issuedEntry = await prismaCl.uniformIssued.findFirstOrThrow({
            where: {
                fk_cadet: cadetId,
                fk_uniform: uniformId,
                dateReturned: null,
            }
        })
        issuedParams = {
            fromToday: isToday(issuedEntry.dateIssued),
            entryId: issuedEntry.id,
        }
    }

    if (issuedParams.fromToday) {
        return prismaCl.uniformIssued.delete({
            where: {
                id: issuedParams.entryId,
            }
        });
    } else {
        return prismaCl.uniformIssued.update({
            where: {
                id: issuedParams.entryId,
            },
            data: {
                dateReturned: new Date(),
            }
        });
    }
}

export type IssueUniformItemDataType = {
    number: number,
    typeId: string,
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
    number, typeId, idToReplace, cadetId, options: { ignoreInactive, force, create }
}: IssueUniformItemDataType): Promise<CadetUniformMap | SAErrorResponseType> => genericSAValidatior(
    AuthRole.inspector,
    (uuidValidationPattern.test(typeId)
        && uuidValidationPattern.test(cadetId)
        && (!idToReplace || uuidValidationPattern.test(idToReplace))
        && uniformNumberValidation.test(number)
        && (typeof ignoreInactive === "boolean")
        && (typeof force === "boolean")
        && (typeof create === "boolean")),
    [{ value: cadetId, type: "cadet" },
    { value: typeId, type: "uType" },
    { value: idToReplace, type: "uniform" }]
).then(async () => prisma.$transaction(
    async (prismaCl): Promise<CadetUniformMap> => {
        // GET UniformData
        let uniform = await prismaCl.uniform.findFirst({
            where: {
                fk_uniformType: typeId,
                number: number,
                recdelete: null,
            },
            include: {
                issuedEntrys: {
                    where: {
                        dateReturned: null
                    },
                    include: {
                        cadet: true,
                    }
                },
                type: true
            }
        });

        // CREATE or throw erorr if not existing
        if (!uniform) {
            if (!create) {
                throw new NullValueException('Could not find Uniformitem', "uniform", { number, type: typeId });
            }

            uniform = await prismaCl.uniform.create({
                data: {
                    number: number,
                    fk_uniformType: typeId,
                    active: true,
                },
                include: {
                    issuedEntrys: {
                        where: {
                            dateReturned: null
                        },
                        include: {
                            cadet: true,
                        }
                    },
                    type: true
                }
            });
        } else {
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
                const cadet = await prismaCl.cadet.findUniqueOrThrow({
                    where: {
                        id: cadetId
                    }
                });

                // add comment to other cadet
                const comment = `<<Das Uniformteil ${uniform.type.name} ${uniform.number} wurde dem Kadetten ${cadet.firstname} ${cadet.lastname} Überschrieben>>`;
                const addcommentFeedback = await prismaCl.$executeRaw`
                    UPDATE "Cadet"
                       SET comment = CONCAT(comment, ${comment}) 
                     WHERE id = ${uniform.issuedEntrys[0].cadet.id}`
                if (addcommentFeedback !== 1) {
                    throw new Error("Could not add comment to previous owner");
                }

                // return uniformItem from other cadet
                await returnUniformItemFunction(
                    uniform.issuedEntrys[0].cadet.id,
                    uniform.id,
                    prismaCl,
                    {
                        entryId: uniform.issuedEntrys[0].id,
                        fromToday: isToday(uniform.issuedEntrys[0].dateIssued)
                    }
                );
            }
        }
        if (idToReplace) {
            await returnUniformItemFunction(cadetId, idToReplace, prismaCl);
        }

        // ISSUE uniform item
        await prismaCl.uniformIssued.create({
            data: {
                fk_cadet: cadetId,
                fk_uniform: uniform ? uniform.id : ""
            }
        });

        return getCadetUniformMap(cadetId, prismaCl);
    })
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
