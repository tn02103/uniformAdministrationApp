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

/**
 * Used to get the DeficiencyTypeList used in admin/deficiency
 * @requires AuthRole.materialManager
 * @returns 
 */
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

/**
 * DAL-Methode: Used to deactivate a deficiencyType. No new Deficiencies can of a deactivated type, but already existing deficiencies stay active.
 * revalidates path ../admin/deficiency
 * @requires AuthRole.inspector
 * @param props id of the deficiencyType
 * @returns void
 */
export const deactivateDeficiencyType = (props: string) => genericSAValidator(
    AuthRole.inspector,
    props,
    z.string().uuid(),
    { deficiencytypeId: props }
).then(async ([id, user]) => {
    const type = await prisma.deficiencyType.findUniqueOrThrow({
        where: { id }
    });
    if (type.disabledDate) {
        throw new Error("Type already disabled");
    }
    await prisma.deficiencyType.update({
        where: { id },
        data: {
            disabledDate: new Date(),
            disabledUser: user.username,
        }
    });
    revalidatePath(`/[locale]/${user.assosiation}/app/admin/deficiency`, 'page');
});

/**
 * DAL-Method: used to reactivate a deficiencyType. After this action new deficiencies can be of this type.
 * revalidates path ../admin/deficiency
 * @requires AuthRole.inspector
 * @param props id of type
 * @returns void
 */
export const reactivateDeficiencyType = (props: string) => genericSAValidator(
    AuthRole.inspector,
    props,
    z.string().uuid(),
    { deficiencytypeId: props }
).then(async ([id, { assosiation }]) => {
    await prisma.deficiencyType.update({
        where: { id },
        data: {
            disabledDate: null,
            disabledUser: null,
        }
    });
    revalidatePath(`/[locale]/${assosiation}/app/admin/deficiency`, 'page');
});

/**
 * DAL-Method: Permanently deletes deficicyType and ALL deficiencies of this type.
 * A rollback is NOT POSSIBLE
 * revalidates path ../admin/deficiency
 * @requires AuthRole.inspector
 * @param props id of type
 * @returns void
 */
export const deleteDeficiencyType = (props: string) => genericSAValidator(
    AuthRole.materialManager,
    props,
    z.string().uuid(),
    { deficiencytypeId: props }
).then(async ([id, { assosiation }]) => prisma.$transaction(async (client) => {
    const type = await client.deficiencyType.findUniqueOrThrow({
        where: { id },
        include: {
            deficiencyList: true
        }
    });

    if (!type.disabledDate && type.deficiencyList.length > 0) {
        throw new Error("DeficiencyType can not be deleted. Type is active with deficiencies");
    }

    await client.deficiency.deleteMany({
        where: {
            fk_deficiencyType: id,
        }
    });
    await client.deficiencyType.delete({
        where: { id }
    });
    revalidatePath(`/[locale]/${assosiation}/app/admin/deficiency`, 'page');
}));
