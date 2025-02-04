"use server";

import { FilterType } from "@/app/[locale]/[acronym]/uniform/list/[typeId]/_filterPanel";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";
import { IssuedEntryType, UniformFormData, UniformNumbersSizeMap, UniformWithOwner, uniformArgs } from "@/types/globalUniformTypes";
import { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { UniformDBHandler } from "../dbHandlers/UniformDBHandler";
import { UniformTypeDBHandler } from "../dbHandlers/UniformTypeDBHandler";
import { genericSAValidatorV2 } from "../validations";

const dbHandler = new UniformDBHandler();
const typeHandler = new UniformTypeDBHandler();

/**
 * Function counts the number Uniformitems there are for the given uniformType. 
 * @requires AuthRole.materialManager
 * @param uniformTypeId 
 * @returns number 
 */
export const getUniformCountByType = (uniformTypeId: string) => genericSAValidatorV2(
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

/**
 * used to get the data for the uniformList-Overview 
 * returns all data of unifrom, the owner is returned in the object of issuedEntries as a cadetDescription. 
 * @requires AuthRole.user
 * @param uniformTypeId 
 * @param orderBy number| generation | size | comment | owner
 * @param asc 
 * @param filter filterObject of uniformFilter Pannel
 * @returns UniformWithOwner[]
 */
export const getUniformListWithOwner = async (uniformTypeId: string, orderBy: string, asc: boolean, filter: FilterType | null): Promise<UniformWithOwner[]> => genericSAValidatorV2(
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
            sqlFilter["issuedEntries"] = {
                none: {
                    dateReturned: null,
                }
            };
        } else if (!filter.withoutOwner) {
            sqlFilter["issuedEntries"] = {
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

/**
 * used to get data of a uniformItem in special UniformFormData type for the uniformItemDetail-Modal
 * @requires AuthRole.user
 * @param uniformId 
 * @returns UniformFormData
 */
export const getUniformFormValues = (uniformId: string): Promise<UniformFormData> => genericSAValidatorV2(
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

/**
 * used to load the issue-history of an uniformItem in the uniformItemDetail-Modal
 * @requires AuthRole.inspector
 * @param uniformId 
 * @returns an array containing date off issue and return, description of cadet with boolean if deleted.
 */
export const getUniformIssueHistory = (uniformId: string): Promise<IssuedEntryType[]> => genericSAValidatorV2(
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
 * Marks uniformitem as deleted. May only work if item is not issued.
 * @requires AuthRole.materialManager
 * @param uniformId 
 * @returns 
 */
export const deleteUniformItem = (uniformId: string): Promise<void> => genericSAValidatorV2(
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
    ]);
});
