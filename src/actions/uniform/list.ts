"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { genericSAValidatior } from "../validations";
import { FilterType } from "@/app/[locale]/app/uniform/list/[typeId]/_filterPanel";
import { uuidValidationPattern } from "@/lib/validations";
import { prisma } from "@/lib/db";
import { uniformWithOwnerArgs } from "@/types/globalUniformTypes";

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

export const getUniformListWithOwner = async (uniformType: string, orderBy: string, asc: boolean, filter: FilterType | null) => genericSAValidatior(
    AuthRole.user,
    (uuidValidationPattern.test(uniformType)
        && (!filter || filterTypeValidator(filter))),
    [{ value: uniformType, type: "uType" }]
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
    return prisma.uniform.findMany({
        ...uniformWithOwnerArgs,
        where: {
            ...sqlFilter,
            recdelete: null,
            fk_uniformType: uniformType,
            AND: [{
                OR: [
                    { generation: { id: { notIn: hiddenGenerations } } },
                    hiddenGenerations.includes("null") ? {} : { generation: null },
                ]
            }, {
                OR: [
                    { size: { id: { notIn: hiddenSizes } } },
                    hiddenSizes.includes("null") ? {} : { size: null }
                ]
            }]
        },
        orderBy: (getSortOrder(orderBy, asc ? "asc" : "desc") as any)
    }).then((data) => {
        if (orderBy !== "owner") {
            return data;
        }

        return data.sort((a, b) => {
            const returnValue = (value: number) => asc ? value : -value;
            if ((a.issuedEntrys.length === 0) && (b.issuedEntrys.length === 0)) {
                return returnValue(a.number - b.number);
            } else if (a.issuedEntrys.length === 0) {
                return returnValue(1);
            } else if (b.issuedEntrys.length === 0) {
                return returnValue(-1);
            } else {
                const nameA = a.issuedEntrys[0].cadet.lastname + a.issuedEntrys[0].cadet.firstname;
                const nameB = b.issuedEntrys[0].cadet.lastname + b.issuedEntrys[0].cadet.firstname;
                if (nameA === nameB) {
                    return returnValue(a.number - b.number);
                } else {
                    return returnValue(nameA.localeCompare(nameB));
                }
            }
        });
    });
});

const getSortOrder = (orderBy: string, asc: "asc" | "desc") => {
    switch (orderBy) {
        case "number":
            return {
                number: asc,
            };
        case "generation":
            return [
                { generation: { sortOrder: asc } },
                { size: { sortOrder: asc } },
                { number: asc },
            ]
        case "size":
            return [
                { size: { sortOrder: asc } },
                { generation: { sortOrder: asc } },
                { number: asc },
            ]
        case "comment":
            return [
                { comment: asc },
                { number: asc },
            ]
        case "owner":
            return [
                { number: asc }
            ];
    }
}
