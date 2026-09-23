import { Prisma, AnonymizationMode } from "@/prisma/client";

export const returnChecklistItemTemplateArgs = {
    select: {
        id: true,
        label: true,
        sortOrder: true,
    },
    orderBy: { sortOrder: 'asc' },
} satisfies Prisma.ResignationChecklistItemTemplateFindManyArgs;

export const resignationProcessTemplateWithItemsArgs = {
    select: {
        id: true,
        name: true,
        defaultProcess: true,
        createdAt: true,
        updatedAt: true,
        checklistItemTemplates: returnChecklistItemTemplateArgs,
    },
    orderBy: { name: 'asc' },
} satisfies Prisma.ResignationProcessTemplateFindManyArgs;

export const resignationProcessArgs = {
    select: {
        id: true,
        firstname: true,
        lastname: true,
        status: true,
        resignedAt: true,
        deletedAt: true,
        uniformIssued: {
            where: {
                dateReturned: null,
                uniform: {
                    recdelete: null,
                }
            },
            select: {
                uniform: {
                    select: {
                        id: true,
                        number: true,
                        type: true,
                    },
                },
            },
        },
        materialIssued: {
            where: { dateReturned: null, material: { recdelete: null } },
            select: {
                material: {
                    select: {
                        id: true,
                        typename: true,
                        materialGroup: true,
                    }
                }
            }
        },
        resignationProcess: {
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                finished: true,
                inspectorComment: true,
                template: {
                    select: { id: true, name: true },
                },
                checklistItems: {
                    include: {
                        checklistItem: {
                            select: { id: true, label: true, sortOrder: true },
                        },
                    },
                    orderBy: { checklistItem: { sortOrder: 'asc' } },
                },
            },
        },
    },
    orderBy: { resignationProcess: { updatedAt: 'desc' } }
} satisfies Prisma.CadetFindManyArgs;

export type ResignationProcessTemplateWithItems = Prisma.ResignationProcessTemplateGetPayload<typeof resignationProcessTemplateWithItemsArgs>;
export type ResignationChecklistItemTemplate = Prisma.ResignationChecklistItemTemplateGetPayload<typeof returnChecklistItemTemplateArgs>;
export type ResignationProcess = Prisma.CadetGetPayload<typeof resignationProcessArgs>;

/** Shape returned by getResignationProcessConfig and passed to the CadetDropDown component. */
export type ResignationProcessConfig = {
    resignationProcessEnabled: boolean;
    anonymizationMode: AnonymizationMode;
    templates: ResignationProcessTemplateWithItems[];
};

/** Nullable config passed to components; null when config was not loaded or load failed. */
export type ResignationConfig = ResignationProcessConfig | null;