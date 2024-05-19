'use server'
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { cadetValidation, uuidValidationPattern } from "@/lib/validations";
import { Cadet, cadetArgs } from "@/types/globalCadetTypes";
import { cache } from "react";
import { genericSAValidatiorV2 } from "../validations";

export const getCadetData = cache(async (cadetId: string): Promise<Cadet> => genericSAValidatiorV2(
    AuthRole.user,
    (uuidValidationPattern.test(cadetId)),
    { cadetId }
).then(() => {
    return prisma.cadet.findUniqueOrThrow({
        where: {
            id: cadetId,
            recdelete: null,
        },
        ...cadetArgs
    });
}));

export const getCadetLastInspectionDate = async (cadetId: string) => genericSAValidatiorV2(
    AuthRole.inspector,
    uuidValidationPattern.test(cadetId),
    { cadetId }
).then(() => {
    return prisma.inspection.aggregate({
        _max: { date: true },
        where: {
            cadetInspection: {
                some: {
                    fk_cadet: cadetId,
                }
            }
        }
    }).then((data) => data._max.date);
});

export const saveCadetData = async (cadet: Cadet) => genericSAValidatiorV2(
    AuthRole.inspector,
    cadetValidation.test(cadet),
    { cadetId: cadet.id }
).then(() => {
    return prisma.cadet.update({
        ...cadetArgs,
        where: {
            id: cadet.id,
        },
        data: {
            firstname: cadet.firstname,
            lastname: cadet.lastname,
            active: cadet.active,
            comment: cadet.comment,
        }
    });
});

export const createCadet = async (cadet: Cadet) => genericSAValidatiorV2(
    AuthRole.inspector,
    cadetValidation.testWithoutId(cadet),
    {}
).then(({ assosiation }) => prisma.cadet.create({
    ...cadetArgs,
    data: {
        firstname: cadet.firstname,
        lastname: cadet.lastname,
        active: cadet.active,
        comment: cadet.comment,
        fk_assosiation: assosiation,
    }
}));
