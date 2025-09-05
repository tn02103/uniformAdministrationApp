"use server";

import { genericSANoDataValidator, genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { RedirectFormSchema, RedirectFormType } from "@/zod/redirect";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const getRedirectsByOrganisation = async () => genericSANoDataValidator(
    AuthRole.admin,
).then(async ([{ organisationId }]) => {
    return prisma.redirect.findMany({
        where: {
            organisationId,
        },
        orderBy: {
            code: "asc",
        }
    });
});

export const createRedirect = async (props: RedirectFormType) => genericSAValidator(
    AuthRole.admin,
    props,
    RedirectFormSchema,
    {},
).then(async ([{ organisationId }, data]) => {
    const duplicateRedirect = await prisma.redirect.findFirst({
        where: {
            code: data.code,
        }
    });

    if (duplicateRedirect) {
        return {
            error: {
                message: "common.error.custom.redirect.code.duplicate",
                formElement: "code",
            }
        }
    }

    await prisma.redirect.create({
        data: {
            ...props,
            organisationId,
        },
    });

    revalidatePath(`/[locale]/${organisationId}/app/redirects`, 'page');
});

const UpdateRedirectPropSchema = z.object({
    id: z.string().uuid(),
    data: RedirectFormSchema,
});
type UpdateRedirectProps = z.infer<typeof UpdateRedirectPropSchema>;
export const updateRedirect = async (props: UpdateRedirectProps) => genericSAValidator(
    AuthRole.admin,
    props,
    UpdateRedirectPropSchema
).then(async ([{ organisationId }, { id, data }]) => {
    const redirect = await prisma.redirect.findUnique({
        where: {
            id,
        },
    });
    if (!redirect) {
        throw new Error("Redirect not found");
    }
    if (redirect.organisationId !== organisationId) {
        throw new Error("Redirect not found in this association");
    }

    const duplicateRedirect = await prisma.redirect.findFirst({
        where: {
            code: data.code,
            id: {
                not: id,
            },
        },
    });
    if (duplicateRedirect) {
        return {
            error: {
                message: "common.error.custom.redirect.code.duplicate",
                formElement: "code",
            }
        }
    }

    await prisma.redirect.update({
        where: {
            id,
        },
        data,
    });

    revalidatePath(`/[locale]/${organisationId}/app/redirects`, 'page');
});

export const deleteRedirect = async (props: string) => genericSAValidator(
    AuthRole.admin,
    props,
    z.string().uuid(),
    {}
).then(async ([{ organisationId }, id]) => {
    const redirect = await prisma.redirect.findUnique({
        where: {
            id,
        },
    });
    if (!redirect) {
        throw new Error("Redirect not found");
    }
    if (redirect.organisationId !== organisationId) {
        throw new Error("Redirect not found in this association");
    }

    await prisma.redirect.delete({
        where: {
            id,
        },
    });

    revalidatePath(`/[locale]/${organisationId}/app/redirects`, 'page');
});
