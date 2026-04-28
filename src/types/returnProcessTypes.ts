import { Prisma } from "@/prisma/client";


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