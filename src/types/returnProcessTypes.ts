import { Prisma, AnonymizationMode } from "@/prisma/client";


export const returnChecklistItemTemplateArgs = {
    select: {
        id: true,
        label: true,
        sortOrder: true,
    },
    orderBy: { sortOrder: 'asc' },
} satisfies Prisma.ReturnChecklistTemplateFindManyArgs;

export const returnProcessTemplateWithItemsArgs = {
    select: {
        id: true,
        name: true,
        defaultProcess: true,
        createdAt: true,
        updatedAt: true,
        checklistItems: returnChecklistItemTemplateArgs,
    },
    orderBy: { name: 'asc' },
} satisfies Prisma.ReturnProcessTemplateFindManyArgs;

export const memberExitProcessArgs = {
    include: {
        cadet: {
            select: {
                id: true,
                firstname: true,
                lastname: true,
                status: true,
                returnStartedAt: true,
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
            },
        },
        template: {
            select: { id: true, name: true },
        },
        itemStatuses: {
            include: {
                checklistItem: {
                    select: { id: true, label: true, sortOrder: true },
                },
            },
            orderBy: { checklistItem: { sortOrder: 'asc' } },
        },
    },
    orderBy: { updatedAt: 'desc' },
} satisfies Prisma.ReturnProcessFindManyArgs;

export type ReturnProcessTemplateWithItems = Prisma.ReturnProcessTemplateGetPayload<typeof returnProcessTemplateWithItemsArgs>;
export type ReturnChecklistItemTemplate = Prisma.ReturnChecklistTemplateGetPayload<typeof returnChecklistItemTemplateArgs>;
export type memberExitProcess = Prisma.ReturnProcessGetPayload<typeof memberExitProcessArgs>;

/** Shape returned by getReturnProcessConfig and passed to the CadetDropDown component. */
export type ReturnProcessConfig = {
    returnProcessEnabled: boolean;
    anonymizationMode: AnonymizationMode;
    templates: ReturnProcessTemplateWithItems[];
};

/** Nullable config passed to components; null when config was not loaded or load failed. */
export type ReturnConfig = ReturnProcessConfig | null;