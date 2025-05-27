import { genericSANoDataValidator, genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { Deficiency } from "@/types/deficiencyTypes";
import { uniformHistoryArgs, UniformHistroyEntry } from "@/types/globalUniformTypes";
import { z } from "zod";

/**
 * Get all uniform items for the assosiation
 * @requires AuthRole.user
 * @returns List of labels for uniform items
 */
export const getItemLabels = async () => genericSANoDataValidator(
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
    }
})).then(data => data.map(item => ({
    id: item.id,
    label: `${item.type.name}-${item.number}`,
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
