"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { genericSAValidatiorV2, genericSAValidator } from "../validations";
import { prisma } from "@/lib/db";
import { AdminDeficiencyType } from "@/types/deficiencyTypes";
import { z } from "zod";
import { AdminDeficiencytypeFormSchema } from "@/zod/deficiency";
import { DeficiencyTypeDBHandler } from "../dbHandlers/DeficiencyTypeDBHandler";
import { revalidatePath } from "next/cache";
import { uuidValidationPattern } from "@/lib/validations";

const dbHandler = new DeficiencyTypeDBHandler();

export const getDeficiencyAdmintypeList = (): Promise<AdminDeficiencyType[]> => genericSAValidatiorV2(
    AuthRole.materialManager, true, {}
).then(({ assosiation }) => dbHandler.getDeficiencyAdmintypeList(assosiation));

const SaveDeficiencyTypePropSchema = z.object({
    id: z.string().uuid(),
    data: AdminDeficiencytypeFormSchema,
})
type SaveDeficiencyTypePropSchema = z.infer<typeof SaveDeficiencyTypePropSchema>;

export const saveDeficiencyType = (props: SaveDeficiencyTypePropSchema) =>
    genericSAValidator(
        AuthRole.materialManager,
        props,
        SaveDeficiencyTypePropSchema,
        { deficiencytypeId: props.id }
    ).then(async ([{ id, data }, { assosiation }]) => {
        await prisma.$transaction(async (client) => {
            const list = await dbHandler.getDeficiencyAdmintypeList(assosiation);

            if (list.find(t => t.id !== id && t.name === data.name)) {
                throw new Error("Could not update deficiencyType: Name duplication");
            }

            const dbType = list.find(t => t.id === id);
            if (!dbType) {
                throw new Error("Could not update deficiencyType: not Found");
            }

            
            if (dbType.active > 0 || dbType.resolved > 0) {
                if (data.dependent !== dbType.dependent || data.relation !== dbType.relation)
                    throw new Error("Could not update deficiencyType: change not allowed for used type");
            }

            await dbHandler.update(id, data, client);
        });
        revalidatePath(`/[locale]/${assosiation}/app/admin/deficiency`, 'page');
    });



export const createDeficiencyType = (props: AdminDeficiencytypeFormSchema) =>
    genericSAValidator(
        AuthRole.materialManager,
        props,
        AdminDeficiencytypeFormSchema,
        {}
    ).then(async ([data, { assosiation }]) => {
        const value = await prisma.$transaction(async (client) => {
            const list = await dbHandler.getDeficiencyAdmintypeList(assosiation, client);

            if (list.find(t => t.name === data.name)) {
                throw new Error("Could not create Deficiencytype");
            }

            return dbHandler.create(data, assosiation, client);
        });

        revalidatePath(`/[locale]/${assosiation}/app/admin/deficiency`, 'page');
        return value;
    });

export const deleteDeficiencyType = (typeId: string) => genericSAValidatiorV2(
    AuthRole.materialManager,
    uuidValidationPattern.test(typeId),
    { deficiencytypeId: typeId }
).then(async ({ username, assosiation }) => {
    await dbHandler.markDeleted(typeId, username, prisma);
    revalidatePath(`/[locale]/${assosiation}/app/admin/deficiency`, 'page');
});
