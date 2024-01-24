'use server'
import { prisma } from "@/lib/db";
import { Cadet, cadetArgs } from "@/types/globalCadetTypes";
import { cache } from "react";
import { genericSAValidatior } from "../validations";
import { AuthRole } from "@/lib/AuthRoles";
import { cadetValidation, nameValidationPattern, uuidValidationPattern } from "@/lib/validations";
import { UnauthorizedException } from "@/errors/CustomException";

export const getCadetData = cache(async (cadetId: string): Promise<Cadet> => genericSAValidatior(
    AuthRole.user,
    (uuidValidationPattern.test(cadetId)),
    [{ value: cadetId, type: "cadet" }]
).then(() => {
    return prisma.cadet.findUniqueOrThrow({
        where: {
            id: cadetId,
            recdelete: null,
        },
        ...cadetArgs
    });
}));

export const getCadetLastInspectionDate = async (cadetId: string) => genericSAValidatior(
    AuthRole.inspector,
    uuidValidationPattern.test(cadetId),
    [{ value: cadetId, type: "cadet" }]
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

export const saveCadetData = async (cadet: Cadet) => genericSAValidatior(
    AuthRole.inspector,
    cadetValidation.test(cadet),
    [{ value: cadet.id, type: "cadet" }]
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

export const createCadet = async (cadet: Cadet) => genericSAValidatior(
    AuthRole.inspector,
    cadetValidation.testWithoutId(cadet),
    []
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
