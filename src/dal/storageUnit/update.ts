import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { storageUnitFormSchema } from "@/zod/storage";
import { z } from "zod";
import { __unsecuredGetUnitsWithUniformItems } from "./get";

const propShema = z.object({
    id: z.string().uuid(),
    data: storageUnitFormSchema.partial(),
});
type PropType = z.infer<typeof propShema>;
export const update = (props: PropType) => genericSAValidator(
    AuthRole.materialManager,
    props,
    propShema,
    { storageUnitId: props.id }
).then(async ([{ assosiation }, { id, data }]) => prisma.$transaction(async (client) => {

    if (data.name) {
        const unitList = await client.storageUnit.findMany({
            where: { assosiationId: assosiation }
        });

        if (unitList.some(unit => unit.id !== id && unit.name === data.name)) {
            return {
                error: {
                    formElement: 'name',
                    message: 'custom.nameDuplication.storageUnit'
                }
            }
        }
    }
    await client.storageUnit.update({
        where: { id },
        data
    });
    return __unsecuredGetUnitsWithUniformItems(assosiation, client);
}));
