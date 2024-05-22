"use server";

import { FilterType } from "@/app/[locale]/[acronym]/uniform/list/[typeId]/_filterPanel";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";
import { IssuedEntryType, UniformFormData, UniformNumbersSizeMap, uniformArgs } from "@/types/globalUniformTypes";
import { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { UniformDBHandler } from "../dbHandlers/UniformDBHandler";
import { UniformTypeDBHandler } from "../dbHandlers/UniformTypeDBHandler";
import { genericSAValidatiorV2 } from "../validations";

const dbHandler = new UniformDBHandler();
const typeHandler = new UniformTypeDBHandler();

export const getUniformCountByType = (uniformTypeId: string) => genericSAValidatiorV2(
    AuthRole.materialManager,
    (uuidValidationPattern.test(uniformTypeId)),
    { uniformTypeId }
).then(() => dbHandler.getUniformCountByType(uniformTypeId));

const filterTypeValidator = (filter: FilterType) => (
    (typeof filter.active === "boolean")
    && (typeof filter.passive === "boolean")
    && (typeof filter.withOwner === "boolean")
    && (typeof filter.withoutOwner === "boolean")
    && !(!filter.active && !filter.passive)
    && !(!filter.withOwner && !filter.withoutOwner)
    && Object.entries(filter.generations).every(([key, value]) => (
        (key === "null" || uuidValidationPattern.test(key)) && (typeof value === "boolean")
    ))
    && Object.entries(filter.sizes).every(([key, value]) => (
        (key === "null" || uuidValidationPattern.test(key)) && (typeof value === "boolean")
    ))
);

export const getUniformListWithOwner = async (uniformTypeId: string, orderBy: string, asc: boolean, filter: FilterType | null) => genericSAValidatiorV2(
    AuthRole.user,
    (uuidValidationPattern.test(uniformTypeId)
        && (!filter || filterTypeValidator(filter))),
    { uniformTypeId }
).then(() => {
    const sqlFilter: any = {};
    const hiddenGenerations = filter ? Object.entries(filter.generations).filter(([, value]) => !value).map(([key,]) => key) : [];
    const hiddenSizes = filter ? Object.entries(filter.sizes).filter(([, value]) => !value).map(([key,]) => key) : [];

    if (!filter) {
        sqlFilter["active"] = true;
    } else {
        if (!filter.passive) {
            sqlFilter["active"] = true;
        } else if (!filter.active) {
            sqlFilter["active"] = false;
        }

        if (!filter.withOwner) {
            sqlFilter["issuedEntrys"] = {
                none: {
                    dateReturned: null,
                }
            };
        } else if (!filter.withoutOwner) {
            sqlFilter["issuedEntrys"] = {
                some: {
                    dateReturned: null,
                }
            };
        }
    }

    let sortOrder: Prisma.UniformOrderByWithRelationInput[];
    const ascString = asc ? "asc" : "desc";
    switch (orderBy) {
        case "generation":
            sortOrder = [
                { generation: { sortOrder: ascString } },
                { size: { sortOrder: ascString } },
                { number: ascString },
            ];
            break;
        case "size":
            sortOrder = [
                { size: { sortOrder: ascString } },
                { generation: { sortOrder: ascString } },
                { number: ascString },
            ];
            break;
        case "comment":
            sortOrder = [
                { comment: ascString },
                { number: ascString },
            ];
            break;
        case "owner":
            sortOrder = [
                { number: ascString }
            ];
            break;
        default:
            sortOrder = [{
                number: ascString,
            }];
            break;
    }
    return dbHandler.getListWithOwner(uniformTypeId, hiddenGenerations, hiddenSizes, sqlFilter, sortOrder, orderBy === "owner", asc);
});

export const getUniformFormValues = (uniformId: string): Promise<UniformFormData> => genericSAValidatiorV2(
    AuthRole.user,
    (uuidValidationPattern.test(uniformId)),
    { uniformId }
).then(() => dbHandler.getUniformById(uniformId)).then(data => !data ? notFound() : ({
    id: data.id,
    number: data.number,
    generation: data.generation?.id,
    size: data.size?.id,
    comment: data.comment ?? "",
    active: data.active,
}));

export const getUniformIssueHistory = (uniformId: string): Promise<IssuedEntryType[]> => genericSAValidatiorV2(
    AuthRole.inspector,
    uuidValidationPattern.test(uniformId),
    { uniformId }
).then(() => prisma.uniformIssued.findMany({
    where: {
        fk_uniform: uniformId,
    },
    include: {
        cadet: true,
    },
    orderBy: { dateIssued: "desc" }
})).then((data) => data.map((issueEntry): IssuedEntryType => ({
    dateIssued: issueEntry.dateIssued,
    dateReturned: issueEntry.dateReturned,
    cadetDeleted: !!issueEntry.cadet.recdelete,
    firstname: issueEntry.cadet.firstname,
    lastname: issueEntry.cadet.lastname,
    cadetId: issueEntry.cadet.id,
})));

/**
 * 
 * @param data 
 * @returns 
 */
export const saveUniformItem = (data: UniformFormData): Promise<UniformFormData> => genericSAValidatiorV2(
    AuthRole.inspector,
    (uuidValidationPattern.test(data.id)
        && (!data.generation || uuidValidationPattern.test(data.generation))
        && (!data.size || uuidValidationPattern.test(data.size))
        && typeof data.active === "boolean"),
    { uniformId: data.id }
).then(async () => prisma.uniform.update({
    ...uniformArgs,
    where: {
        id: data.id,
    },
    data: {
        active: data.active,
        comment: data.comment,
        fk_generation: data.generation ?? null,
        fk_size: data.size ?? null
    },
})).then(data => !data ? notFound() : ({
    id: data.id,
    number: data.number,
    generation: data.generation?.id,
    size: data.size?.id,
    comment: data.comment ?? "",
    active: data.active,
}));

/**
 * Creates multiple UniformItems of a single type
 * @param numbers Numbers of the UniformItem for each size. 
 *  If the Uniformtype does not use sizes, the Array has only one element with sizeId="amount"
 * @param data Data of the uniformItems that are to be created. The size of the Uniform is included in the param numbers
 * @returns number of created Items
 */
export const createUniformItems = (numberMap: UniformNumbersSizeMap, data: { uniformTypeId: string, generationId?: string, comment: string, active: boolean }): Promise<number> => genericSAValidatiorV2(
    AuthRole.inspector,
    (uuidValidationPattern.test(data.uniformTypeId)
        && (!data.generationId || uuidValidationPattern.test(data.generationId))
        && (typeof data.active === "boolean")
        && numberMap.every(n =>
            (n.sizeId === "amount" || uuidValidationPattern.test(n.sizeId))
            && n.numbers.every(num => Number.isInteger(num))
        )),
    {
        uniformTypeId: data.uniformTypeId,
        uniformGenerationId: data.generationId,
        uniformSizeId: numberMap.filter(n => n.sizeId === "amount").map(n => n.sizeId)
    }
).then(() => prisma.$transaction(async (client) => {
    const allNumbers = numberMap.reduce((arr: number[], value) => ([...arr, ...value.numbers]), []);
    const existingUniforms = await client.uniform.findMany({
        where: {
            fk_uniformType: data.uniformTypeId,
            number: { in: allNumbers },
            recdelete: null,
        }
    });
    if (existingUniforms.length > 0) {
        throw new SaveDataException("Number already in use")
    }

    const type = await typeHandler.getCompleteTypeWithSizeListAndSizes(data.uniformTypeId, client);

    // VALIDATE generation
    let sizeList = type.defaultSizeList;
    if (!type.usingGenerations) {
        data.generationId = undefined;
    } else {
        const gen = type.uniformGenerationList.find(g => g.id === data.generationId);
        if (gen) {
            sizeList = gen.uniformSizeList;
        } else {
            data.generationId = undefined;
        }
    }

    // VALIDATE size
    let allowedSizes = [];
    if (!type.usingSizes) {
        allowedSizes = ["amount"];
    } else {
        if (!sizeList) {
            throw new SaveDataException('Could not create Uniformitems. Failed to find sizelist for selected type and generation');
        }
        allowedSizes = sizeList.uniformSizes.map(s => s.id);
    }
    if (!numberMap.every(map => allowedSizes.includes(map.sizeId))) {
        throw new SaveDataException("Not allowed size used");
    }

    return dbHandler.createUniformItems(numberMap, data, client).then(d => d.count);
}));

/**
 * Marks uniformitem as deleted. May only work if item is not issued.
 * @param uniformId 
 * @returns 
 */
export const deleteUniformItem = (uniformId: string) => genericSAValidatiorV2(
    AuthRole.materialManager,
    (uuidValidationPattern.test(uniformId)),
    { uniformId }
).then(async ({ username }) => {
    const issued = await prisma.uniformIssued.aggregate({
        where: {
            fk_uniform: uniformId,
            dateReturned: null
        },
        _count: true
    }).then((data) => data._count > 0);

    if (issued) {
        throw new Error("Uniformteil ausgegeben");
    }

    prisma.$transaction([
        prisma.uniform.update({
            where: { id: uniformId },
            data: {
                recdelete: new Date(),
                recdeleteUser: username,
            }
        }),
    ])
});
