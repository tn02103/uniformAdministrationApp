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

export type ReturnProcessTemplateWithItems = Prisma.ReturnProcessTemplateGetPayload<typeof returnProcessTemplateWithItemsArgs>;
export type ReturnChecklistItemTemplate = Prisma.ReturnChecklistTemplateGetPayload<typeof returnChecklistItemTemplateArgs>;

/** Shape returned by getReturnProcessConfig and passed to the CadetDropDown component. */
export type ReturnProcessConfig = {
    returnProcessEnabled: boolean;
    anonymizationMode: AnonymizationMode;
    templates: ReturnProcessTemplateWithItems[];
};

/** Nullable config passed to components; null when config was not loaded or load failed. */
export type ReturnConfig = ReturnProcessConfig | null;