import { genericSANoDataValidator, genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { Deficiency } from "@/types/deficiencyTypes";
import { uniformHistoryArgs, UniformHistroyEntry } from "@/types/globalUniformTypes";
import { z } from "zod";

export type ItemLabel = {
    id: string;
    label: string;
    isReserve: boolean;
    owner: {
        id: string;
        firstname: string;
        lastname: string;
    } | null;
    storageUnit: {
        id: string;
        name: string;
    } | null;
}
/**
 * Get all uniform items for the assosiation
 * @requires AuthRole.user
 * @returns List of labels for uniform items
 */
export const getItemLabels = async (): Promise<ItemLabel[]> => genericSANoDataValidator(
    AuthRole.user,
).then(([{ assosiation }]) => prisma.uniform.findMany({
    where: {
        type: {
            fk_assosiation: assosiation
        },
        recdelete: null,
    },
    include: {
        type: true,
        storageUnit: true,
        issuedEntries: {
            where: {
                dateReturned: null,
            },
            include: {
                cadet: true,
            },
        },
    },
})).then(data => data.map((item): ItemLabel => ({
    id: item.id,
    label: `${item.type.name}-${item.number}`,
    isReserve: item.isReserve,
    owner: item.issuedEntries.length > 0 ? {
        id: item.issuedEntries[0].cadet.id,
        firstname: item.issuedEntries[0].cadet.firstname,
        lastname: item.issuedEntries[0].cadet.lastname,
    } : null,
    storageUnit: item.storageUnit ? {
        id: item.storageUnit.id,
        name: item.storageUnit.name,
    } : null,
})));


export const getHistory = async (props: string): Promise<UniformHistroyEntry[]> => genericSAValidator(
    AuthRole.inspector,
    props,
    z.string().uuid(),
    { uniformId: props }
).then(([, uniformId]) => prisma.uniformIssued.findMany({
    where: {
        fk_uniform: uniformId,
    },
    ...uniformHistoryArgs,
}));

const getDeficienciesPropSchema = z.object({
    uniformId: z.string().uuid(),
    includeResolved: z.boolean().optional(),
});
type GetDeficienciesProps = z.infer<typeof getDeficienciesPropSchema>;

export const getDeficiencies = async (props: GetDeficienciesProps): Promise<Deficiency[]> => genericSAValidator(
    AuthRole.inspector,
    props,
    getDeficienciesPropSchema,
    { uniformId: props.uniformId }
).then(([, { uniformId, includeResolved }]) => prisma.deficiency.findMany({
    where: {
        uniformDeficiency: {
            fk_uniform: uniformId,
        },
        dateResolved: includeResolved ? undefined : null,
    },
    include: {
        type: true,
        uniformDeficiency: true,
    },
    orderBy: [
        { dateCreated: 'asc' },  // Oldest to newest
    ],
})).then((deficiencies) =>
    deficiencies.map((deficiency): Deficiency => ({
        id: deficiency.id,
        typeId: deficiency.type.id,
        typeName: deficiency.type.name,
        description: deficiency.description,
        comment: deficiency.comment,
        dateCreated: deficiency.dateCreated,
        dateUpdated: deficiency.dateUpdated,
        dateResolved: deficiency.dateResolved,
        userCreated: deficiency.userCreated,
        userUpdated: deficiency.userUpdated,
        userResolved: deficiency.userResolved,
    }))
);
