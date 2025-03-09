import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";

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
