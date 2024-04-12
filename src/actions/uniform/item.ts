"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { genericSAValidatior } from "../validations";
import { uuidValidationPattern } from "@/lib/validations";
import { prisma } from "@/lib/db";
import { IssuedEntryType, UniformFormData, uniformArgs } from "@/types/globalUniformTypes";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { connect } from "http2";

export const getUniformFormValues = (uniformId: string): Promise<UniformFormData> => genericSAValidatior(
    AuthRole.user,
    (uuidValidationPattern.test(uniformId)),
    [{ value: uniformId, type: "uniform" }]
).then(() => prisma.uniform.findUnique({
    where: { id: uniformId },
    ...uniformArgs,
})).then(data => !data ? notFound() : ({
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

