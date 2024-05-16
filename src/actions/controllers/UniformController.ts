"use server";

import { FilterType } from "@/app/[locale]/[acronym]/uniform/list/[typeId]/_filterPanel";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";
import { IssuedEntryType, UniformFormData, uniformArgs } from "@/types/globalUniformTypes";
import { notFound } from "next/navigation";
import { UniformDBHandler } from "../dbHandlers/UniformDBHandler";
import { genericSAValidatior, genericSAValidatiorV2 } from "../validations";

const dbHandler = new UniformDBHandler();

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

    let sortOrder;
    switch (orderBy) {
        case "generation":
            sortOrder = [
                { generation: { sortOrder: asc } },
                { size: { sortOrder: asc } },
                { number: asc },
            ]
        case "size":
            sortOrder = [
                { size: { sortOrder: asc } },
                { generation: { sortOrder: asc } },
                { number: asc },
            ]
        case "comment":
            sortOrder = [
                { comment: asc },
                { number: asc },
            ]
        case "owner":
            sortOrder = [
                { number: asc }
            ];
        default:
            sortOrder = {
                number: asc,
            };
    }
    return dbHandler.getListWithOwner(uniformTypeId, hiddenGenerations, hiddenSizes, sqlFilter, sortOrder, orderBy === "owner", asc);
});

export const getUniformFormValues = (uniformId: string): Promise<UniformFormData> => genericSAValidatior(
    AuthRole.user,
    (uuidValidationPattern.test(uniformId)),
    [{ value: uniformId, type: "uniform" }]
).then(() => dbHandler.getUniformById(uniformId)).then(data => !data ? notFound() : ({
    id: data.id,
    number: data.number,
    generation: data.generation?.id,
    size: data.size?.id,
    comment: data.comment ?? "",
    active: data.active,
}));

export const getUniformIssueHistory = (uniformId: string): Promise<IssuedEntryType[]> => genericSAValidatior(
    AuthRole.inspector,
    uuidValidationPattern.test(uniformId),
    [{ value: uniformId, type: "uniform" }]
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

export const saveUniformItem = (data: UniformFormData): Promise<UniformFormData> => genericSAValidatior(
    AuthRole.inspector,
    (uuidValidationPattern.test(data.id)
        && (!data.generation || uuidValidationPattern.test(data.generation))
        && (!data.size || uuidValidationPattern.test(data.size))
        && typeof data.active === "boolean"),
    [{ value: data.id, type: "uniform" }]
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

export const deleteUniformItem = (uniformId: string) => genericSAValidatior(
    AuthRole.materialManager,
    (uuidValidationPattern.test(uniformId)),
    [{ value: uniformId, type: "uniform" }]
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
